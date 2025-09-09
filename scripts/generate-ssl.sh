#!/bin/bash

# Скрипт генерации SSL сертификатов для nginx
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

# Настройки
SSL_DIR="./nginx/ssl"
DOMAIN=${1:-"localhost"}

# Создание директории для SSL
mkdir -p "$SSL_DIR"

# Генерация самоподписанного сертификата
generate_self_signed_cert() {
    log_info "Генерация самоподписанного SSL сертификата для $DOMAIN..."
    
    # Генерация приватного ключа
    openssl genrsa -out "$SSL_DIR/private.key" 2048
    
    # Создание конфигурации для сертификата
    cat > "$SSL_DIR/cert.conf" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=RU
ST=Moscow
L=Moscow
O=Jira Estimate
OU=IT Department
CN=$DOMAIN

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = localhost
IP.1 = 127.0.0.1
EOF
    
    # Генерация сертификата
    openssl req -new -x509 -key "$SSL_DIR/private.key" -out "$SSL_DIR/cert.pem" -days 365 -config "$SSL_DIR/cert.conf" -extensions v3_req
    
    # Удаление временного файла конфигурации
    rm "$SSL_DIR/cert.conf"
    
    log_success "SSL сертификат создан:"
    log_info "  - Приватный ключ: $SSL_DIR/private.key"
    log_info "  - Сертификат: $SSL_DIR/cert.pem"
    log_info "  - Срок действия: 365 дней"
}

# Генерация Let's Encrypt сертификата (для production)
generate_letsencrypt_cert() {
    local email=$1
    
    if [ -z "$email" ]; then
        log_error "Для Let's Encrypt требуется email"
        echo "Использование: $0 letsencrypt <domain> <email>"
        exit 1
    fi
    
    log_info "Генерация Let's Encrypt сертификата для $DOMAIN..."
    
    # Проверка наличия certbot
    if ! command -v certbot &> /dev/null; then
        log_error "certbot не установлен. Установите certbot и попробуйте снова."
        log_info "Ubuntu/Debian: sudo apt install certbot"
        log_info "macOS: brew install certbot"
        exit 1
    fi
    
    # Генерация сертификата
    certbot certonly --standalone -d "$DOMAIN" --email "$email" --agree-tos --non-interactive
    
    # Копирование сертификатов
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/private.key"
    
    log_success "Let's Encrypt сертификат создан"
}

# Проверка существующих сертификатов
check_existing_certs() {
    if [ -f "$SSL_DIR/cert.pem" ] && [ -f "$SSL_DIR/private.key" ]; then
        log_warning "SSL сертификаты уже существуют"
        read -p "Перезаписать существующие сертификаты? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Генерация сертификатов отменена"
            exit 0
        fi
    fi
}

# Показать информацию о сертификате
show_cert_info() {
    if [ -f "$SSL_DIR/cert.pem" ]; then
        log_info "Информация о сертификате:"
        openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -E "(Subject:|Not Before|Not After|DNS:|IP:)"
    else
        log_warning "Сертификат не найден"
    fi
}

# Показать помощь
show_help() {
    echo "Скрипт генерации SSL сертификатов для nginx"
    echo ""
    echo "Использование: $0 [команда] [опции]"
    echo ""
    echo "Команды:"
    echo "  self-signed [domain]  - Генерация самоподписанного сертификата"
    echo "  letsencrypt <domain> <email> - Генерация Let's Encrypt сертификата"
    echo "  info                  - Показать информацию о существующем сертификате"
    echo "  help                  - Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 self-signed localhost           # Самоподписанный для localhost"
    echo "  $0 self-signed example.com         # Самоподписанный для example.com"
    echo "  $0 letsencrypt example.com admin@example.com  # Let's Encrypt"
    echo "  $0 info                            # Информация о сертификате"
}

# Основная логика
case "${1:-self-signed}" in
    "self-signed")
        DOMAIN=${2:-"localhost"}
        check_existing_certs
        generate_self_signed_cert
        show_cert_info
        ;;
    "letsencrypt")
        DOMAIN=${2:-"localhost"}
        EMAIL=$3
        check_existing_certs
        generate_letsencrypt_cert "$EMAIL"
        show_cert_info
        ;;
    "info")
        show_cert_info
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
