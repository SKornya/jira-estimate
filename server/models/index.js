const { sequelize } = require('../config/database');

// Импорт моделей
const User = require('./User');
const Task = require('./Task');
const Settings = require('./Settings');

// Определение связей между моделями
User.hasMany(Task, { foreignKey: 'userId', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Settings, { foreignKey: 'userId', as: 'settings' });
Settings.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Экспорт моделей и sequelize
module.exports = {
  sequelize,
  User,
  Task,
  Settings,
};
