# Настройка PostgreSQL для Jira Estimate

## Установка PostgreSQL

### macOS (с Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Windows
Скачайте и установите PostgreSQL с официального сайта: https://www.postgresql.org/download/windows/

## Создание базы данных

1. Подключитесь к PostgreSQL:
```bash
psql -U postgres
```

2. Создайте базу данных:
```sql
CREATE DATABASE jira_estimate;
```

3. Создайте пользователя (опционально):
```sql
CREATE USER jira_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE jira_estimate TO jira_user;
```

4. Выйдите из psql:
```sql
\q
```

## Настройка переменных окружения

Скопируйте файл `env.example` в `.env` и настройте переменные:

```bash
cp env.example .env
```

Обновите следующие переменные в `.env`:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/jira_estimate
POSTGRES_DB=jira_estimate
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

## Установка зависимостей

```bash
npm install
```

## Запуск приложения

```bash
npm run dev
```

При первом запуске Sequelize автоматически создаст необходимые таблицы в базе данных.

## Проверка подключения

Вы можете проверить подключение к базе данных, выполнив:

```bash
psql -U postgres -d jira_estimate -c "\dt"
```

Эта команда покажет все таблицы в базе данных.

## Миграции

Sequelize автоматически создаст таблицы при первом запуске. Если нужно принудительно пересоздать таблицы, установите `force: true` в файле `server/config/database.js` в функции `syncDatabase`.

## Резервное копирование

Для создания резервной копии базы данных:

```bash
pg_dump -U postgres jira_estimate > backup.sql
```

Для восстановления из резервной копии:

```bash
psql -U postgres jira_estimate < backup.sql
```
