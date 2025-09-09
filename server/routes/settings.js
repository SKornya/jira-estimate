const express = require('express');
const User = require('../models/User');
const JiraService = require('../services/jiraService');
const router = express.Router();

// Получение настроек пользователя
router.get('/', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'Пользователь не найден',
      });
    }

    console.log('📥 Загрузка настроек пользователя:', {
      userId: user.id,
      jiraBaseUrl: user.jiraBaseUrl,
      jiraUsername: user.jiraUsername,
      jiraEmail: user.jiraEmail,
      jiraApiToken: user.jiraApiToken
        ? '***' + user.jiraApiToken.slice(-4)
        : 'NULL',
      aiHost: user.aiHost,
      aiToken: user.aiToken ? '***' + user.aiToken.slice(-4) : 'NULL',
    });

    res.json({
      jira: {
        baseUrl: user.jiraBaseUrl || '',
        username: user.jiraUsername || '',
        email: user.jiraEmail || '',
        apiToken: user.jiraApiToken || '',
      },
      ai: {
        host: user.aiHost || '',
        token: user.aiToken || '',
      },
    });
  } catch (error) {
    console.error('Ошибка получения настроек:', error);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
    });
  }
});

// Обновление настроек пользователя
router.put('/', require('../middleware/auth'), async (req, res) => {
  try {
    const { jira, ai } = req.body;
    const userId = req.user.id;

    console.log('🔧 Обновление настроек:', {
      userId,
      jira: jira
        ? {
            ...jira,
            apiToken: jira.apiToken
              ? '***' + jira.apiToken.slice(-4)
              : undefined,
          }
        : null,
      ai: ai
        ? { ...ai, token: ai.token ? '***' + ai.token.slice(-4) : undefined }
        : null,
    });

    const updateData = {};

    // Обновляем настройки Jira
    if (jira) {
      if (jira.baseUrl !== undefined) updateData.jiraBaseUrl = jira.baseUrl;
      if (jira.username !== undefined) updateData.jiraUsername = jira.username;
      if (jira.email !== undefined) updateData.jiraEmail = jira.email;
      if (jira.apiToken !== undefined) {
        // Шифруем токен перед сохранением
        const { encrypt } = require('../utils/encryption');
        updateData.jiraApiToken = jira.apiToken ? encrypt(jira.apiToken) : null;
        console.log('🔐 Шифрование jiraApiToken в маршруте');
      }
    }

    // Обновляем настройки AI
    if (ai) {
      if (ai.host !== undefined) updateData.aiHost = ai.host;
      if (ai.token !== undefined) {
        // Шифруем токен перед сохранением
        const { encrypt } = require('../utils/encryption');
        updateData.aiToken = ai.token ? encrypt(ai.token) : null;
        console.log('🔐 Шифрование aiToken в маршруте');
      }
    }

    console.log('📝 Данные для обновления:', {
      ...updateData,
      jiraApiToken: updateData.jiraApiToken
        ? '***' + updateData.jiraApiToken.slice(-4)
        : undefined,
      aiToken: updateData.aiToken
        ? '***' + updateData.aiToken.slice(-4)
        : undefined,
    });

    // Обновляем пользователя
    const [updatedRowsCount] = await User.update(updateData, {
      where: { id: userId },
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        error: 'Пользователь не найден',
      });
    }

    // Получаем обновленного пользователя
    const updatedUser = await User.findByPk(userId);

    res.json({
      message: 'Настройки успешно обновлены',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        jiraUsername: updatedUser.jiraUsername,
        jiraBaseUrl: updatedUser.jiraBaseUrl,
        jiraEmail: updatedUser.jiraEmail,
        aiHost: updatedUser.aiHost,
      },
    });
  } catch (error) {
    console.error('Ошибка обновления настроек:', error);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
    });
  }
});

// Тестирование подключения к Jira
router.post('/test-jira', require('../middleware/auth'), async (req, res) => {
  try {
    const { baseUrl, email, apiToken } = req.body;

    if (!baseUrl || !email || !apiToken) {
      return res.status(400).json({
        connected: false,
        message: 'Необходимо указать URL, email и API токен',
      });
    }

    const jiraService = new JiraService(baseUrl, email, apiToken);
    const isConnected = await jiraService.testConnection();

    res.json({
      connected: isConnected,
      message: isConnected
        ? 'Подключение к Jira успешно установлено'
        : 'Не удалось подключиться к Jira. Проверьте данные подключения.',
    });
  } catch (error) {
    console.error('Ошибка тестирования Jira:', error);
    res.status(500).json({
      connected: false,
      message: 'Ошибка при тестировании подключения к Jira',
    });
  }
});

// Тестирование подключения к AI сервису
router.post('/test-ai', require('../middleware/auth'), async (req, res) => {
  try {
    const { host, token } = req.body;

    if (!host || !token) {
      return res.status(400).json({
        connected: false,
        message: 'Необходимо указать хост и токен AI сервиса',
      });
    }

    // Простое тестирование подключения к AI сервису
    // В реальном приложении здесь должен быть вызов API AI сервиса
    const axios = require('axios');

    try {
      // Тестируем подключение к OpenAI API (пример)
      const response = await axios.get(`${host}/chat/completions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: 'Hello, how are you?',
            },
          ],
        },
        timeout: 10000,
      });

      res.json({
        connected: true,
        message: 'Подключение к AI сервису успешно установлено',
      });
    } catch (apiError) {
      console.error(
        'Ошибка API AI сервиса:',
        apiError.response?.data || apiError.message
      );

      res.json({
        connected: false,
        message:
          'Не удалось подключиться к AI сервису. Проверьте хост и токен.',
      });
    }
  } catch (error) {
    console.error('Ошибка тестирования AI:', error);
    res.status(500).json({
      connected: false,
      message: 'Ошибка при тестировании подключения к AI сервису',
    });
  }
});

module.exports = router;
