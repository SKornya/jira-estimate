const express = require('express');
const { Task } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const router = express.Router();

// Получение задач пользователя
router.get('/', auth, async (req, res) => {
  try {
    const {
      limit = 20,
      page = 1,
      issueType,
      status,
      hasEstimate,
      sortBy = 'created',
      sortOrder = 'desc',
    } = req.query;

    const offset = (page - 1) * limit;
    const order = [[sortBy, sortOrder.toUpperCase()]];

    // Построение фильтра
    const where = { assignee: req.user.jiraUsername };

    if (issueType) {
      where.issueType = issueType;
    }

    if (status) {
      where.status = status;
    }

    if (hasEstimate === 'true') {
      where.aiEstimate = { [Op.ne]: null };
    } else if (hasEstimate === 'false') {
      where.aiEstimate = null;
    }

    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      order,
      offset,
      limit: parseInt(limit),
    });

    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Ошибка получения задач:', error);
    res.status(500).json({
      error: 'Ошибка получения задач',
    });
  }
});

// Получение конкретной задачи
router.get('/:jiraKey', auth, async (req, res) => {
  try {
    const { jiraKey } = req.params;

    const task = await Task.findOne({
      where: {
        jiraKey: jiraKey.toUpperCase(),
        assignee: req.user.jiraUsername,
      },
    });

    if (!task) {
      return res.status(404).json({
        error: 'Задача не найдена',
      });
    }

    res.json({ task });
  } catch (error) {
    console.error('Ошибка получения задачи:', error);
    res.status(500).json({
      error: 'Ошибка получения задачи',
    });
  }
});

// Поиск похожих задач
router.get('/:jiraKey/similar', auth, async (req, res) => {
  try {
    const { jiraKey } = req.params;
    const { limit = 5 } = req.query;

    const task = await Task.findOne({
      where: {
        jiraKey: jiraKey.toUpperCase(),
        assignee: req.user.jiraUsername,
      },
    });

    if (!task) {
      return res.status(404).json({
        error: 'Задача не найдена',
      });
    }

    const similarTasks = await Task.findSimilar(task, parseInt(limit));

    res.json({
      similarTasks: similarTasks.map((t) => ({
        jiraKey: t.jiraKey,
        title: t.title,
        issueType: t.issueType,
        status: t.status,
        actualDuration: t.getActualDuration(),
        timeSpent: t.timeSpent ? Math.round(t.timeSpent / 3600) : null,
        created: t.created,
        labels: t.labels,
        components: t.components,
      })),
    });
  } catch (error) {
    console.error('Ошибка поиска похожих задач:', error);
    res.status(500).json({
      error: 'Ошибка поиска похожих задач',
    });
  }
});

// Обновление задачи
router.put('/:jiraKey', auth, async (req, res) => {
  try {
    const { jiraKey } = req.params;
    const updateData = req.body;

    const task = await Task.findOne({
      where: {
        jiraKey: jiraKey.toUpperCase(),
        assignee: req.user.jiraUsername,
      },
    });

    if (!task) {
      return res.status(404).json({
        error: 'Задача не найдена',
      });
    }

    await task.update({
      ...updateData,
      lastSynced: new Date(),
    });

    res.json({
      task,
      message: 'Задача обновлена успешно',
    });
  } catch (error) {
    console.error('Ошибка обновления задачи:', error);
    res.status(500).json({
      error: 'Ошибка обновления задачи',
    });
  }
});

// Удаление задачи
router.delete('/:jiraKey', auth, async (req, res) => {
  try {
    const { jiraKey } = req.params;

    const task = await Task.findOne({
      where: {
        jiraKey: jiraKey.toUpperCase(),
        assignee: req.user.jiraUsername,
      },
    });

    if (!task) {
      return res.status(404).json({
        error: 'Задача не найдена',
      });
    }

    await task.destroy();

    res.json({
      message: 'Задача удалена успешно',
    });
  } catch (error) {
    console.error('Ошибка удаления задачи:', error);
    res.status(500).json({
      error: 'Ошибка удаления задачи',
    });
  }
});

// Получение статистики задач
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const { sequelize } = require('../config/database');

    // Общая статистика
    const totalTasks = await Task.count({
      where: { assignee: req.user.jiraUsername },
    });

    const tasksWithEstimate = await Task.count({
      where: {
        assignee: req.user.jiraUsername,
        aiEstimate: { [Op.ne]: null },
      },
    });

    const completedTasks = await Task.count({
      where: {
        assignee: req.user.jiraUsername,
        status: { [Op.in]: ['Done', 'Closed', 'Resolved'] },
      },
    });

    const averageEstimate = await Task.findOne({
      where: {
        assignee: req.user.jiraUsername,
        aiEstimate: { [Op.ne]: null },
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('aiEstimate')), 'avgEstimate'],
      ],
      raw: true,
    });

    // Статистика по типам задач
    const typeStats = await Task.findAll({
      where: { assignee: req.user.jiraUsername },
      attributes: [
        'issueType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('aiEstimate')), 'averageEstimate'],
      ],
      group: ['issueType'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true,
    });

    // Статистика по статусам
    const statusStats = await Task.findAll({
      where: { assignee: req.user.jiraUsername },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true,
    });

    res.json({
      overview: {
        totalTasks,
        tasksWithEstimate,
        completedTasks,
        averageEstimate: averageEstimate?.avgEstimate || 0,
        averageActualTime: 0, // Можно добавить расчет позже
      },
      byType: typeStats,
      byStatus: statusStats,
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({
      error: 'Ошибка получения статистики задач',
    });
  }
});

module.exports = router;
