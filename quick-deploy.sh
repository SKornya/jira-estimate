#!/bin/bash

# Быстрый скрипт развертывания Jira Estimate
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

# Проверка Docker
check_docker() {
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Быстрое развертывание с Docker
docker_quick_deploy() {
    log_info "🚀 Быстрое развертывание с Docker..."
    
    # Создание .env файла с настройками по умолчанию
    if [ ! -f .env ]; then
        log_info "Создание файла .env с настройками по умолчанию..."
        cat > .env << EOF
# Database Configuration
POSTGRES_DB=jira_estimate
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Server Configuration
SERVER_PORT=3001
NODE_ENV=production
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "jwt-secret-$(date +%s)")
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
        log_success "Файл .env создан"
    fi
    
    # Генерация SSL сертификатов
    log_info "Генерация SSL сертификатов..."
    mkdir -p nginx/ssl
    if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/private.key" ]; then
        ./scripts/generate-ssl.sh self-signed localhost
    fi
    
    # Запуск контейнеров
    log_info "Запуск Docker контейнеров..."
    docker-compose up -d --build
    
    # Ожидание готовности
    log_info "Ожидание готовности сервисов..."
    sleep 15
    
    # Проверка статуса
    if curl -f http://localhost:3001/api/health &> /dev/null; then
        log_success "✅ Приложение успешно развернуто!"
        echo
        log_info "🌐 Доступные адреса:"
        log_info "   - Основной сайт (через nginx): http://localhost"
        log_info "   - HTTPS (через nginx): https://localhost"
        log_info "   - Фронтенд (напрямую): http://localhost:3000"
        log_info "   - API (напрямую): http://localhost:3001"
        log_info "   - База данных: localhost:5432"
        echo
        log_info "📝 Следующие шаги:"
        log_info "   1. Откройте http://localhost:3000 в браузере"
        log_info "   2. Зарегистрируйте первого пользователя"
        log_info "   3. Настройте Jira и OpenAI API ключи в настройках"
        echo
        log_info "🔧 Управление:"
        log_info "   - Логи: docker-compose logs -f"
        log_info "   - Остановка: docker-compose down"
        log_info "   - Перезапуск: docker-compose restart"
    else
        log_error "❌ Приложение не запустилось"
        log_info "Проверьте логи: docker-compose logs"
        exit 1
    fi
}

# Быстрое развертывание без Docker
local_quick_deploy() {
    log_info "🚀 Быстрое локальное развертывание..."
    
    # Проверка Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js не установлен. Установите Node.js и попробуйте снова."
        exit 1
    fi
    
    # Проверка PostgreSQL
    if ! command -v psql &> /dev/null; then
        log_error "PostgreSQL не установлен. Установите PostgreSQL и попробуйте снова."
        exit 1
    fi
    
    # Создание .env файла
    if [ ! -f .env ]; then
        log_info "Создание файла .env..."
        cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/jira_estimate
POSTGRES_DB=jira_estimate
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "jwt-secret-$(date +%s)")
JWT_EXPIRES_IN=24h

# Jira Configuration (заполните после развертывания)
JIRA_BASE_URL=
JIRA_USERNAME=
JIRA_API_TOKEN=

# AI Service Configuration (заполните после развертывания)
OPENAI_API_KEY=
EOF
        log_success "Файл .env создан"
    fi
    
    # Создание базы данных
    log_info "Создание базы данных..."
    psql -U postgres -c "CREATE DATABASE jira_estimate;" 2>/dev/null || log_warning "База данных уже существует"
    
    # Установка зависимостей
    log_info "Установка зависимостей..."
    npm install
    cd client && npm install && cd ..
    
    # Сборка клиента
    log_info "Сборка клиентского приложения..."
    cd client && npm run build && cd ..
    
    # Запуск сервера
    log_info "Запуск сервера..."
    nohup npm start > server.log 2>&1 &
    SERVER_PID=$!
    
    # Ожидание запуска
    sleep 5
    
    # Проверка статуса
    if curl -f http://localhost:3001/api/health &> /dev/null; then
        log_success "✅ Приложение успешно развернуто!"
        echo
        log_info "🌐 Доступные адреса:"
        log_info "   - Основной сайт (через nginx): http://localhost"
        log_info "   - HTTPS (через nginx): https://localhost"
        log_info "   - Фронтенд (напрямую): http://localhost:3000"
        log_info "   - API (напрямую): http://localhost:3001"
        log_info "   - База данных: localhost:5432"
        echo
        log_info "📝 Следующие шаги:"
        log_info "   1. Откройте http://localhost:3000 в браузере"
        log_info "   2. Зарегистрируйте первого пользователя"
        log_info "   3. Настройте Jira и OpenAI API ключи в настройках"
        echo
        log_info "🔧 Управление:"
        log_info "   - Логи: tail -f server.log"
        log_info "   - Остановка: kill $SERVER_PID"
        log_info "   - PID сервера: $SERVER_PID"
    else
        log_error "❌ Приложение не запустилось"
        log_info "Проверьте логи: cat server.log"
        exit 1
    fi
}

# Показать помощь
show_help() {
    echo "🚀 Быстрый скрипт развертывания Jira Estimate"
    echo ""
    echo "Использование: $0 [опция]"
    echo ""
    echo "Опции:"
    echo "  docker     - Развертывание с Docker (рекомендуется)"
    echo "  local      - Локальное развертывание"
    echo "  auto       - Автоматический выбор метода"
    echo "  help       - Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 docker    # Развертывание с Docker"
    echo "  $0 local     # Локальное развертывание"
    echo "  $0 auto      # Автоматический выбор"
    echo ""
    echo "Требования:"
    echo "  Docker: Docker + Docker Compose"
    echo "  Local:  Node.js 16+ + PostgreSQL 12+"
}

# Основная логика
case "${1:-auto}" in
    "docker")
        if check_docker; then
            docker_quick_deploy
        else
            log_error "Docker не установлен или не запущен"
            exit 1
        fi
        ;;
    "local")
        local_quick_deploy
        ;;
    "auto")
        if check_docker; then
            log_info "Docker обнаружен, используем Docker развертывание"
            docker_quick_deploy
        else
            log_info "Docker не обнаружен, используем локальное развертывание"
            local_quick_deploy
        fi
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        log_error "Неизвестная опция: $1"
        show_help
        exit 1
        ;;
esac
