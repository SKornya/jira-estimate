const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const JiraService = require('../services/jiraService');
const router = express.Router();

// Валидация для регистрации
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Имя пользователя должно содержать от 3 до 50 символов')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      'Имя пользователя может содержать только буквы, цифры, дефисы и подчеркивания'
    ),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Введите корректный email адрес'),
  body('password').notEmpty().withMessage('Пароль обязателен'),
];

// Регистрация
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Проверка результатов валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Ошибка валидации',
        details: errors.array(),
      });
    }

    const { username, email, password } = req.body;

    // Получение данных Jira из переменных окружения или использование значений по умолчанию
    const jiraUsername = process.env.JIRA_USERNAME || 'demo-user';
    const jiraBaseUrl =
      process.env.JIRA_BASE_URL || 'https://demo.atlassian.net';
    const jiraEmail = process.env.JIRA_EMAIL || 'demo@example.com';
    const jiraApiToken = process.env.JIRA_API_TOKEN || 'demo-token';

    console.log('Using Jira credentials:', {
      jiraUsername,
      jiraBaseUrl,
      jiraEmail,
    });

    // Проверка существования пользователя
    const { Op } = require('sequelize');
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Пользователь с таким email или именем уже существует',
      });
    }

    // Проверка подключения к Jira (пропускаем в демо-режиме)
    if (jiraApiToken !== 'demo-token') {
      try {
        const jiraService = new JiraService(
          jiraBaseUrl,
          jiraEmail,
          jiraApiToken
        );
        const jiraConnection = await jiraService.testConnection();

        if (!jiraConnection) {
          return res.status(400).json({
            error:
              'Не удалось подключиться к Jira. Проверьте данные подключения.',
          });
        }
      } catch (error) {
        console.log('Jira connection test failed, but continuing in demo mode');
      }
    }

    // Создание пользователя
    const user = await User.create({
      username,
      email,
      password,
      jiraUsername,
      jiraBaseUrl,
      jiraEmail,
      jiraApiToken,
    });

    // Проверяем наличие JWT секрета
    if (!process.env.JWT_SECRET) {
      console.error(
        '❌ КРИТИЧЕСКАЯ ОШИБКА: JWT_SECRET не установлен в переменных окружения!'
      );
      return res.status(500).json({
        error: 'Ошибка конфигурации сервера',
      });
    }

    // Генерация JWT токена
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '24h', // Уменьшаем время жизни токена
      issuer: 'jira-estimate-app',
      audience: 'jira-estimate-users',
    });

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        jiraUsername: user.jiraUsername,
      },
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
    });
  }
});

// Валидация для входа
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Введите корректный email адрес'),
  body('password').notEmpty().withMessage('Пароль обязателен'),
];

// Вход
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Проверка результатов валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Ошибка валидации',
        details: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Поиск пользователя
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        error: 'Неверные учетные данные',
      });
    }

    // Проверка пароля
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Неверные учетные данные',
      });
    }

    // Обновление времени последнего входа
    await user.update({ lastLogin: new Date() });

    // Проверяем наличие JWT секрета
    if (!process.env.JWT_SECRET) {
      console.error(
        '❌ КРИТИЧЕСКАЯ ОШИБКА: JWT_SECRET не установлен в переменных окружения!'
      );
      return res.status(500).json({
        error: 'Ошибка конфигурации сервера',
      });
    }

    // Генерация JWT токена
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '24h', // Уменьшаем время жизни токена
      issuer: 'jira-estimate-app',
      audience: 'jira-estimate-users',
    });

    res.json({
      message: 'Успешный вход',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        jiraUsername: user.jiraUsername,
      },
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
    });
  }
});

// Получение информации о текущем пользователе
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        jiraUsername: req.user.jiraUsername,
        createdAt: req.user.createdAt,
        lastLogin: req.user.lastLogin,
      },
    });
  } catch (error) {
    console.error('Ошибка получения информации о пользователе:', error);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
    });
  }
});

// Проверка токена
router.get('/verify', require('../middleware/auth'), (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;
