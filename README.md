# Jira Estimate

Веб-приложение для оценки времени выполнения задач в Jira с использованием искусственного интеллекта.

## Возможности

- 🔗 **Интеграция с Jira** - автоматическое получение задач по ссылке
- 🤖 **ИИ-анализ** - точная оценка времени с использованием нейросети
- 📊 **Сравнение с похожими задачами** - анализ исторических данных
- 📈 **Статистика и история** - отслеживание точности оценок
- 🎨 **Современный интерфейс** - адаптивный дизайн с пастельной палитрой
- 🔐 **Безопасность** - JWT аутентификация и защищенные маршруты

## Технологии

### Backend
- **Node.js** + **Express.js** - серверная часть
- **MongoDB** + **Mongoose** - база данных
- **JWT** - аутентификация
- **OpenAI API** - ИИ для оценки времени
- **Jira REST API** - интеграция с Jira

### Frontend
- **React** + **TypeScript** - клиентская часть
- **Styled Components** - стилизация
- **React Router** - маршрутизация
- **React Hook Form** + **Yup** - формы и валидация
- **Framer Motion** - анимации
- **Lucide React** - иконки

## Установка и запуск

### Предварительные требования
- Node.js (версия 18 или выше)
- MongoDB
- Аккаунт в Jira с API токеном
- API ключ OpenAI

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd jira-estimate
```

### 2. Установка зависимостей
```bash
# Установка зависимостей для всего проекта
npm run install-all
```

### 3. Настройка переменных окружения

Создайте файл `.env` в корне проекта на основе `env.example`:

```bash
cp env.example .env
```

Заполните переменные в `.env`:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/jira_estimate

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Encryption Configuration
ENCRYPTION_KEY=your-very-secure-encryption-key
```

**Важно:** Настройки Jira и AI сервисов теперь настраиваются через интерфейс приложения в разделе "Настройки" после регистрации.

Создайте файл `.env` в папке `client` на основе `client/env.example`:

```bash
cp client/env.example client/.env
```

### 4. Запуск приложения

#### Режим разработки
```bash
# Запуск backend и frontend одновременно
npm run dev
```

Или запуск по отдельности:

```bash
# Backend (порт 5000)
npm run server

# Frontend (порт 3000)
npm run client
```

#### Продакшн режим
```bash
# Сборка frontend
npm run build

# Запуск только backend
npm run server
```

## Использование

### 1. Регистрация
- Откройте приложение в браузере
- Нажмите "Зарегистрироваться"
- Заполните форму регистрации с основными данными

### 2. Настройка сервисов
После регистрации перейдите в раздел "Настройки" и настройте:

**Jira:**
- URL вашего Jira (например: https://your-domain.atlassian.net)
- Имя пользователя Jira
- Email для Jira
- API токен Jira (создайте в настройках профиля Jira)

**AI сервис:**
- Хост AI сервиса (например: https://api.openai.com)
- API токен AI сервиса

### 3. Получение оценки
- Войдите в систему
- Вставьте ссылку на задачу Jira в форму
- Нажмите "Загрузить задачу"
- Просмотрите информацию о задаче
- Нажмите "Получить оценку времени"
- Дождитесь завершения анализа ИИ
- Просмотрите результат с обоснованием

### 3. Поддерживаемые типы задач
- **Story** - пользовательские истории
- **Task** - обычные задачи
- **Bug** - баги
- **Epic** - эпики
- **Portfolio** - портфели (с автоматической загрузкой подзадач)

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - регистрация
- `POST /api/auth/login` - вход
- `GET /api/auth/me` - информация о пользователе
- `GET /api/auth/verify` - проверка токена

### Jira
- `POST /api/jira/fetch-issue` - получение задачи по URL
- `POST /api/jira/sync-user-tasks` - синхронизация задач пользователя
- `GET /api/jira/test-connection` - проверка подключения к Jira

### Оценка времени
- `POST /api/estimation/estimate` - получение оценки времени
- `GET /api/estimation/history` - история оценок
- `GET /api/estimation/stats` - статистика оценок

### Задачи
- `GET /api/tasks` - список задач пользователя
- `GET /api/tasks/:jiraKey` - информация о конкретной задаче
- `GET /api/tasks/:jiraKey/similar` - похожие задачи
- `PUT /api/tasks/:jiraKey` - обновление задачи
- `DELETE /api/tasks/:jiraKey` - удаление задачи
- `GET /api/tasks/stats/overview` - статистика задач

## Структура проекта

```
jira-estimate/
├── server/                 # Backend
│   ├── index.js           # Главный файл сервера
│   ├── models/            # Модели MongoDB
│   ├── routes/            # API маршруты
│   ├── services/          # Сервисы (Jira, AI)
│   └── middleware/        # Middleware
├── client/                # Frontend
│   ├── src/
│   │   ├── components/    # React компоненты
│   │   ├── pages/         # Страницы
│   │   ├── contexts/      # React контексты
│   │   ├── services/      # API клиент
│   │   ├── styles/        # Глобальные стили
│   │   └── types/         # TypeScript типы
│   └── public/            # Статические файлы
├── package.json           # Зависимости проекта
└── README.md             # Документация
```

## Безопасность

- Все API ключи и токены хранятся в переменных окружения
- JWT токены для аутентификации
- Валидация всех входящих данных
- Защищенные маршруты для авторизованных пользователей

## Разработка

### Добавление новых компонентов
1. Создайте компонент в `client/src/components/`
2. Добавьте типы в `client/src/types/`
3. Экспортируйте из соответствующих индексных файлов

### Добавление новых API endpoints
1. Создайте маршрут в `server/routes/`
2. Добавьте соответствующий метод в `client/src/services/api.ts`
3. Обновите типы в `client/src/types/`

## Лицензия

MIT License

## Поддержка

При возникновении проблем:
1. Проверьте правильность настройки переменных окружения
2. Убедитесь, что MongoDB запущена
3. Проверьте доступность Jira API
4. Проверьте валидность OpenAI API ключа
