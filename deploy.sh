#!/bin/bash

# Скрипт развертывания Jira Estimate приложения
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

# Проверка операционной системы
check_os() {
    log_info "Проверка операционной системы..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        log_success "Обнаружена macOS"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        log_success "Обнаружен Linux"
    else
        log_error "Неподдерживаемая операционная система: $OSTYPE"
        exit 1
    fi
}

# Проверка зависимостей
check_dependencies() {
    log_info "Проверка зависимостей..."
    
    # Проверка Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js не установлен. Установите Node.js версии 16 или выше."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        log_error "Требуется Node.js версии 16 или выше. Текущая версия: $(node --version)"
        exit 1
    fi
    log_success "Node.js $(node --version) найден"
    
    # Проверка npm
    if ! command -v npm &> /dev/null; then
        log_error "npm не установлен"
        exit 1
    fi
    log_success "npm $(npm --version) найден"
    
    # Проверка PostgreSQL
    if ! command -v psql &> /dev/null; then
        log_warning "PostgreSQL не найден. Будет предложена установка."
        install_postgresql
    else
        log_success "PostgreSQL найден"
    fi
    
    # Проверка Docker (опционально)
    if command -v docker &> /dev/null; then
        log_success "Docker найден - доступно контейнерное развертывание"
        DOCKER_AVAILABLE=true
    else
        log_warning "Docker не найден - будет использовано локальное развертывание"
        DOCKER_AVAILABLE=false
    fi
}

# Установка PostgreSQL
install_postgresql() {
    log_info "Установка PostgreSQL..."
    
    if [ "$OS" == "macos" ]; then
        if command -v brew &> /dev/null; then
            log_info "Установка PostgreSQL через Homebrew..."
            brew install postgresql
            brew services start postgresql
        else
            log_error "Homebrew не найден. Установите PostgreSQL вручную с https://www.postgresql.org/download/"
            exit 1
        fi
    elif [ "$OS" == "linux" ]; then
        log_info "Установка PostgreSQL через apt..."
        sudo apt update
        sudo apt install -y postgresql postgresql-contrib
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    fi
    
    log_success "PostgreSQL установлен и запущен"
}

# Создание базы данных
setup_database() {
    log_info "Настройка базы данных..."
    
    # Проверка существования базы данных
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw jira_estimate; then
        log_warning "База данных jira_estimate уже существует"
        read -p "Пересоздать базу данных? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Удаление существующей базы данных..."
            psql -U postgres -c "DROP DATABASE IF EXISTS jira_estimate;"
        else
            log_info "Использование существующей базы данных"
            return
        fi
    fi
    
    # Создание базы данных
    log_info "Создание базы данных jira_estimate..."
    psql -U postgres -c "CREATE DATABASE jira_estimate;"
    
    # Создание пользователя (опционально)
    read -p "Создать отдельного пользователя для базы данных? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Введите имя пользователя (по умолчанию: jira_user): " DB_USER
        DB_USER=${DB_USER:-jira_user}
        
        read -s -p "Введите пароль для пользователя: " DB_PASSWORD
        echo
        
        psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
        psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE jira_estimate TO $DB_USER;"
        
        log_success "Пользователь $DB_USER создан"
    fi
    
    log_success "База данных настроена"
}

# Создание файла .env
create_env_file() {
    log_info "Создание файла конфигурации .env..."
    
    if [ -f .env ]; then
        log_warning "Файл .env уже существует"
        read -p "Перезаписать файл .env? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Использование существующего файла .env"
            return
        fi
    fi
    
    # Запрос конфигурации
    read -p "Введите хост PostgreSQL (по умолчанию: localhost): " POSTGRES_HOST
    POSTGRES_HOST=${POSTGRES_HOST:-localhost}
    
    read -p "Введите порт PostgreSQL (по умолчанию: 5432): " POSTGRES_PORT
    POSTGRES_PORT=${POSTGRES_PORT:-5432}
    
    read -p "Введите имя пользователя PostgreSQL (по умолчанию: postgres): " POSTGRES_USER
    POSTGRES_USER=${POSTGRES_USER:-postgres}
    
    read -s -p "Введите пароль PostgreSQL: " POSTGRES_PASSWORD
    echo
    
    read -p "Введите имя базы данных (по умолчанию: jira_estimate): " POSTGRES_DB
    POSTGRES_DB=${POSTGRES_DB:-jira_estimate}
    
    read -p "Введите порт сервера (по умолчанию: 3001): " SERVER_PORT
    SERVER_PORT=${SERVER_PORT:-3001}
    
    read -p "Введите URL фронтенда (по умолчанию: http://localhost:3000): " FRONTEND_URL
    FRONTEND_URL=${FRONTEND_URL:-http://localhost:3000}
    
    # Генерация JWT секрета
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your-secret-key-change-in-production")
    
    # Создание файла .env
    cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB
POSTGRES_DB=$POSTGRES_DB
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_HOST=$POSTGRES_HOST
POSTGRES_PORT=$POSTGRES_PORT

# Server Configuration
PORT=$SERVER_PORT
NODE_ENV=production
FRONTEND_URL=$FRONTEND_URL

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h

# Jira Configuration (заполните после развертывания)
JIRA_BASE_URL=
JIRA_USERNAME=
JIRA_API_TOKEN=

# AI Service Configuration (заполните после развертывания)
OPENAI_API_KEY=
EOF
    
    log_success "Файл .env создан"
}

# Установка зависимостей
install_dependencies() {
    log_info "Установка зависимостей..."
    
    # Установка зависимостей корневого проекта
    log_info "Установка зависимостей сервера..."
    npm install
    
    # Установка зависимостей клиента
    log_info "Установка зависимостей клиента..."
    cd client
    npm install
    cd ..
    
    log_success "Все зависимости установлены"
}

# Сборка клиента
build_client() {
    log_info "Сборка клиентского приложения..."
    
    cd client
    npm run build
    cd ..
    
    log_success "Клиентское приложение собрано"
}

# Запуск приложения
start_application() {
    log_info "Запуск приложения..."
    
    # Проверка доступности базы данных
    log_info "Проверка подключения к базе данных..."
    if ! psql -U $POSTGRES_USER -h $POSTGRES_HOST -p $POSTGRES_PORT -d $POSTGRES_DB -c "SELECT 1;" &> /dev/null; then
        log_error "Не удается подключиться к базе данных"
        exit 1
    fi
    log_success "Подключение к базе данных успешно"
    
    # Запуск сервера
    log_info "Запуск сервера на порту $SERVER_PORT..."
    nohup npm start > server.log 2>&1 &
    SERVER_PID=$!
    
    # Ожидание запуска сервера
    sleep 5
    
    # Проверка запуска сервера
    if curl -f http://localhost:$SERVER_PORT/api/health &> /dev/null; then
        log_success "Сервер успешно запущен"
        log_info "Сервер доступен по адресу: http://localhost:$SERVER_PORT"
        log_info "Логи сервера: server.log"
        log_info "PID сервера: $SERVER_PID"
    else
        log_error "Сервер не запустился. Проверьте логи в server.log"
        exit 1
    fi
}

# Остановка приложения
stop_application() {
    log_info "Остановка приложения..."
    
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
        log_success "Сервер остановлен"
    fi
    
    # Поиск и остановка процессов Node.js
    pkill -f "node.*server/index.js" 2>/dev/null || true
    log_success "Все процессы приложения остановлены"
}

# Показать статус
show_status() {
    log_info "Статус приложения:"
    
    # Проверка базы данных
    if psql -U $POSTGRES_USER -h $POSTGRES_HOST -p $POSTGRES_PORT -d $POSTGRES_DB -c "SELECT 1;" &> /dev/null; then
        log_success "База данных: доступна"
    else
        log_error "База данных: недоступна"
    fi
    
    # Проверка сервера
    if curl -f http://localhost:$SERVER_PORT/api/health &> /dev/null; then
        log_success "Сервер: работает"
    else
        log_error "Сервер: не работает"
    fi
    
    # Показать логи
    if [ -f server.log ]; then
        log_info "Последние 10 строк логов сервера:"
        tail -10 server.log
    fi
}

# Показать помощь
show_help() {
    echo "Скрипт развертывания Jira Estimate"
    echo ""
    echo "Использование: $0 [команда]"
    echo ""
    echo "Команды:"
    echo "  deploy     - Полное развертывание приложения"
    echo "  start      - Запуск приложения"
    echo "  stop       - Остановка приложения"
    echo "  restart    - Перезапуск приложения"
    echo "  status     - Показать статус приложения"
    echo "  logs       - Показать логи сервера"
    echo "  help       - Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 deploy    # Полное развертывание"
    echo "  $0 start     # Запуск приложения"
    echo "  $0 status    # Проверка статуса"
}

# Показать логи
show_logs() {
    if [ -f server.log ]; then
        log_info "Логи сервера:"
        tail -f server.log
    else
        log_warning "Файл логов не найден"
    fi
}

# Основная функция развертывания
deploy() {
    log_info "Начинаем развертывание Jira Estimate..."
    
    check_os
    check_dependencies
    setup_database
    create_env_file
    install_dependencies
    build_client
    start_application
    
    log_success "Развертывание завершено успешно!"
    log_info "Приложение доступно по адресу: http://localhost:$SERVER_PORT"
    log_info "Для остановки используйте: $0 stop"
    log_info "Для проверки статуса используйте: $0 status"
}

# Обработка аргументов командной строки
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "start")
        start_application
        ;;
    "stop")
        stop_application
        ;;
    "restart")
        stop_application
        sleep 2
        start_application
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
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
