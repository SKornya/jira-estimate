# Миграция с MongoDB на PostgreSQL - Сводка изменений

## Выполненные изменения

### 1. Обновление зависимостей
- **Удалено**: `mongoose` (MongoDB ODM)
- **Добавлено**: `pg` (PostgreSQL драйвер) и `sequelize` (ORM)

### 2. Конфигурация базы данных
- **Создан**: `server/config/database.js` - настройка подключения к PostgreSQL
- **Обновлен**: `server/index.js` - замена подключения MongoDB на PostgreSQL

### 3. Модели данных
- **Переписаны**: `server/models/User.js` и `server/models/Task.js` для работы с Sequelize
- **Создан**: `server/models/index.js` - экспорт всех моделей

### 4. Маршруты API
- **Обновлены**: все маршруты в `server/routes/` для работы с Sequelize
- **Изменены**: запросы с MongoDB синтаксиса на Sequelize синтаксис
- **Обновлена**: статистика задач с использованием Sequelize агрегации

### 5. Middleware
- **Обновлен**: `server/middleware/auth.js` для работы с Sequelize

### 6. Переменные окружения
- **Обновлен**: `env.example` с настройками PostgreSQL
- **Добавлены**: новые переменные для подключения к PostgreSQL

## Структура базы данных

### Таблица `users`
- `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- `username` (STRING, UNIQUE, NOT NULL)
- `email` (STRING, UNIQUE, NOT NULL)
- `password` (STRING, NOT NULL)
- `jira_username` (STRING, NOT NULL)
- `jira_base_url` (STRING)
- `jira_email` (STRING)
- `jira_api_token` (STRING)
- `last_login` (DATE)
- `created_at` (DATE)
- `updated_at` (DATE)

### Таблица `tasks`
- `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- `jira_key` (STRING, UNIQUE, NOT NULL)
- `jira_id` (STRING, NOT NULL)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `issue_type` (ENUM: Story, Task, Bug, Epic, Portfolio)
- `status` (STRING, NOT NULL)
- `priority` (STRING)
- `assignee` (STRING, NOT NULL)
- `reporter` (STRING, NOT NULL)
- `project_key` (STRING)
- `project_name` (STRING)
- `repository` (STRING)
- `created` (DATE, NOT NULL)
- `started` (DATE)
- `completed` (DATE)
- `parent_key` (STRING)
- `subtasks` (JSON)
- `original_estimate` (INTEGER)
- `time_spent` (INTEGER)
- `ai_estimate` (INTEGER)
- `ai_confidence` (FLOAT)
- `ai_reasoning` (TEXT)
- `ai_similar_tasks` (JSON)
- `ai_estimate_created_at` (DATE)
- `labels` (JSON)
- `components` (JSON)
- `fix_versions` (JSON)
- `last_synced` (DATE)
- `sync_status` (ENUM: synced, pending, error)
- `created_at` (DATE)
- `updated_at` (DATE)

## Следующие шаги

1. Установите PostgreSQL на вашей системе
2. Создайте базу данных `jira_estimate`
3. Настройте переменные окружения в файле `.env`
4. Установите зависимости: `npm install`
5. Запустите приложение: `npm run dev`

## Примечания

- Sequelize автоматически создаст таблицы при первом запуске
- Все индексы будут созданы автоматически
- Хеширование паролей работает через Sequelize hooks
- JSON поля используются для массивов (labels, components, etc.)
