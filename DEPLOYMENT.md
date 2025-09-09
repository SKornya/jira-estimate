# 🚀 Руководство по развертыванию Jira Estimate

Это руководство поможет вам развернуть приложение Jira Estimate с базой данных PostgreSQL.

## 📋 Содержание

- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)
- [Локальное развертывание](#локальное-развертывание)
- [Docker развертывание](#docker-развертывание)
- [Настройка окружения](#настройка-окружения)
- [Настройка Nginx](#настройка-nginx)
- [Управление приложением](#управление-приложением)
- [Резервное копирование](#резервное-копирование)
- [Устранение неполадок](#устранение-неполадок)

## 🔧 Требования

### Минимальные требования
- **Node.js**: версия 16 или выше
- **npm**: версия 8 или выше
- **PostgreSQL**: версия 12 или выше
- **Операционная система**: macOS, Linux, Windows

### Для Docker развертывания
- **Docker**: версия 20.10 или выше
- **Docker Compose**: версия 2.0 или выше

## ⚡ Быстрый старт

### Автоматическое развертывание

1. **Клонируйте репозиторий** (если еще не сделано):
   ```bash
   git clone <repository-url>
   cd jira-estimate
   ```

2. **Сделайте скрипт исполняемым**:
   ```bash
   chmod +x deploy.sh
   ```

3. **Запустите автоматическое развертывание**:
   ```bash
   ./deploy.sh deploy
   ```

Скрипт автоматически:
- Проверит зависимости
- Установит PostgreSQL (если нужно)
- Создаст базу данных
- Настроит переменные окружения
- Установит зависимости
- Соберет клиентское приложение
- Запустит сервер

### Docker развертывание

1. **Сделайте скрипт исполняемым**:
   ```bash
   chmod +x scripts/docker-deploy.sh
   ```

2. **Запустите Docker развертывание**:
   ```bash
   ./scripts/docker-deploy.sh deploy
   ```

## 🖥️ Локальное развертывание

### 1. Установка зависимостей

#### macOS
```bash
# Установка Node.js через Homebrew
brew install node

# Установка PostgreSQL
brew install postgresql
brew services start postgresql
```

#### Ubuntu/Debian
```bash
# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows
1. Скачайте и установите Node.js с [nodejs.org](https://nodejs.org/)
2. Скачайте и установите PostgreSQL с [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Настройка базы данных

```bash
# Подключение к PostgreSQL
psql -U postgres

# Создание базы данных
CREATE DATABASE jira_estimate;

# Создание пользователя (опционально)
CREATE USER jira_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE jira_estimate TO jira_user;

# Выход
\q
```

### 3. Настройка переменных окружения

```bash
# Копирование примера конфигурации
cp env.example .env

# Редактирование конфигурации
nano .env  # или любой другой редактор
```

### 4. Установка зависимостей

```bash
# Установка зависимостей сервера
npm install

# Установка зависимостей клиента
cd client
npm install
cd ..
```

### 5. Сборка и запуск

```bash
# Сборка клиентского приложения
cd client
npm run build
cd ..

# Запуск сервера
npm start
```

## 🐳 Docker развертывание

### 1. Подготовка

```bash
# Клонирование репозитория
git clone <repository-url>
cd jira-estimate

# Создание файла .env
cp env.example .env
# Отредактируйте .env файл под ваши нужды
```

### 2. Запуск с Docker Compose

```bash
# Сборка и запуск всех сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### 3. Управление Docker контейнерами

```bash
# Остановка всех сервисов
docker-compose down

# Перезапуск сервисов
docker-compose restart

# Пересборка образов
docker-compose build --no-cache

# Просмотр логов конкретного сервиса
docker-compose logs -f server
docker-compose logs -f postgres
```

## ⚙️ Настройка окружения

### Основные переменные

| Переменная | Описание | Пример |
|------------|----------|---------|
| `POSTGRES_DB` | Имя базы данных | `jira_estimate` |
| `POSTGRES_USER` | Пользователь БД | `postgres` |
| `POSTGRES_PASSWORD` | Пароль БД | `secure_password` |
| `POSTGRES_HOST` | Хост БД | `localhost` |
| `POSTGRES_PORT` | Порт БД | `5432` |
| `PORT` | Порт сервера | `3001` |
| `JWT_SECRET` | Секретный ключ JWT | `your-secret-key` |
| `JIRA_BASE_URL` | URL Jira сервера | `https://company.atlassian.net` |
| `JIRA_USERNAME` | Имя пользователя Jira | `user@company.com` |
| `JIRA_API_TOKEN` | API токен Jira | `your-api-token` |
| `OPENAI_API_KEY` | API ключ OpenAI | `sk-your-key` |

### Настройка Jira

1. **Получение API токена**:
   - Войдите в Jira
   - Перейдите в настройки профиля
   - Создайте API токен
   - Скопируйте токен в `.env` файл

2. **Настройка URL**:
   - Укажите базовый URL вашего Jira сервера
   - Для Jira Cloud: `https://your-domain.atlassian.net`
   - Для Jira Server: `https://your-jira-server.com`

### Настройка OpenAI

1. **Получение API ключа**:
   - Зарегистрируйтесь на [OpenAI](https://openai.com/)
   - Создайте API ключ
   - Скопируйте ключ в `.env` файл

## 🌐 Настройка Nginx

Nginx автоматически настраивается при Docker развертывании и работает как reverse proxy.

### Автоматическая настройка

При использовании Docker скриптов nginx настраивается автоматически:
- ✅ Генерация SSL сертификатов
- ✅ Настройка reverse proxy
- ✅ Rate limiting и безопасность
- ✅ HTTPS редирект

### Доступные адреса

| Адрес | Описание |
|-------|----------|
| `http://localhost` | Основной сайт (через nginx) |
| `https://localhost` | HTTPS версия (через nginx) |
| `http://localhost:3000` | Фронтенд напрямую |
| `http://localhost:3001` | API напрямую |

### Ручная настройка SSL

```bash
# Самоподписанный сертификат (для разработки)
./scripts/generate-ssl.sh self-signed localhost

# Let's Encrypt сертификат (для production)
./scripts/generate-ssl.sh letsencrypt example.com admin@example.com
```

### Управление nginx

```bash
# Проверка конфигурации
docker-compose exec nginx nginx -t

# Перезагрузка конфигурации
docker-compose exec nginx nginx -s reload

# Просмотр логов
docker-compose logs -f nginx
```

**Подробная документация**: [NGINX_SETUP.md](./NGINX_SETUP.md)

## 🎮 Управление приложением

### Локальное развертывание

```bash
# Запуск приложения
./deploy.sh start

# Остановка приложения
./deploy.sh stop

# Перезапуск приложения
./deploy.sh restart

# Проверка статуса
./deploy.sh status

# Просмотр логов
./deploy.sh logs
```

### Docker развертывание

```bash
# Запуск контейнеров
./scripts/docker-deploy.sh start

# Остановка контейнеров
./scripts/docker-deploy.sh stop

# Перезапуск контейнеров
./scripts/docker-deploy.sh restart

# Проверка статуса
./scripts/docker-deploy.sh status

# Просмотр логов
./scripts/docker-deploy.sh logs
```

## 💾 Резервное копирование

### Локальная база данных

```bash
# Создание резервной копии
pg_dump -U postgres jira_estimate > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из резервной копии
psql -U postgres jira_estimate < backup_20231201_120000.sql
```

### Docker база данных

```bash
# Создание резервной копии
./scripts/docker-deploy.sh backup

# Восстановление из резервной копии
./scripts/docker-deploy.sh restore backup_20231201_120000.sql
```

### Автоматическое резервное копирование

Создайте cron задачу для автоматического резервного копирования:

```bash
# Редактирование crontab
crontab -e

# Добавление задачи (ежедневно в 2:00)
0 2 * * * /path/to/jira-estimate/scripts/backup.sh
```

## 🔍 Устранение неполадок

### Проблемы с подключением к базе данных

1. **Проверьте статус PostgreSQL**:
   ```bash
   # macOS
   brew services list | grep postgresql
   
   # Linux
   sudo systemctl status postgresql
   ```

2. **Проверьте подключение**:
   ```bash
   psql -U postgres -h localhost -p 5432 -d jira_estimate
   ```

3. **Проверьте переменные окружения**:
   ```bash
   cat .env | grep POSTGRES
   ```

### Проблемы с портами

1. **Проверьте занятые порты**:
   ```bash
   # Проверка порта 3001
   lsof -i :3001
   
   # Проверка порта 5432
   lsof -i :5432
   ```

2. **Измените порты в .env файле**:
   ```env
   PORT=3002
   POSTGRES_PORT=5433
   ```

### Проблемы с Docker

1. **Проверьте статус контейнеров**:
   ```bash
   docker-compose ps
   ```

2. **Просмотрите логи**:
   ```bash
   docker-compose logs server
   docker-compose logs postgres
   ```

3. **Пересоберите образы**:
   ```bash
   docker-compose build --no-cache
   ```

### Проблемы с зависимостями

1. **Очистите кэш npm**:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Очистите кэш клиента**:
   ```bash
   cd client
   rm -rf node_modules package-lock.json
   npm install
   cd ..
   ```

### Проблемы с правами доступа

1. **Исправьте права на скрипты**:
   ```bash
   chmod +x deploy.sh
   chmod +x scripts/docker-deploy.sh
   ```

2. **Исправьте права на файлы**:
   ```bash
   chmod 644 .env
   chmod 755 scripts/
   ```

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи приложения
2. Убедитесь, что все зависимости установлены
3. Проверьте настройки в `.env` файле
4. Обратитесь к разделу [Устранение неполадок](#устранение-неполадок)

## 🔄 Обновление приложения

### Локальное развертывание

```bash
# Остановка приложения
./deploy.sh stop

# Обновление кода
git pull origin main

# Переустановка зависимостей
npm install
cd client && npm install && cd ..

# Перезапуск
./deploy.sh start
```

### Docker развертывание

```bash
# Остановка контейнеров
./scripts/docker-deploy.sh stop

# Обновление кода
git pull origin main

# Пересборка и запуск
./scripts/docker-deploy.sh deploy
```

---

**Удачного развертывания! 🎉**
