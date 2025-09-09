#!/bin/bash

# Скрипт развертывания Jira Estimate с использованием Docker
# Автор: s.korniakov
# Версия: 1.0.0

set -e  # Остановить выполнение при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
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

# Проверка Docker
check_docker() {
    log_info "Проверка Docker..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен. Установите Docker и попробуйте снова."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
        exit 1
    fi
    
    # Проверка запуска Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon не запущен. Запустите Docker и попробуйте снова."
        exit 1
    fi
    
    log_success "Docker и Docker Compose готовы к работе"
}

# Создание файла .env для Docker
create_docker_env() {
    log_info "Создание файла .env для Docker..."
    
    if [ -f .env ]; then
        log_warning "Файл .env уже существует"
        read -p "Перезаписать файл .env? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Использование существующего файла .env"
            return
        fi
    fi
    
    # Генерация случайных паролей
    POSTGRES_PASSWORD=$(openssl rand -base64 32 2>/dev/null || echo "postgres_password_$(date +%s)")
    JWT_SECRET=$(openssl rand -base64 64 2>/dev/null || echo "jwt_secret_$(date +%s)")
    
    # Создание файла .env
    cat > .env << EOF
# Database Configuration
POSTGRES_DB=jira_estimate
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Server Configuration
SERVER_PORT=3001
NODE_ENV=production
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h

# Jira Configuration (заполните после развертывания)
JIRA_BASE_URL=
JIRA_USERNAME=
JIRA_API_TOKEN=

# AI Service Configuration (заполните после развертывания)
OPENAI_API_KEY=

# Frontend Configuration
FRONTEND_PORT=3000
EOF
    
    log_success "Файл .env создан с безопасными паролями"
}

# Настройка nginx и SSL
setup_nginx() {
    log_info "Настройка nginx и SSL..."
    
    # Создание директории для SSL
    mkdir -p nginx/ssl
    
    # Проверка существования SSL сертификатов
    if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/private.key" ]; then
        log_info "SSL сертификаты не найдены, генерируем самоподписанный сертификат..."
        ./scripts/generate-ssl.sh self-signed localhost
    else
        log_success "SSL сертификаты уже существуют"
    fi
    
    # Проверка конфигурации nginx
    if [ ! -f "nginx/nginx.conf" ]; then
        log_error "Конфигурация nginx не найдена: nginx/nginx.conf"
        exit 1
    fi
    
    log_success "nginx настроен"
}

# Сборка и запуск контейнеров
deploy_containers() {
    log_info "Сборка и запуск контейнеров..."
    
    # Настройка nginx
    setup_nginx
    
    # Остановка существующих контейнеров
    log_info "Остановка существующих контейнеров..."
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Сборка образов
    log_info "Сборка Docker образов..."
    docker-compose build --no-cache
    
    # Запуск контейнеров
    log_info "Запуск контейнеров..."
    docker-compose up -d
    
    # Ожидание готовности сервисов
    log_info "Ожидание готовности сервисов..."
    sleep 10
    
    # Проверка статуса контейнеров
    log_info "Проверка статуса контейнеров..."
    docker-compose ps
    
    # Проверка здоровья сервисов
    log_info "Проверка здоровья сервисов..."
    
    # Проверка базы данных
    if docker-compose exec -T postgres pg_isready -U postgres -d jira_estimate &> /dev/null; then
        log_success "База данных PostgreSQL готова"
    else
        log_error "База данных PostgreSQL не готова"
        docker-compose logs postgres
        exit 1
    fi
    
    # Проверка сервера
    sleep 5
    if curl -f http://localhost:3001/api/health &> /dev/null; then
        log_success "Сервер готов"
    else
        log_error "Сервер не готов"
        docker-compose logs server
        exit 1
    fi
    
    # Проверка фронтенда
    if curl -f http://localhost:3000 &> /dev/null; then
        log_success "Фронтенд готов"
    else
        log_warning "Фронтенд не готов (это нормально для первого запуска)"
    fi
    
    # Проверка nginx
    sleep 5
    if curl -f http://localhost:80/health &> /dev/null; then
        log_success "nginx готов"
    else
        log_warning "nginx не готов"
    fi
}

# Показать статус
show_status() {
    log_info "Статус контейнеров:"
    docker-compose ps
    
    log_info "Использование ресурсов:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    
    log_info "Логи сервера (последние 10 строк):"
    docker-compose logs --tail=10 server
    
    log_info "Логи базы данных (последние 5 строк):"
    docker-compose logs --tail=5 postgres
    
    log_info "Логи nginx (последние 5 строк):"
    docker-compose logs --tail=5 nginx
}

# Показать логи
show_logs() {
    local service=${1:-""}
    
    if [ -z "$service" ]; then
        log_info "Логи всех сервисов:"
        docker-compose logs -f
    else
        log_info "Логи сервиса $service:"
        docker-compose logs -f "$service"
    fi
}

# Остановка контейнеров
stop_containers() {
    log_info "Остановка контейнеров..."
    docker-compose down
    log_success "Контейнеры остановлены"
}

# Перезапуск контейнеров
restart_containers() {
    log_info "Перезапуск контейнеров..."
    docker-compose restart
    log_success "Контейнеры перезапущены"
}

# Очистка системы
cleanup() {
    log_info "Очистка Docker системы..."
    
    read -p "Удалить все контейнеры, образы и volumes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v --remove-orphans
        docker system prune -a -f
        log_success "Система очищена"
    else
        log_info "Очистка отменена"
    fi
}

# Резервное копирование базы данных
backup_database() {
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    log_info "Создание резервной копии базы данных..."
    
    docker-compose exec -T postgres pg_dump -U postgres jira_estimate > "$backup_file"
    
    if [ -f "$backup_file" ]; then
        log_success "Резервная копия создана: $backup_file"
    else
        log_error "Ошибка создания резервной копии"
        exit 1
    fi
}

# Восстановление базы данных
restore_database() {
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
    
    log_info "Восстановление базы данных из $backup_file..."
    
    read -p "Это действие перезапишет текущую базу данных. Продолжить? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Восстановление отменено"
        exit 0
    fi
    
    docker-compose exec -T postgres psql -U postgres -d jira_estimate < "$backup_file"
    log_success "База данных восстановлена"
}

# Показать помощь
show_help() {
    echo "Скрипт развертывания Jira Estimate с Docker"
    echo ""
    echo "Использование: $0 [команда] [опции]"
    echo ""
    echo "Команды:"
    echo "  deploy     - Полное развертывание приложения"
    echo "  start      - Запуск контейнеров"
    echo "  stop       - Остановка контейнеров"
    echo "  restart    - Перезапуск контейнеров"
    echo "  status     - Показать статус контейнеров"
    echo "  logs       - Показать логи (опционально: имя сервиса)"
    echo "  backup     - Создать резервную копию базы данных"
    echo "  restore    - Восстановить базу данных из резервной копии"
    echo "  cleanup    - Очистить Docker систему"
    echo "  help       - Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 deploy                    # Полное развертывание"
    echo "  $0 logs server               # Логи сервера"
    echo "  $0 backup                    # Резервная копия"
    echo "  $0 restore backup.sql        # Восстановление"
}

# Основная функция развертывания
deploy() {
    log_info "Начинаем развертывание Jira Estimate с Docker..."
    
    check_docker
    create_docker_env
    deploy_containers
    
    log_success "Развертывание завершено успешно!"
    log_info "Приложение доступно по адресам:"
    log_info "  - Основной сайт (через nginx): http://localhost"
    log_info "  - HTTPS (через nginx): https://localhost"
    log_info "  - Фронтенд (напрямую): http://localhost:3000"
    log_info "  - API (напрямую): http://localhost:3001"
    log_info "  - База данных: localhost:5432"
    log_info ""
    log_info "Для управления используйте:"
    log_info "  $0 status    # Проверка статуса"
    log_info "  $0 logs      # Просмотр логов"
    log_info "  $0 stop      # Остановка"
}

# Обработка аргументов командной строки
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "start")
        docker-compose up -d
        ;;
    "stop")
        stop_containers
        ;;
    "restart")
        restart_containers
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "backup")
        backup_database
        ;;
    "restore")
        restore_database "$2"
        ;;
    "cleanup")
        cleanup
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
