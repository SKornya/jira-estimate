const express = require('express');
const { body, validationResult } = require('express-validator');
const JiraService = require('../services/jiraService');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const router = express.Router();

// Валидация URL задачи
const issueUrlValidation = [
  body('issueUrl')
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('URL задачи должен быть валидным HTTP/HTTPS URL')
    .custom((value) => {
      // Проверяем, что URL содержит atlassian.net или jira
      if (!value.includes('atlassian.net') && !value.includes('jira')) {
        throw new Error('URL должен быть ссылкой на Jira');
      }
      return true;
    }),
];

// Получение информации о задаче по ссылке
router.post('/fetch-issue', auth, issueUrlValidation, async (req, res) => {
  try {
    // Проверка результатов валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Ошибка валидации',
        details: errors.array(),
      });
    }

    const { issueUrl } = req.body;

    // Проверка наличия учетных данных Jira
    if (
      !req.user.jiraBaseUrl ||
      !req.user.jiraEmail ||
      !req.user.jiraApiToken
    ) {
      console.log('❌ Отсутствуют учетные данные Jira для пользователя:', {
        userId: req.user.id,
        username: req.user.username,
        hasBaseUrl: !!req.user.jiraBaseUrl,
        hasEmail: !!req.user.jiraEmail,
        hasApiToken: !!req.user.jiraApiToken,
      });
      return res.status(400).json({
        error:
          'Не настроены учетные данные Jira. Пожалуйста, настройте подключение к Jira в профиле.',
      });
    }

    // Извлечение ключа задачи из URL
    const issueKey = extractIssueKeyFromUrl(issueUrl);
    if (!issueKey) {
      console.log('❌ Неверный формат URL задачи:', { issueUrl });
      return res.status(400).json({
        error: 'Неверный формат URL задачи Jira',
      });
    }

    console.log('🔍 Попытка загрузки задачи:', {
      userId: req.user.id,
      username: req.user.username,
      issueKey,
      issueUrl,
      jiraBaseUrl: req.user.jiraBaseUrl,
      jiraEmail: req.user.jiraEmail,
      jiraApiTokenLength: req.user.jiraApiToken
        ? req.user.jiraApiToken.length
        : 0,
    });

    // Создание сервиса Jira
    const jiraService = new JiraService(
      req.user.jiraBaseUrl,
      req.user.jiraEmail,
      req.user.jiraApiToken // Будет использован для генерации Basic токена
    );

    // Получение основной задачи
    const mainIssue = await jiraService.getIssue(issueKey);

    console.log('🔍 Анализ типа задачи для получения связанных задач:', {
      issueKey,
      issueType: mainIssue.issueType,
      title: mainIssue.title,
    });

    let subtasks = [];

    // Если это портфель или эпик, получаем подзадачи
    if (mainIssue.issueType === 'Portfolio' || mainIssue.issueType === 'Epic') {
      console.log('📋 Получение подзадач для Portfolio/Epic');
      subtasks = await jiraService.getIssuesFromPortfolio(issueKey);
    }
    // Если это feature/story, получаем связанные задачи
    else if (
      mainIssue.issueType === 'Story' ||
      mainIssue.issueType === 'New Feature' ||
      mainIssue.issueType === 'Feature'
    ) {
      console.log('🔗 Получение связанных задач для Story/New Feature');
      subtasks = await jiraService.getRelatedIssues(
        issueKey,
        mainIssue.issueType
      );
    } else {
      console.log('ℹ️ Обычная задача, связанные задачи не запрашиваются');
    }

    console.log('📊 Результат запроса связанных задач:', {
      issueKey,
      issueType: mainIssue.issueType,
      subtasksCount: subtasks.length,
      subtasks: subtasks.map((task) => ({
        key: task.jiraKey,
        type: task.issueType,
        title: task.title,
      })),
    });

    res.json({
      mainIssue,
      subtasks,
      message: `Получена информация о задаче ${issueKey}`,
    });
  } catch (error) {
    console.error('Ошибка получения задачи:', error);
    res.status(500).json({
      error: error.message || 'Ошибка получения задачи из Jira',
    });
  }
});

// Синхронизация задач пользователя
router.post('/sync-user-tasks', auth, async (req, res) => {
  try {
    const { maxResults = 50 } = req.body;

    // Проверка наличия учетных данных Jira
    if (
      !req.user.jiraBaseUrl ||
      !req.user.jiraEmail ||
      !req.user.jiraApiToken
    ) {
      return res.status(400).json({
        error:
          'Не настроены учетные данные Jira. Пожалуйста, настройте подключение к Jira в профиле.',
      });
    }

    const jiraService = new JiraService(
      req.user.jiraBaseUrl,
      req.user.jiraEmail,
      req.user.jiraApiToken // Будет использован для генерации Basic токена
    );

    // Получение задач пользователя из Jira
    const jiraIssues = await jiraService.getUserIssues(
      req.user.jiraUsername,
      maxResults
    );

    let syncedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Сохранение/обновление задач в базе данных
    for (const issue of jiraIssues) {
      try {
        const existingTask = await Task.findOne({ jiraKey: issue.jiraKey });

        if (existingTask) {
          // Обновление существующей задачи
          Object.assign(existingTask, issue);
          existingTask.lastSynced = new Date();
          existingTask.syncStatus = 'synced';
          await existingTask.save();
        } else {
          // Создание новой задачи
          const newTask = new Task({
            ...issue,
            assignee: req.user.jiraUsername,
            lastSynced: new Date(),
            syncStatus: 'synced',
          });
          await newTask.save();
        }

        syncedCount++;
      } catch (error) {
        console.error(`Ошибка синхронизации задачи ${issue.jiraKey}:`, error);
        errorCount++;
        errors.push({
          jiraKey: issue.jiraKey,
          error: error.message,
        });
      }
    }

    res.json({
      message: `Синхронизация завершена`,
      syncedCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Ошибка синхронизации:', error);
    res.status(500).json({
      error: error.message || 'Ошибка синхронизации задач',
    });
  }
});

// Проверка подключения к Jira
router.get('/test-connection', auth, async (req, res) => {
  try {
    // Проверка наличия учетных данных Jira
    if (
      !req.user.jiraBaseUrl ||
      !req.user.jiraEmail ||
      !req.user.jiraApiToken
    ) {
      return res.status(400).json({
        error:
          'Не настроены учетные данные Jira. Пожалуйста, настройте подключение к Jira в профиле.',
      });
    }

    const jiraService = new JiraService(
      req.user.jiraBaseUrl,
      req.user.jiraEmail,
      req.user.jiraApiToken // Будет использован для генерации Basic токена
    );

    const isConnected = await jiraService.testConnection();

    res.json({
      connected: isConnected,
      message: isConnected
        ? 'Подключение к Jira успешно'
        : 'Не удалось подключиться к Jira',
    });
  } catch (error) {
    console.error('Ошибка проверки подключения:', error);
    res.status(500).json({
      error: 'Ошибка проверки подключения к Jira',
    });
  }
});

// Функция для извлечения ключа задачи из URL
function extractIssueKeyFromUrl(url) {
  try {
    // Поддерживаемые форматы URL:
    // https://domain.atlassian.net/browse/PROJECT-123
    // https://domain.atlassian.net/jira/software/projects/PROJECT/boards/1/backlog?selectedIssue=PROJECT-123
    // https://domain.atlassian.net/jira/core/projects/PROJECT/issues/PROJECT-123

    const patterns = [
      /\/browse\/([A-Z]+-\d+)/,
      /selectedIssue=([A-Z]+-\d+)/,
      /\/issues\/([A-Z]+-\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    console.error('Ошибка извлечения ключа задачи:', error);
    return null;
  }
}

module.exports = router;
