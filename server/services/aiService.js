const axios = require('axios');

class AIService {
  constructor(
    apiKey = process.env.AI_API_KEY,
    model = process.env.AI_MODEL || 'gpt-3.5-turbo',
    host = process.env.AI_HOST || 'https://api.openai.com/v1'
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = host;

    console.log('🤖 Создание AIService:', {
      model: this.model,
      baseUrl: this.baseUrl,
      apiKeyLength: this.apiKey ? this.apiKey.length : 0,
      hasApiKey: !!this.apiKey,
    });
  }

  // Оценка времени выполнения задачи
  async estimateTaskTime(task, similarTasks = [], relatedTasks = []) {
    try {
      const prompt = this.buildEstimationPrompt(
        task,
        similarTasks,
        relatedTasks
      );

      console.log('🤖 AI запрос на оценку задачи:', {
        taskKey: task.jiraKey,
        taskTitle: task.title,
        taskType: task.issueType,
        similarTasksCount: similarTasks.length,
        relatedTasksCount: relatedTasks.length,
        promptLength: prompt.length,
        model: this.model,
        apiKeyLength: this.apiKey ? this.apiKey.length : 0,
      });

      const requestData = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'Ты эксперт по оценке времени выполнения задач в разработке ПО. Твоя задача - дать точную оценку времени выполнения задачи в часах, основываясь на описании задачи и похожих задачах.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      };

      console.log('🤖 Отправка запроса к OpenAI:', {
        url: `${this.baseUrl}/chat/completions`,
        model: requestData.model,
        messagesCount: requestData.messages.length,
        temperature: requestData.temperature,
        maxTokens: requestData.max_tokens,
      });

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ AI ответ получен:', {
        status: response.status,
        statusText: response.statusText,
        usage: response.data.usage,
        choicesCount: response.data.choices?.length || 0,
        finishReason: response.data.choices?.[0]?.finish_reason,
      });

      const content = response.data.choices[0].message.content;
      const parsedResult = this.parseEstimationResponse(content);

      console.log('🤖 Результат парсинга AI ответа:', {
        estimate: parsedResult.estimate,
        confidence: parsedResult.confidence,
        reasoningLength: parsedResult.reasoning?.length || 0,
        rawResponseLength: parsedResult.rawResponse?.length || 0,
      });

      return parsedResult;
    } catch (error) {
      console.error('❌ Ошибка AI сервиса:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        apiKeyLength: this.apiKey ? this.apiKey.length : 0,
      });
      throw new Error('Не удалось получить оценку от AI сервиса');
    }
  }

  // Построение промпта для оценки
  buildEstimationPrompt(task, similarTasks, relatedTasks) {
    // Сокращаем описание основной задачи до 500 символов
    const shortDescription = task.description
      ? task.description.substring(0, 500) +
        (task.description.length > 500 ? '...' : '')
      : 'Описание отсутствует';

    let prompt = `Оцени время выполнения следующей задачи в часах:

ЗАДАЧА:
- Тип: ${task.issueType}
- Название: ${task.title}
- Описание: ${shortDescription}
- Приоритет: ${task.priority}
- Проект: ${task.project.name}
- Компоненты: ${task.components.join(', ') || 'Не указаны'}
- Метки: ${task.labels.join(', ') || 'Не указаны'}`;

    // Добавляем информацию о связанных задачах для feature/story
    if (relatedTasks.length > 0) {
      // Ограничиваем количество связанных задач для предотвращения переполнения
      const maxRelatedTasks = 10;
      const limitedRelatedTasks = relatedTasks.slice(0, maxRelatedTasks);

      console.log('🤖 Добавление связанных задач в промпт для AI:', {
        taskKey: task.jiraKey,
        relatedTasksCount: relatedTasks.length,
        limitedCount: limitedRelatedTasks.length,
        relatedTasks: limitedRelatedTasks.map((rt) => ({
          key: rt.jiraKey,
          type: rt.issueType,
          title: rt.title,
        })),
      });

      prompt += `\n\nСВЯЗАННЫЕ ЗАДАЧИ (включены в эту feature/story):`;

      if (relatedTasks.length > maxRelatedTasks) {
        prompt += `\n\nВсего связанных задач: ${relatedTasks.length} (показаны первые ${maxRelatedTasks}):`;
      }

      limitedRelatedTasks.forEach((relatedTask, index) => {
        const actualTime = relatedTask.actualDuration;
        const timeSpent = relatedTask.timeSpent
          ? Math.round(relatedTask.timeSpent / 3600)
          : 'неизвестно';

        // Сокращаем описание до 200 символов
        const shortDescription = relatedTask.description
          ? relatedTask.description.substring(0, 200) +
            (relatedTask.description.length > 200 ? '...' : '')
          : 'Описание отсутствует';

        prompt += `\n\n${index + 1}. ${relatedTask.jiraKey}: ${
          relatedTask.title
        }
- Тип: ${relatedTask.issueType}
- Описание: ${shortDescription}
- Время выполнения: ${
          actualTime ? Math.round(actualTime) + ' часов' : 'неизвестно'
        }
- Затраченное время: ${timeSpent} часов
- Статус: ${relatedTask.status}`;
      });

      prompt += `\n\nВАЖНО: При оценке времени выполнения основной задачи (${task.jiraKey}) учитывай, что она включает в себя все связанные задачи (всего ${relatedTasks.length}). Общая оценка должна покрывать выполнение всех этих задач.`;
    } else {
      console.log('🤖 Связанные задачи отсутствуют для задачи:', {
        taskKey: task.jiraKey,
        taskType: task.issueType,
      });
    }

    if (similarTasks.length > 0) {
      // Ограничиваем количество похожих задач
      const maxSimilarTasks = 5;
      const limitedSimilarTasks = similarTasks.slice(0, maxSimilarTasks);

      prompt += `\n\nПОХОЖИЕ ЗАДАЧИ (для сравнения):`;

      limitedSimilarTasks.forEach((similarTask, index) => {
        const actualTime = similarTask.actualDuration;
        const timeSpent = similarTask.timeSpent
          ? Math.round(similarTask.timeSpent / 3600)
          : 'неизвестно';

        prompt += `\n\n${index + 1}. ${similarTask.jiraKey}: ${
          similarTask.title
        }
- Тип: ${similarTask.issueType}
- Время выполнения: ${
          actualTime ? Math.round(actualTime) + ' часов' : 'неизвестно'
        }
- Затраченное время: ${timeSpent} часов
- Статус: ${similarTask.status}`;
      });
    }

    prompt += `\n\nДай оценку в следующем формате:
ОЦЕНКА: [число] часов
УВЕРЕННОСТЬ: [число от 0 до 100]%
ОБОСНОВАНИЕ: [краткое объяснение оценки, учитывая сложность, похожие задачи и другие факторы]`;

    // Логируем размер промпта для отладки
    const promptSizeKB = Math.round(prompt.length / 1024);
    console.log('📏 Размер промпта для AI:', {
      taskKey: task.jiraKey,
      promptSizeKB,
      promptLength: prompt.length,
      relatedTasksCount: relatedTasks.length,
      similarTasksCount: similarTasks.length,
    });

    return prompt;
  }

  // Парсинг ответа AI
  parseEstimationResponse(content) {
    try {
      const lines = content.split('\n');
      let estimate = null;
      let confidence = null;
      let reasoning = '';

      for (const line of lines) {
        if (line.startsWith('ОЦЕНКА:')) {
          const match = line.match(/(\d+(?:\.\d+)?)/);
          if (match) {
            estimate = parseFloat(match[1]);
          }
        } else if (line.startsWith('УВЕРЕННОСТЬ:')) {
          const match = line.match(/(\d+(?:\.\d+)?)/);
          if (match) {
            confidence = parseFloat(match[1]) / 100;
          }
        } else if (line.startsWith('ОБОСНОВАНИЕ:')) {
          reasoning = line.replace('ОБОСНОВАНИЕ:', '').trim();
        }
      }

      // Если не удалось распарсить, пытаемся извлечь числа из текста
      if (estimate === null) {
        const estimateMatch = content.match(/(\d+(?:\.\d+)?)\s*час/);
        if (estimateMatch) {
          estimate = parseFloat(estimateMatch[1]);
        }
      }

      if (confidence === null) {
        const confidenceMatch = content.match(/(\d+(?:\.\d+)?)%/);
        if (confidenceMatch) {
          confidence = parseFloat(confidenceMatch[1]) / 100;
        } else {
          confidence = 0.7; // Значение по умолчанию
        }
      }

      if (!reasoning) {
        reasoning =
          'Оценка основана на анализе описания задачи и сравнении с похожими задачами.';
      }

      return {
        estimate: estimate || 8, // Значение по умолчанию
        confidence: Math.min(Math.max(confidence, 0), 1),
        reasoning: reasoning,
        rawResponse: content,
      };
    } catch (error) {
      console.error('Ошибка парсинга ответа AI:', error);
      return {
        estimate: 8,
        confidence: 0.5,
        reasoning: 'Не удалось обработать ответ AI сервиса.',
        rawResponse: content,
      };
    }
  }

  // Проверка доступности AI сервиса
  async testConnection() {
    try {
      const url = `${this.baseUrl}/models`;
      console.log('🤖 Тестирование подключения к OpenAI:', {
        url,
        model: this.model,
        apiKeyLength: this.apiKey ? this.apiKey.length : 0,
      });

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      console.log('✅ Подключение к OpenAI успешно:', {
        status: response.status,
        modelsCount: response.data?.data?.length || 0,
      });

      return response.status === 200;
    } catch (error) {
      console.error('❌ Ошибка подключения к OpenAI:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        apiKeyLength: this.apiKey ? this.apiKey.length : 0,
      });
      return false;
    }
  }
}

module.exports = AIService;
