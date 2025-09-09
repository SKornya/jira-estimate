# Настройка безопасности приложения

## Критические переменные окружения

Для безопасной работы приложения необходимо установить следующие переменные окружения:

### 1. JWT_SECRET (ОБЯЗАТЕЛЬНО!)
```bash
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here_minimum_32_characters
```
- Минимум 32 символа
- Должен быть случайным и уникальным
- Никогда не коммитьте в репозиторий

### 2. ENCRYPTION_KEY (ОБЯЗАТЕЛЬНО!)
```bash
ENCRYPTION_KEY=your_very_long_and_secure_encryption_key_here_minimum_32_characters
```
- Минимум 32 символа
- Используется для шифрования токенов в базе данных
- Должен быть случайным и уникальным

### 3. База данных
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/jira_estimate
# Или отдельные параметры:
POSTGRES_DB=jira_estimate
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### 4. Другие настройки
```bash
# JIRA (для демо-режима)
JIRA_USERNAME=demo-user
JIRA_BASE_URL=https://demo.atlassian.net
JIRA_EMAIL=demo@example.com
JIRA_API_TOKEN=demo-token

# AI
AI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-3.5-turbo
AI_HOST=https://api.openai.com/v1

# Сервер
PORT=3001
NODE_ENV=production

# Frontend (для production)
FRONTEND_URL=https://yourdomain.com
```

## Генерация безопасных ключей

### JWT Secret
```bash
# Генерация случайного JWT секрета
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Encryption Key
```bash
# Генерация случайного ключа шифрования
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Внесенные улучшения безопасности

### 1. Защита от атак
- ✅ Добавлен Helmet для защиты заголовков
- ✅ Настроен Rate Limiting (100 запросов в 15 минут)
- ✅ Улучшена CORS конфигурация
- ✅ Добавлена валидация входных данных

### 2. Аутентификация и авторизация
- ✅ Улучшена безопасность JWT токенов
- ✅ Добавлены issuer и audience
- ✅ Уменьшено время жизни токенов до 24 часов
- ✅ Улучшена обработка ошибок токенов

### 3. Шифрование
- ✅ Улучшено шифрование токенов (AES-256-GCM)
- ✅ Добавлена проверка наличия ключей шифрования
- ✅ Удалены небезопасные значения по умолчанию

### 4. Валидация данных
- ✅ Добавлена валидация email, паролей, URL
- ✅ Улучшена валидация паролей (минимум 8 символов, заглавные, строчные, цифры)
- ✅ Добавлена валидация URL Jira

### 5. Логирование
- ✅ Улучшено логирование ошибок
- ✅ Удалено логирование чувствительных данных

## Рекомендации для production

1. **Всегда используйте HTTPS** в production
2. **Регулярно обновляйте зависимости**
3. **Мониторьте логи** на предмет подозрительной активности
4. **Используйте сильные пароли** для базы данных
5. **Настройте брандмауэр** для ограничения доступа
6. **Регулярно создавайте резервные копии** базы данных
7. **Используйте переменные окружения** для всех секретов

## Проверка безопасности

После настройки переменных окружения запустите:
```bash
npm run server
```

Приложение должно запуститься без ошибок. Если появляются ошибки о недостающих переменных окружения, проверьте файл `.env`.
