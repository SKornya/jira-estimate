const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Токен доступа не предоставлен',
      });
    }

    // Проверяем наличие JWT секрета
    if (!process.env.JWT_SECRET) {
      console.error(
        '❌ КРИТИЧЕСКАЯ ОШИБКА: JWT_SECRET не установлен в переменных окружения!'
      );
      return res.status(500).json({
        error: 'Ошибка конфигурации сервера',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'jira-estimate-app',
      audience: 'jira-estimate-users',
    });

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Недействительный токен',
      });
    }

    console.log('🔍 DEBUG: Пользователь загружен в middleware auth:', {
      userId: user.id,
      username: user.username,
      jiraApiToken: user.jiraApiToken
        ? '***' + user.jiraApiToken.slice(-4)
        : 'NULL',
      jiraApiTokenLength: user.jiraApiToken ? user.jiraApiToken.length : 0,
      hasJiraApiToken: !!user.jiraApiToken,
    });

    req.user = user;
    next();
  } catch (error) {
    console.error('Ошибка аутентификации:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Токен истек',
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Недействительный токен',
      });
    }

    res.status(401).json({
      error: 'Ошибка аутентификации',
    });
  }
};

module.exports = auth;
