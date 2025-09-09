const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JiraService = require('../services/jiraService');
const router = express.Router();

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Проверка обязательных полей
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Имя пользователя, email и пароль обязательны для заполнения',
      });
    }

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

    // Генерация JWT токена
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
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

// Вход
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email и пароль обязательны',
      });
    }

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

    // Генерация JWT токена
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
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
