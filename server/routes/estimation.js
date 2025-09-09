const express = require('express');
const AIService = require('../services/aiService');
const Task = require('../models/Task');
const User = require('../models/User');
const { sequelize } = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Оценка времени выполнения задачи
router.post('/estimate', auth, async (req, res) => {
  try {
    const {
      taskData,
      includeSimilarTasks = true,
      relatedTasks = [],
    } = req.body;

    if (!taskData || !taskData.jiraKey) {
      return res.status(400).json({
        error: 'Данные задачи обязательны',
      });
    }

    console.log('🤖 Начало процесса оценки задачи:', {
      userId: req.user.id,
      username: req.user.username,
      taskKey: taskData.jiraKey,
      taskTitle: taskData.title,
      includeSimilarTasks,
    });

    // Ограничиваем количество связанных задач на уровне сервера
    const maxRelatedTasks = 15;
    const limitedRelatedTasks = relatedTasks.slice(0, maxRelatedTasks);

    if (relatedTasks.length > maxRelatedTasks) {
      console.log(
        '⚠️ Количество связанных задач превышает лимит, ограничиваем:',
        {
          originalCount: relatedTasks.length,
          limitedCount: limitedRelatedTasks.length,
          maxLimit: maxRelatedTasks,
        }
      );
    }

    console.log('🔍 Данные задачи для оценки:', {
      jiraKey: taskData.jiraKey,
      title: taskData.title,
      issueType: taskData.issueType,
      project: taskData.project,
      projectKey: taskData.projectKey,
      projectName: taskData.projectName,
      assignee: taskData.assignee,
      labels: taskData.labels,
      components: taskData.components,
      relatedTasksCount: relatedTasks.length,
      limitedRelatedTasksCount: limitedRelatedTasks.length,
      relatedTasks: limitedRelatedTasks.map((rt) => ({
        key: rt.jiraKey,
        type: rt.issueType,
        title: rt.title,
      })),
    });

    // Получаем настройки пользователя для AI сервиса
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'Пользователь не найден',
      });
    }

    if (!user.aiHost || !user.aiToken) {
      console.log('❌ AI настройки не настроены у пользователя');
      return res.status(400).json({
        error:
          'AI сервис не настроен. Пожалуйста, настройте AI сервис в настройках профиля.',
      });
    }

    // Проверка доступности AI сервиса с пользовательскими настройками
    const aiService = new AIService(user.aiToken, 'gpt-3.5-turbo', user.aiHost);

    console.log(
      '🤖 Проверка доступности AI сервиса с пользовательскими настройками...'
    );
    const aiAvailable = await aiService.testConnection();

    if (!aiAvailable) {
      console.log('❌ AI сервис недоступен с пользовательскими настройками');
      return res.status(503).json({
        error: 'AI сервис недоступен. Проверьте настройки AI сервиса.',
      });
    }

    let similarTasks = [];

    // Поиск похожих задач, если требуется
    if (includeSimilarTasks) {
      console.log('🔍 Поиск похожих задач...');
      similarTasks = await Task.findSimilar(taskData, 5);
      console.log('🔍 Найдено похожих задач:', similarTasks.length);
    }

    // Получение оценки от AI
    console.log('🤖 Запрос оценки от AI...');
    const estimation = await aiService.estimateTaskTime(
      taskData,
      similarTasks,
      limitedRelatedTasks
    );
    console.log('🤖 Оценка получена:', {
      estimate: estimation.estimate,
      confidence: estimation.confidence,
      reasoningLength: estimation.reasoning?.length || 0,
      relatedTasksCount: relatedTasks.length,
      limitedRelatedTasksCount: limitedRelatedTasks.length,
    });

    // Сохранение оценки в базе данных
    const { Op } = require('sequelize');
    let savedTask = await Task.findOne({
      where: { jiraKey: taskData.jiraKey },
    });

    console.log('💾 Поиск существующей задачи:', {
      jiraKey: taskData.jiraKey,
      found: !!savedTask,
      currentAssignee: savedTask?.assignee,
      newAssignee: req.user.jiraUsername,
    });

    if (savedTask) {
      // Обновление существующей задачи
      console.log('💾 Обновление существующей задачи с оценкой');
      savedTask.aiEstimate = {
        estimate: estimation.estimate,
        confidence: estimation.confidence,
        reasoning: estimation.reasoning,
        similarTasks: similarTasks.map((t) => t.jiraKey),
        relatedTasks:
          limitedRelatedTasks.length > 0 ? limitedRelatedTasks : undefined,
        createdAt: new Date(),
      };
      // Обновляем assignee на текущего пользователя
      savedTask.assignee = req.user.jiraUsername;
      await savedTask.save();
      console.log('✅ Задача обновлена:', {
        jiraKey: savedTask.jiraKey,
        assignee: savedTask.assignee,
        hasAiEstimate: !!savedTask.aiEstimate,
      });
    } else {
      // Создание новой задачи с оценкой
      const taskToSave = {
        ...taskData,
        assignee: req.user.jiraUsername,
        // Убираем объект project, оставляем только projectKey и projectName
        project: undefined,
        aiEstimate: {
          estimate: estimation.estimate,
          confidence: estimation.confidence,
          reasoning: estimation.reasoning,
          similarTasks: similarTasks.map((t) => t.jiraKey),
          relatedTasks:
            limitedRelatedTasks.length > 0 ? limitedRelatedTasks : undefined,
          createdAt: new Date(),
        },
      };

      console.log('💾 Создание новой задачи с оценкой:', {
        jiraKey: taskToSave.jiraKey,
        title: taskToSave.title,
        issueType: taskToSave.issueType,
        projectKey: taskToSave.projectKey,
        projectName: taskToSave.projectName,
        assignee: taskToSave.assignee,
        aiEstimate: taskToSave.aiEstimate,
      });

      savedTask = await Task.create(taskToSave);
      console.log('✅ Новая задача создана:', {
        id: savedTask.id,
        jiraKey: savedTask.jiraKey,
        assignee: savedTask.assignee,
        hasAiEstimate: !!savedTask.aiEstimate,
      });
    }

    res.json({
      estimation: {
        estimate: estimation.estimate,
        confidence: estimation.confidence,
        reasoning: estimation.reasoning,
        similarTasksCount: similarTasks.length,
      },
      similarTasks: similarTasks.map((task) => ({
        jiraKey: task.jiraKey,
        title: task.title,
        issueType: task.issueType,
        actualDuration: task.actualDuration,
        timeSpent: task.timeSpent ? Math.round(task.timeSpent / 3600) : null,
        status: task.status,
      })),
      taskId: savedTask.id,
      message: 'Оценка времени выполнена успешно',
    });
  } catch (error) {
    console.error('Ошибка оценки времени:', error);
    res.status(500).json({
      error: error.message || 'Ошибка получения оценки времени',
    });
  }
});

// Получение истории оценок пользователя
router.get('/history', auth, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    const { Op } = require('sequelize');

    console.log('📊 Запрос истории оценок:', {
      userId: req.user.id,
      username: req.user.username,
      jiraUsername: req.user.jiraUsername,
      limit,
      page,
      offset,
    });

    const { count: total, rows: tasks } = await Task.findAndCountAll({
      where: {
        assignee: req.user.jiraUsername,
        aiEstimate: {
          [Op.ne]: null,
        },
      },
      order: [
        [
          sequelize.literal(
            "COALESCE((ai_estimate->>'createdAt')::timestamp, created)"
          ),
          'DESC',
        ],
      ],
      offset,
      limit: parseInt(limit),
      attributes: [
        'jiraKey',
        'title',
        'issueType',
        'aiEstimate',
        'timeSpent',
        'status',
        'created',
        'started',
        'completed',
      ],
    });

    console.log('📊 Найдено задач с оценками:', {
      total,
      found: tasks.length,
      tasks: tasks.map((t) => ({
        jiraKey: t.jiraKey,
        title: t.title,
        hasAiEstimate: !!t.aiEstimate,
        aiEstimate: t.aiEstimate,
      })),
    });

    const responseData = {
      tasks: tasks.map((task) => ({
        jiraKey: task.jiraKey,
        title: task.title,
        issueType: task.issueType,
        estimatedTime: task.aiEstimate?.estimate || 0,
        confidence: task.aiEstimate?.confidence || 0,
        reasoning: task.aiEstimate?.reasoning || '',
        actualDuration: task.getActualDuration
          ? task.getActualDuration()
          : null,
        timeSpent: task.timeSpent ? Math.round(task.timeSpent / 3600) : null,
        status: task.status,
        estimatedAt: task.aiEstimate?.createdAt || task.created,
        created: task.created,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };

    console.log('📤 Отправка ответа истории оценок:', {
      tasksCount: responseData.tasks.length,
      pagination: responseData.pagination,
      sampleTask: responseData.tasks[0] || null,
    });

    res.json(responseData);
  } catch (error) {
    console.error('Ошибка получения истории оценок:', error);
    res.status(500).json({
      error: 'Ошибка получения истории оценок',
    });
  }
});

// Получение статистики оценок
router.get('/stats', auth, async (req, res) => {
  try {
    const { Op } = require('sequelize');

    const tasks = await Task.findAll({
      where: {
        assignee: req.user.jiraUsername,
        aiEstimate: {
          [Op.ne]: null,
        },
        timeSpent: {
          [Op.ne]: null,
        },
      },
      attributes: ['issueType', 'aiEstimate', 'timeSpent'],
    });

    if (tasks.length === 0) {
      return res.json({
        totalTasks: 0,
        averageAccuracy: 0,
        accuracyByType: {},
        message: 'Недостаточно данных для статистики',
      });
    }

    // Расчет точности оценок
    const accuracyData = tasks.map((task) => {
      const estimated = task.aiEstimate?.estimate || 0;
      const actual = task.timeSpent ? Math.round(task.timeSpent / 3600) : 0; // Конвертируем секунды в часы
      const accuracy = Math.max(
        0,
        1 - Math.abs(estimated - actual) / Math.max(estimated, actual)
      );

      return {
        issueType: task.issueType,
        accuracy,
        estimated,
        actual,
      };
    });

    const averageAccuracy =
      accuracyData.reduce((sum, item) => sum + item.accuracy, 0) /
      accuracyData.length;

    // Группировка по типам задач
    const accuracyByType = {};
    accuracyData.forEach((item) => {
      if (!accuracyByType[item.issueType]) {
        accuracyByType[item.issueType] = {
          count: 0,
          totalAccuracy: 0,
          averageAccuracy: 0,
        };
      }
      accuracyByType[item.issueType].count++;
      accuracyByType[item.issueType].totalAccuracy += item.accuracy;
    });

    // Расчет средней точности по типам
    Object.keys(accuracyByType).forEach((type) => {
      accuracyByType[type].averageAccuracy =
        accuracyByType[type].totalAccuracy / accuracyByType[type].count;
    });

    res.json({
      totalTasks: tasks.length,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      accuracyByType,
      message: 'Статистика оценок получена',
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({
      error: 'Ошибка получения статистики оценок',
    });
  }
});

module.exports = router;
