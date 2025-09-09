const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Task = sequelize.define(
  'Task',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    jiraKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    jiraId: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    issueType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    priority: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Medium',
    },
    assignee: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    reporter: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    projectKey: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    projectName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    repository: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    // Временные метки
    created: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    started: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Связи с другими задачами
    parentKey: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subtasks: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    // Оценки времени
    originalEstimate: {
      type: DataTypes.INTEGER, // в секундах
      allowNull: true,
    },
    timeSpent: {
      type: DataTypes.INTEGER, // в секундах
      allowNull: true,
    },
    // AI оценка (объект с полной информацией)
    aiEstimate: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // Метаданные
    labels: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    components: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    fixVersions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    // Синхронизация
    lastSynced: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    syncStatus: {
      type: DataTypes.ENUM('synced', 'pending', 'error'),
      allowNull: true,
      defaultValue: 'synced',
    },
  },
  {
    tableName: 'tasks',
    indexes: [
      {
        fields: ['jira_key'],
      },
      {
        fields: ['assignee'],
      },
      {
        fields: ['issue_type'],
      },
      {
        fields: ['created'],
      },
      {
        fields: ['ai_estimate_created_at'],
      },
    ],
  }
);

// Виртуальное поле для расчета времени выполнения
Task.prototype.getActualDuration = function () {
  if (this.started && this.completed) {
    return (this.completed - this.started) / (1000 * 60 * 60); // в часах
  }
  return null;
};

// Метод для поиска похожих задач
Task.findSimilar = async function (currentTask, limit = 5) {
  const { Op } = require('sequelize');

  console.log('🔍 Поиск похожих задач:', {
    currentTaskId: currentTask.id,
    currentTaskKey: currentTask.jiraKey,
    assignee: currentTask.assignee,
    issueType: currentTask.issueType,
    projectKey: currentTask.projectKey,
    labels: currentTask.labels,
    components: currentTask.components,
    limit,
  });

  // Проверяем, что все необходимые поля определены
  if (!currentTask.projectKey) {
    console.log(
      '⚠️ projectKey не определен, используем только assignee и issueType'
    );
  }

  const whereCondition = {
    id: { [Op.ne]: currentTask.id },
    assignee: currentTask.assignee,
    issueType: currentTask.issueType,
  };

  // Добавляем условия поиска только если поля определены
  const orConditions = [];

  if (currentTask.projectKey) {
    orConditions.push({ projectKey: currentTask.projectKey });
  }

  if (currentTask.labels && currentTask.labels.length > 0) {
    // Используем правильный оператор @> с приведением типов для PostgreSQL
    orConditions.push(
      sequelize.where(
        sequelize.literal(
          `"labels"::jsonb @> '${JSON.stringify(currentTask.labels)}'::jsonb`
        ),
        true
      )
    );
  }

  if (currentTask.components && currentTask.components.length > 0) {
    orConditions.push(
      sequelize.where(
        sequelize.literal(
          `"components"::jsonb @> '${JSON.stringify(
            currentTask.components
          )}'::jsonb`
        ),
        true
      )
    );
  }

  if (orConditions.length > 0) {
    whereCondition[Op.or] = orConditions;
  }

  console.log('🔍 Условия поиска:', whereCondition);

  return this.findAll({
    where: whereCondition,
    order: [['created', 'DESC']],
    limit,
  });
};

module.exports = Task;
