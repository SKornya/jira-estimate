const { Sequelize } = require('sequelize');
require('dotenv').config();

// Создание экземпляра Sequelize для подключения к PostgreSQL
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
      },
    })
  : new Sequelize(
      process.env.POSTGRES_DB || 'jira_estimate',
      process.env.POSTGRES_USER || 'postgres',
      process.env.POSTGRES_PASSWORD || 'password',
      {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: process.env.POSTGRES_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true,
        },
      }
    );

// Функция для тестирования подключения
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к PostgreSQL установлено');
  } catch (error) {
    console.error('❌ Ошибка подключения к PostgreSQL:', error);
  }
};

// Функция для синхронизации моделей
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ База данных синхронизирована');
  } catch (error) {
    console.error('❌ Ошибка синхронизации базы данных:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};
