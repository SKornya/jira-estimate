# 🌐 Настройка Nginx для Jira Estimate

## 📋 Обзор

Nginx используется в системе Jira Estimate как reverse proxy для:
- **Проксирование API запросов** к backend серверу
- **Обслуживание статических файлов** фронтенда
- **SSL/HTTPS терминация**
- **Rate limiting** и безопасность
- **Load balancing** (для production)

## 🏗️ Архитектура

```
Интернет → Nginx (порт 80/443) → Frontend (порт 3000) + Backend (порт 3001)
```

### Компоненты:

1. **Nginx Reverse Proxy** (`nginx/nginx.conf`)
   - Основной entry point
   - SSL терминация
   - Rate limiting
   - Security headers

2. **Frontend Nginx** (`client/nginx.conf`)
   - Обслуживание React приложения
   - Client-side routing
   - Статические файлы

3. **Backend Server** (Node.js)
   - API endpoints
   - Аутентификация
   - Бизнес-логика

## 🚀 Автоматическая настройка

### Docker развертывание
Nginx автоматически настраивается при использовании Docker:

```bash
# Полное развертывание с nginx
./scripts/docker-deploy.sh deploy

# Быстрое развертывание
./quick-deploy.sh docker
```

### Что происходит автоматически:
1. ✅ Генерация SSL сертификатов
2. ✅ Настройка nginx конфигурации
3. ✅ Запуск всех контейнеров
4. ✅ Проверка здоровья сервисов

## 🔧 Ручная настройка

### 1. Генерация SSL сертификатов

```bash
# Самоподписанный сертификат (для разработки)
./scripts/generate-ssl.sh self-signed localhost

# Let's Encrypt сертификат (для production)
./scripts/generate-ssl.sh letsencrypt example.com admin@example.com
```

### 2. Проверка конфигурации

```bash
# Проверка синтаксиса nginx
docker-compose exec nginx nginx -t

# Перезагрузка конфигурации
docker-compose exec nginx nginx -s reload
```

## 📁 Структура файлов

```
nginx/
├── nginx.conf          # Основная конфигурация nginx
└── ssl/
    ├── cert.pem        # SSL сертификат
    └── private.key     # Приватный ключ

client/
├── Dockerfile          # Dockerfile для фронтенда
└── nginx.conf          # Конфигурация nginx для фронтенда
```

## ⚙️ Конфигурация

### Основные настройки nginx

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Upstream серверы
upstream backend {
    server server:3001;
    keepalive 32;
}

upstream frontend {
    server frontend:80;
    keepalive 32;
}
```

### SSL настройки

```nginx
# SSL конфигурация
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/private.key;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
```

### Security headers

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## 🌐 Доступные адреса

После развертывания приложение доступно по следующим адресам:

| Адрес | Описание | Порт |
|-------|----------|------|
| `http://localhost` | Основной сайт (через nginx) | 80 |
| `https://localhost` | HTTPS версия (через nginx) | 443 |
| `http://localhost:3000` | Фронтенд напрямую | 3000 |
| `http://localhost:3001` | API напрямую | 3001 |

## 🔍 Мониторинг и логи

### Просмотр логов nginx

```bash
# Логи nginx
docker-compose logs -f nginx

# Логи всех сервисов
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f server
docker-compose logs -f frontend
```

### Проверка статуса

```bash
# Статус всех контейнеров
docker-compose ps

# Детальная информация
./scripts/docker-deploy.sh status
```

## 🛡️ Безопасность

### Rate Limiting

- **API endpoints**: 10 запросов в секунду
- **Login endpoint**: 5 запросов в минуту
- **Burst**: 20 запросов для API

### Security Headers

- `X-Frame-Options`: Защита от clickjacking
- `X-XSS-Protection`: Защита от XSS
- `X-Content-Type-Options`: Защита от MIME sniffing
- `Strict-Transport-Security`: Принудительный HTTPS
- `Content-Security-Policy`: CSP политика

### SSL/TLS

- **Протоколы**: TLSv1.2, TLSv1.3
- **Шифры**: Современные ECDHE и DHE шифры
- **HSTS**: Принудительный HTTPS на 1 год

## 🔧 Устранение неполадок

### Проблемы с SSL

```bash
# Проверка сертификата
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Проверка подключения
openssl s_client -connect localhost:443 -servername localhost
```

### Проблемы с nginx

```bash
# Проверка конфигурации
docker-compose exec nginx nginx -t

# Перезапуск nginx
docker-compose restart nginx

# Просмотр ошибок
docker-compose logs nginx | grep error
```

### Проблемы с проксированием

```bash
# Проверка upstream серверов
docker-compose exec nginx nginx -T | grep upstream

# Проверка доступности backend
curl -f http://server:3001/api/health

# Проверка доступности frontend
curl -f http://frontend:80
```

## 📊 Производительность

### Оптимизация nginx

```nginx
# Gzip сжатие
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;

# Кэширование статических файлов
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Keep-alive соединения
upstream backend {
    server server:3001;
    keepalive 32;
}
```

### Мониторинг производительности

```bash
# Использование ресурсов
docker stats

# Логи производительности
docker-compose logs nginx | grep "request_time"
```

## 🚀 Production настройки

### Для production рекомендуется:

1. **Использовать Let's Encrypt сертификаты**:
   ```bash
   ./scripts/generate-ssl.sh letsencrypt yourdomain.com admin@yourdomain.com
   ```

2. **Настроить мониторинг**:
   ```bash
   # Логи в файл
   docker-compose logs nginx > nginx.log
   ```

3. **Настроить резервное копирование**:
   ```bash
   # Резервная копия SSL сертификатов
   tar -czf ssl-backup.tar.gz nginx/ssl/
   ```

4. **Настроить автоматическое обновление сертификатов**:
   ```bash
   # Cron задача для обновления Let's Encrypt
   0 2 * * * certbot renew --quiet && docker-compose restart nginx
   ```

---

**Nginx полностью интегрирован в систему развертывания и работает автоматически! 🎉**
