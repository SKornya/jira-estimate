const axios = require('axios');

class JiraService {
  constructor(baseUrl, email, apiToken) {
    this.baseUrl = baseUrl;
    this.email = email;
    this.apiToken = apiToken;

    // Генерируем Basic токен из email:apiToken
    this.basicAuthToken = Buffer.from(`${email}:${apiToken}`).toString(
      'base64'
    );

    console.log('🔧 Создание JiraService:', {
      baseUrl: this.baseUrl,
      email: this.email,
      apiTokenLength: this.apiToken ? this.apiToken.length : 0,
      basicAuthToken: this.basicAuthToken ? this.basicAuthToken : 0,
      hasBaseUrl: !!this.baseUrl,
      hasEmail: !!this.email,
      hasApiToken: !!this.apiToken,
    });
  }

  // Получение информации о задаче по ключу
  async getIssue(issueKey) {
    try {
      const url = `${this.baseUrl}/rest/api/2/issue/${issueKey}`;
      console.log('🔍 Jira API v2 запрос:', {
        url,
        issueKey,
        baseUrl: this.baseUrl,
        email: this.email,
        apiTokenLength: this.apiToken ? this.apiToken.length : 0,
        email: this.email,
        apiTokenLength: this.apiToken ? this.apiToken.length : 0,
        basicAuthToken: this.basicAuthToken ? this.basicAuthToken : 0,
      });

      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${this.basicAuthToken}`,
        },
        params: {
          expand: 'changelog,transitions,subtasks',
          fields:
            'summary,description,issuetype,status,assignee,reporter,project,created,updated,priority,labels,components,fixVersions,parent,subtasks,timetracking,issuelinks',
        },
      });

      console.log('✅ Jira API ответ успешен:', {
        issueKey,
        status: response.status,
        dataKeys: Object.keys(response.data || {}),
        fieldsKeys: Object.keys(response.data?.fields || {}),
        issueType: response.data?.fields?.issuetype?.name,
        hasSubtasks: !!response.data?.fields?.subtasks,
        subtasksCount: response.data?.fields?.subtasks?.length || 0,
        hasParent: !!response.data?.fields?.parent,
        parentKey: response.data?.fields?.parent?.key,
      });

      return this.formatIssue(response.data);
    } catch (error) {
      console.error('❌ Ошибка получения задачи из Jira:', {
        issueKey,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        email: this.email,
        apiTokenLength: this.apiToken ? this.apiToken.length : 0,
        basicAuthToken: this.basicAuthToken ? this.basicAuthToken : 0,
      });

      throw new Error(
        `Не удалось получить задачу ${issueKey}: ${
          error.response?.data?.errorMessages?.[0] || error.message
        }`
      );
    }
  }

  // Получение задач из портфеля или эпика
  async getIssuesFromPortfolio(issueKey) {
    try {
      const jql = `"Epic Link" = ${issueKey} OR parent = ${issueKey}`;
      const response = await axios.get(`${this.baseUrl}/rest/api/2/search`, {
        headers: {
          Authorization: `Basic ${this.basicAuthToken}`,
        },
        params: {
          jql: jql,
          maxResults: 100,
          fields:
            'summary,description,issuetype,status,assignee,reporter,project,created,updated,priority,labels,components,fixVersions,parent,subtasks,timetracking,issuelinks',
        },
      });

      return response.data.issues.map((issue) => this.formatIssue(issue));
    } catch (error) {
      console.error(
        'Ошибка получения задач из портфеля:',
        error.response?.data || error.message
      );
      throw new Error(
        `Не удалось получить задачи из портфеля ${issueKey}: ${
          error.response?.data?.errorMessages?.[0] || error.message
        }`
      );
    }
  }

  // Получение связанных задач для feature/story
  async getRelatedIssues(issueKey, issueType) {
    try {
      let jql = '';

      // Для feature/story ищем задачи, которые ссылаются на них или являются их подзадачами
      if (issueType === 'Story' || issueType === 'New Feature') {
        // Расширенный JQL запрос для поиска связанных задач
        // Ищем подзадачи, задачи в эпике, задачи со ссылкой на story, и задачи с родительской связью
        jql = `(parent = ${issueKey} OR "Epic Link" = ${issueKey} OR "Story Link" = ${issueKey} OR "Parent Link" = ${issueKey} OR "Feature Link" = ${issueKey} OR issue in linkedIssues(${issueKey}, "is included in"))`;
      } else {
        // Для других типов задач используем стандартную логику
        jql = `parent = ${issueKey} OR "Epic Link" = ${issueKey}`;
      }

      console.log('🔍 Поиск связанных задач:', {
        issueKey,
        issueType,
        jql,
      });

      let response;
      let relatedIssues = [];

      try {
        response = await axios.get(`${this.baseUrl}/rest/api/2/search`, {
          headers: {
            Authorization: `Basic ${this.basicAuthToken}`,
          },
          params: {
            jql: jql,
            maxResults: 100,
            fields:
              'summary,description,issuetype,status,assignee,reporter,project,created,updated,priority,labels,components,fixVersions,parent,subtasks,timetracking,issuelinks',
          },
        });

        relatedIssues = response.data.issues.map((issue) =>
          this.formatIssue(issue)
        );
      } catch (jqlError) {
        console.log('⚠️ Основной JQL запрос не сработал, пробуем упрощенный:', {
          issueKey,
          originalJql: jql,
          error: jqlError.response?.data || jqlError.message,
        });

        // Пробуем упрощенный запрос
        const simpleJql = `parent = ${issueKey}`;
        response = await axios.get(`${this.baseUrl}/rest/api/2/search`, {
          headers: {
            Authorization: `Basic ${this.basicAuthToken}`,
          },
          params: {
            jql: simpleJql,
            maxResults: 100,
            fields:
              'summary,description,issuetype,status,assignee,reporter,project,created,updated,priority,labels,components,fixVersions,parent,subtasks,timetracking,issuelinks',
          },
        });

        relatedIssues = response.data.issues.map((issue) =>
          this.formatIssue(issue)
        );
      }

      // Дополнительно ищем связанные задачи через issuelinks
      const linkedIssues = await this.getLinkedIssues(issueKey);
      relatedIssues = [...relatedIssues, ...linkedIssues];

      // Убираем дубликаты
      const uniqueIssues = relatedIssues.filter(
        (issue, index, self) =>
          index === self.findIndex((t) => t.jiraKey === issue.jiraKey)
      );

      console.log('✅ Найдено связанных задач:', {
        issueKey,
        issueType,
        count: uniqueIssues.length,
        jqlCount: relatedIssues.length - linkedIssues.length,
        linkedCount: linkedIssues.length,
        issues: uniqueIssues.map((issue) => ({
          key: issue.jiraKey,
          type: issue.issueType,
          title: issue.title,
        })),
      });

      return uniqueIssues;
    } catch (error) {
      console.error(
        'Ошибка получения связанных задач:',
        error.response?.data || error.message
      );
      throw new Error(
        `Не удалось получить связанные задачи для ${issueKey}: ${
          error.response?.data?.errorMessages?.[0] || error.message
        }`
      );
    }
  }

  // Получение связанных задач через issuelinks
  async getLinkedIssues(issueKey) {
    try {
      console.log('🔗 Поиск связанных задач через issuelinks:', { issueKey });

      // Получаем основную задачу с issuelinks
      const mainIssue = await this.getIssue(issueKey);

      if (!mainIssue.issueLinks || mainIssue.issueLinks.length === 0) {
        console.log('ℹ️ У задачи нет связанных задач через issuelinks');
        return [];
      }

      console.log('🔗 Найдены issuelinks:', {
        issueKey,
        linksCount: mainIssue.issueLinks.length,
        links: mainIssue.issueLinks.map((link) => ({
          type: link.type?.name,
          outwardIssue: link.outwardIssue?.key,
          inwardIssue: link.inwardIssue?.key,
        })),
      });

      // Собираем ключи связанных задач
      const linkedIssueKeys = [];

      mainIssue.issueLinks.forEach((link) => {
        if (link.outwardIssue?.key && link.outwardIssue.key !== issueKey) {
          linkedIssueKeys.push(link.outwardIssue.key);
        }
        if (link.inwardIssue?.key && link.inwardIssue.key !== issueKey) {
          linkedIssueKeys.push(link.inwardIssue.key);
        }
      });

      if (linkedIssueKeys.length === 0) {
        console.log('ℹ️ Не найдено связанных задач в issuelinks');
        return [];
      }

      // Получаем информацию о связанных задачах
      const jql = `key in (${linkedIssueKeys.join(', ')})`;
      const response = await axios.get(`${this.baseUrl}/rest/api/2/search`, {
        headers: {
          Authorization: `Basic ${this.basicAuthToken}`,
        },
        params: {
          jql: jql,
          maxResults: 100,
          fields:
            'summary,description,issuetype,status,assignee,reporter,project,created,updated,priority,labels,components,fixVersions,parent,subtasks,timetracking,issuelinks',
        },
      });

      const linkedIssues = response.data.issues.map((issue) =>
        this.formatIssue(issue)
      );

      console.log('✅ Найдено связанных задач через issuelinks:', {
        issueKey,
        count: linkedIssues.length,
        issues: linkedIssues.map((issue) => ({
          key: issue.jiraKey,
          type: issue.issueType,
          title: issue.title,
        })),
      });

      return linkedIssues;
    } catch (error) {
      console.error(
        'Ошибка получения связанных задач через issuelinks:',
        error
      );
      return [];
    }
  }

  // Получение задач пользователя
  async getUserIssues(username, maxResults = 50) {
    try {
      const jql = `assignee = "${username}" ORDER BY created DESC`;
      const response = await axios.get(`${this.baseUrl}/rest/api/2/search`, {
        headers: {
          Authorization: `Basic ${this.basicAuthToken}`,
        },
        params: {
          jql: jql,
          maxResults: maxResults,
          fields:
            'summary,description,issuetype,status,assignee,reporter,project,created,updated,priority,labels,components,fixVersions,parent,subtasks,timetracking,changelog',
        },
      });

      return response.data.issues.map((issue) => this.formatIssue(issue));
    } catch (error) {
      console.error(
        'Ошибка получения задач пользователя:',
        error.response?.data || error.message
      );
      throw new Error(
        `Не удалось получить задачи пользователя ${username}: ${
          error.response?.data?.errorMessages?.[0] || error.message
        }`
      );
    }
  }

  // Маппинг типов задач
  mapIssueType(issueTypeName) {
    const typeMapping = {
      Задача: 'Task',
      Story: 'Story',
      Task: 'Task',
      Bug: 'Bug',
      Epic: 'Epic',
      Portfolio: 'Portfolio',
      Подзадача: 'Subtask',
      Subtask: 'Subtask',
      Improvement: 'Improvement',
      'New Feature': 'New Feature',
      'Новая функция': 'New Feature',
    };

    const mappedType = typeMapping[issueTypeName] || issueTypeName || 'Task';

    if (issueTypeName && issueTypeName !== mappedType) {
      console.log('🔄 Маппинг типа задачи:', {
        original: issueTypeName,
        mapped: mappedType,
      });
    }

    return mappedType;
  }

  // Форматирование данных задачи
  formatIssue(issue) {
    const fields = issue.fields;

    return {
      jiraKey: issue.key,
      jiraId: issue.id,
      title: fields.summary || '',
      description: fields.description || '',
      issueType: this.mapIssueType(fields.issuetype?.name),
      status: fields.status?.name || 'Open',
      priority: fields.priority?.name || 'Medium',
      assignee:
        fields.assignee?.displayName || fields.assignee?.name || 'Unassigned',
      reporter:
        fields.reporter?.displayName || fields.reporter?.name || 'Unknown',
      projectKey: fields.project?.key || '',
      projectName: fields.project?.name || '',
      project: {
        key: fields.project?.key || '',
        name: fields.project?.name || '',
      },
      created: new Date(fields.created),
      updated: new Date(fields.updated),
      labels: fields.labels || [],
      components: fields.components?.map((c) => c.name) || [],
      fixVersions: fields.fixVersions?.map((v) => v.name) || [],
      parentKey: fields.parent?.key || null,
      subtasks: fields.subtasks?.map((st) => st.key) || [],
      originalEstimate: fields.timetracking?.originalEstimateSeconds || null,
      timeSpent: fields.timetracking?.timeSpentSeconds || null,
      issueLinks: fields.issuelinks || [],
      // Извлекаем временные метки из changelog
      ...this.extractTimestamps(issue.changelog),
    };
  }

  // Извлечение временных меток из истории изменений
  extractTimestamps(changelog) {
    if (!changelog?.histories) {
      return { started: null, completed: null };
    }

    let started = null;
    let completed = null;

    for (const history of changelog.histories) {
      for (const item of history.items) {
        if (item.field === 'status') {
          const fromStatus = item.fromString?.toLowerCase();
          const toStatus = item.toString?.toLowerCase();

          // Определяем начало работы
          if (
            fromStatus === 'to do' &&
            (toStatus === 'in progress' || toStatus === 'in development')
          ) {
            started = new Date(history.created);
          }

          // Определяем завершение
          if (
            (fromStatus === 'in progress' ||
              fromStatus === 'in development' ||
              fromStatus === 'code review') &&
            (toStatus === 'done' ||
              toStatus === 'closed' ||
              toStatus === 'resolved')
          ) {
            completed = new Date(history.created);
          }
        }
      }
    }

    return { started, completed };
  }

  // Проверка доступности Jira
  async testConnection() {
    try {
      const url = `${this.baseUrl}/rest/api/2/myself`;
      console.log('🔍 Тестирование подключения к Jira API v2:', {
        url,
        baseUrl: this.baseUrl,
        email: this.email,
        apiTokenLength: this.apiToken ? this.apiToken.length : 0,
        email: this.email,
        apiTokenLength: this.apiToken ? this.apiToken.length : 0,
        basicAuthToken: this.basicAuthToken ? this.basicAuthToken : 0,
      });

      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${this.basicAuthToken}`,
        },
      });

      console.log('✅ Подключение к Jira успешно:', {
        status: response.status,
        user: response.data?.displayName || response.data?.name,
      });

      return true;
    } catch (error) {
      console.error('❌ Ошибка подключения к Jira:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        email: this.email,
        apiTokenLength: this.apiToken ? this.apiToken.length : 0,
        basicAuthToken: this.basicAuthToken ? this.basicAuthToken : 0,
      });
      return false;
    }
  }
}

module.exports = JiraService;
