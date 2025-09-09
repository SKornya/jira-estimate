-- Скрипт инициализации базы данных для Jira Estimate
-- Этот скрипт выполняется автоматически при создании контейнера PostgreSQL

-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Создание схемы для приложения
CREATE SCHEMA IF NOT EXISTS jira_estimate;

-- Установка поискового пути
SET search_path TO jira_estimate, public;

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы настроек пользователя
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    jira_base_url VARCHAR(255),
    jira_username VARCHAR(100),
    jira_api_token_encrypted TEXT,
    openai_api_key_encrypted TEXT,
    estimation_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание enum для статуса синхронизации
CREATE TYPE enum_tasks_sync_status AS ENUM ('synced', 'pending', 'error');

-- Создание таблицы задач
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    jira_key VARCHAR(255) NOT NULL UNIQUE,
    jira_id VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    issue_type VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    priority VARCHAR(255) DEFAULT 'Medium',
    assignee VARCHAR(255) NOT NULL,
    reporter VARCHAR(255) NOT NULL,
    project_key VARCHAR(255),
    project_name VARCHAR(255),
    repository VARCHAR(255) DEFAULT '',
    created TIMESTAMP WITH TIME ZONE NOT NULL,
    started TIMESTAMP WITH TIME ZONE,
    completed TIMESTAMP WITH TIME ZONE,
    parent_key VARCHAR(255),
    subtasks JSON DEFAULT '[]',
    original_estimate INTEGER,
    time_spent INTEGER,
    ai_estimate JSON,
    ai_estimate_created_at TIMESTAMP WITH TIME ZONE,
    labels JSON DEFAULT '[]',
    components JSON DEFAULT '[]',
    fix_versions JSON DEFAULT '[]',
    last_synced TIMESTAMP WITH TIME ZONE,
    sync_status enum_tasks_sync_status DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- Создание таблицы оценок
CREATE TABLE IF NOT EXISTS estimations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    estimated_hours DECIMAL(5,2),
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    reasoning TEXT,
    ai_model VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы истории оценок
CREATE TABLE IF NOT EXISTS estimation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    previous_estimation DECIMAL(5,2),
    new_estimation DECIMAL(5,2),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_jira_key ON tasks(jira_key);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_tasks_issue_type ON tasks(issue_type);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created);
CREATE INDEX IF NOT EXISTS idx_estimations_task_id ON estimations(task_id);
CREATE INDEX IF NOT EXISTS idx_estimations_user_id ON estimations(user_id);
CREATE INDEX IF NOT EXISTS idx_estimation_history_task_id ON estimation_history(task_id);
CREATE INDEX IF NOT EXISTS idx_estimation_history_user_id ON estimation_history(user_id);

-- Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггеров для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimations_updated_at BEFORE UPDATE ON estimations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Создание представления для статистики пользователя
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    u.email,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT e.id) as total_estimations,
    AVG(e.estimated_hours) as avg_estimation_hours,
    MAX(e.created_at) as last_estimation_date
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
LEFT JOIN estimations e ON t.id = e.task_id
GROUP BY u.id, u.username, u.email;

-- Создание функции для получения задач пользователя с оценками
CREATE OR REPLACE FUNCTION get_user_tasks_with_estimations(p_user_id UUID)
RETURNS TABLE (
    task_id UUID,
    jira_key VARCHAR(50),
    title TEXT,
    estimated_hours DECIMAL(5,2),
    confidence_level INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.jira_key,
        t.title,
        e.estimated_hours,
        e.confidence_level,
        e.created_at
    FROM tasks t
    LEFT JOIN estimations e ON t.id = e.task_id
    WHERE t.user_id = p_user_id
    ORDER BY e.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Создание функции для логирования изменений оценок
CREATE OR REPLACE FUNCTION log_estimation_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estimated_hours IS DISTINCT FROM NEW.estimated_hours THEN
        INSERT INTO estimation_history (
            task_id,
            user_id,
            previous_estimation,
            new_estimation,
            change_reason
        ) VALUES (
            NEW.task_id,
            NEW.user_id,
            OLD.estimated_hours,
            NEW.estimated_hours,
            'Estimation updated'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создание триггера для логирования изменений оценок
CREATE TRIGGER log_estimation_changes
    AFTER UPDATE ON estimations
    FOR EACH ROW
    EXECUTE FUNCTION log_estimation_change();

-- Вставка тестовых данных (только для разработки)
-- Раскомментируйте для добавления тестовых данных
/*
INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES
('admin', 'admin@example.com', crypt('admin123', gen_salt('bf')), 'Admin', 'User'),
('developer', 'dev@example.com', crypt('dev123', gen_salt('bf')), 'Developer', 'User');

INSERT INTO settings (user_id, jira_base_url, jira_username) VALUES
((SELECT id FROM users WHERE username = 'admin'), 'https://company.atlassian.net', 'admin@company.com'),
((SELECT id FROM users WHERE username = 'developer'), 'https://company.atlassian.net', 'dev@company.com');
*/

-- Создание пользователя postgres (если не существует)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
        CREATE ROLE postgres WITH LOGIN SUPERUSER CREATEDB CREATEROLE PASSWORD 'password';
    END IF;
END
$$;

-- Предоставление прав пользователю postgres
GRANT USAGE ON SCHEMA jira_estimate TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA jira_estimate TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA jira_estimate TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA jira_estimate TO postgres;

-- Установка прав по умолчанию для новых объектов
ALTER DEFAULT PRIVILEGES IN SCHEMA jira_estimate GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA jira_estimate GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA jira_estimate GRANT EXECUTE ON FUNCTIONS TO postgres;

-- Комментарии к таблицам
COMMENT ON TABLE users IS 'Пользователи системы';
COMMENT ON TABLE settings IS 'Настройки пользователей';
COMMENT ON TABLE tasks IS 'Задачи из Jira';
COMMENT ON TABLE estimations IS 'Оценки времени выполнения задач';
COMMENT ON TABLE estimation_history IS 'История изменений оценок';

-- Комментарии к колонкам
COMMENT ON COLUMN users.password_hash IS 'Хеш пароля пользователя';
COMMENT ON COLUMN settings.jira_api_token_encrypted IS 'Зашифрованный API токен Jira';
COMMENT ON COLUMN settings.openai_api_key_encrypted IS 'Зашифрованный API ключ OpenAI';
COMMENT ON COLUMN estimations.confidence_level IS 'Уровень уверенности в оценке (1-5)';
COMMENT ON COLUMN estimations.ai_model IS 'Модель ИИ, использованная для оценки';

-- Вывод информации о созданных объектах
SELECT 'Database initialization completed successfully!' as status;
