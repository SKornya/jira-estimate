#!/bin/bash

# Скрипт резервного копирования для Jira Estimate
# Автор: s.korniakov
# Версия: 1.0.0

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Функции для вывода
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Загрузка переменных окружения
if [ -f .env ]; then
    source .env
else
    log_error "Файл .env не найден"
    exit 1
fi

# Настройки по умолчанию
BACKUP_DIR=${BACKUP_PATH:-./backups}
DB_NAME=${POSTGRES_DB:-jira_estimate}
DB_USER=${POSTGRES_USER:-postgres}
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# Создание директории для резервных копий
mkdir -p "$BACKUP_DIR"

# Генерация имени файла резервной копии
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
BACKUP_FILE_COMPRESSED="${BACKUP_FILE}.gz"

# Функция создания резервной копии
create_backup() {
    log_info "Создание резервной копии базы данных $DB_NAME..."
    
    # Проверка подключения к базе данных
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" &> /dev/null; then
        log_error "База данных недоступна"
        exit 1
    fi
    
    # Создание резервной копии
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --no-password --format=plain > "$BACKUP_FILE" 2>/dev/null; then
        log_success "Резервная копия создана: $BACKUP_FILE"
    else
        log_error "Ошибка создания резервной копии"
        exit 1
    fi
    
    # Сжатие резервной копии
    if gzip "$BACKUP_FILE"; then
        log_success "Резервная копия сжата: $BACKUP_FILE_COMPRESSED"
        BACKUP_FILE="$BACKUP_FILE_COMPRESSED"
    else
        log_warning "Не удалось сжать резервную копию"
    fi
    
    # Получение размера файла
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_info "Размер резервной копии: $BACKUP_SIZE"
    
    return 0
}

# Функция восстановления из резервной копии
restore_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        log_error "Укажите файл резервной копии"
        echo "Использование: $0 restore <backup_file>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "Файл резервной копии не найден: $backup_file"
        exit 1
    fi
    
    log_warning "Восстановление из резервной копии: $backup_file"
    log_warning "Это действие перезапишет текущую базу данных!"
    
    read -p "Продолжить? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Восстановление отменено"
        exit 0
    fi
    
    # Проверка подключения к базе данных
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" &> /dev/null; then
        log_error "База данных недоступна"
        exit 1
    fi
    
    # Восстановление из резервной копии
    if [[ "$backup_file" == *.gz ]]; then
        # Сжатая резервная копия
        if gunzip -c "$backup_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" &> /dev/null; then
            log_success "База данных восстановлена из сжатой резервной копии"
        else
            log_error "Ошибка восстановления из сжатой резервной копии"
            exit 1
        fi
    else
        # Обычная резервная копия
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$backup_file" &> /dev/null; then
            log_success "База данных восстановлена"
        else
            log_error "Ошибка восстановления базы данных"
            exit 1
        fi
    fi
}

# Функция очистки старых резервных копий
cleanup_old_backups() {
    log_info "Очистка резервных копий старше $RETENTION_DAYS дней..."
    
    local deleted_count=0
    
    # Поиск и удаление старых файлов
    while IFS= read -r -d '' file; do
        if rm "$file"; then
            log_info "Удален: $(basename "$file")"
            ((deleted_count++))
        fi
    done < <(find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.sql*" -type f -mtime +$RETENTION_DAYS -print0)
    
    if [ $deleted_count -eq 0 ]; then
        log_info "Старые резервные копии не найдены"
    else
        log_success "Удалено $deleted_count старых резервных копий"
    fi
}

# Функция показа списка резервных копий
list_backups() {
    log_info "Список резервных копий:"
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        log_warning "Резервные копии не найдены"
        return 0
    fi
    
    echo
    printf "%-50s %-12s %-20s\n" "Файл" "Размер" "Дата создания"
    printf "%-50s %-12s %-20s\n" "----" "----" "-------------"
    
    for file in "$BACKUP_DIR"/backup_${DB_NAME}_*.sql*; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            size=$(du -h "$file" | cut -f1)
            date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1 || stat -f %Sm -t %Y-%m-%d "$file" 2>/dev/null)
            printf "%-50s %-12s %-20s\n" "$filename" "$size" "$date"
        fi
    done
    echo
}

# Функция проверки целостности резервной копии
verify_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        log_error "Укажите файл резервной копии"
        echo "Использование: $0 verify <backup_file>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "Файл резервной копии не найден: $backup_file"
        exit 1
    fi
    
    log_info "Проверка целостности резервной копии: $backup_file"
    
    # Проверка сжатой резервной копии
    if [[ "$backup_file" == *.gz ]]; then
        if gunzip -t "$backup_file" 2>/dev/null; then
            log_success "Сжатая резервная копия не повреждена"
        else
            log_error "Сжатая резервная копия повреждена"
            exit 1
        fi
    else
        # Проверка обычной резервной копии
        if head -n 1 "$backup_file" | grep -q "PostgreSQL database dump"; then
            log_success "Резервная копия имеет корректный формат"
        else
            log_error "Резервная копия имеет некорректный формат"
            exit 1
        fi
    fi
}

# Функция показа помощи
show_help() {
    echo "Скрипт резервного копирования Jira Estimate"
    echo ""
    echo "Использование: $0 [команда] [опции]"
    echo ""
    echo "Команды:"
    echo "  backup     - Создать резервную копию"
    echo "  restore    - Восстановить из резервной копии"
    echo "  list       - Показать список резервных копий"
    echo "  cleanup    - Удалить старые резервные копии"
    echo "  verify     - Проверить целостность резервной копии"
    echo "  help       - Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 backup                                    # Создать резервную копию"
    echo "  $0 restore backup_jira_estimate_20231201.sql # Восстановить из резервной копии"
    echo "  $0 list                                      # Показать список резервных копий"
    echo "  $0 cleanup                                   # Удалить старые резервные копии"
    echo "  $0 verify backup_jira_estimate_20231201.sql  # Проверить резервную копию"
    echo ""
    echo "Переменные окружения:"
    echo "  BACKUP_PATH              - Путь к директории резервных копий (по умолчанию: ./backups)"
    echo "  BACKUP_RETENTION_DAYS    - Количество дней хранения резервных копий (по умолчанию: 30)"
    echo "  POSTGRES_DB              - Имя базы данных (по умолчанию: jira_estimate)"
    echo "  POSTGRES_USER            - Пользователь базы данных (по умолчанию: postgres)"
    echo "  POSTGRES_HOST            - Хост базы данных (по умолчанию: localhost)"
    echo "  POSTGRES_PORT            - Порт базы данных (по умолчанию: 5432)"
}

# Основная логика
case "${1:-backup}" in
    "backup")
        create_backup
        cleanup_old_backups
        ;;
    "restore")
        restore_backup "$2"
        ;;
    "list")
        list_backups
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "verify")
        verify_backup "$2"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        log_error "Неизвестная команда: $1"
        show_help
        exit 1
        ;;
esac
