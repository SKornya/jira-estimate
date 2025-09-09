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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Недействительный токен',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    res.status(401).json({
      error: 'Недействительный токен',
    });
  }
};

module.exports = auth;
