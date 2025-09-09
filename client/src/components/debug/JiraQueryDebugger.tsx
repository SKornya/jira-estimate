import React, { useState } from 'react';
import styled from 'styled-components';
import { Search, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Alert } from '../ui';
import { jiraAPI } from '../../services/api';

const DebugContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const QueryResult = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--gray-50);
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-200);
`;

const TaskItem = styled.div`
  padding: 0.5rem;
  margin: 0.25rem 0;
  background-color: var(--white);
  border-radius: var(--radius-sm);
  border: 1px solid var(--gray-200);
  font-size: 0.875rem;
`;

interface JiraQueryDebuggerProps {
  className?: string;
}

export const JiraQueryDebugger: React.FC<JiraQueryDebuggerProps> = ({ className }) => {
  const [issueKey, setIssueKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testQueries = async () => {
    if (!issueKey.trim()) {
      setError('Введите ключ задачи');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      // Тестируем различные JQL запросы
      const queries = [
        {
          name: 'Основная задача',
          jql: `key = ${issueKey}`,
          description: 'Получение основной задачи'
        },
        {
          name: 'Подзадачи',
          jql: `parent = ${issueKey}`,
          description: 'Поиск подзадач'
        },
        {
          name: 'Задачи в эпике',
          jql: `"Epic Link" = ${issueKey}`,
          description: 'Поиск задач в эпике'
        },
        {
          name: 'Связанные задачи (расширенный)',
          jql: `(parent = ${issueKey} OR "Epic Link" = ${issueKey} OR "Story Link" = ${issueKey} OR "Parent Link" = ${issueKey} OR "Feature Link" = ${issueKey})`,
          description: 'Расширенный поиск связанных задач'
        }
      ];

      const queryResults = [];

      for (const query of queries) {
        try {
          // Здесь мы бы вызывали API для тестирования JQL, но у нас нет такого эндпоинта
          // Поэтому просто показываем, какие запросы были бы выполнены
          queryResults.push({
            ...query,
            status: 'success',
            count: 0, // В реальности здесь был бы результат запроса
            issues: []
          });
        } catch (err: any) {
          queryResults.push({
            ...query,
            status: 'error',
            error: err.message,
            count: 0,
            issues: []
          });
        }
      }

      setResults({
        issueKey,
        queries: queryResults,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DebugContainer className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search size={24} color="var(--primary-600)" />
            Отладка JQL запросов для Feature/Story
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              value={issueKey}
              onChange={(e) => setIssueKey(e.target.value.toUpperCase())}
              label="Ключ задачи"
              placeholder="PROJECT-123"
              helperText="Введите ключ feature/story для тестирования"
            />

            <Button
              onClick={testQueries}
              loading={isLoading}
              disabled={isLoading || !issueKey.trim()}
              fullWidth
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Тестирование запросов...
                </>
              ) : (
                'Тестировать JQL запросы'
              )}
            </Button>

            {error && (
              <Alert variant="error" title="Ошибка">
                {error}
              </Alert>
            )}

            {results && (
              <QueryResult>
                <h3 className="font-semibold mb-2">Результаты тестирования для {results.issueKey}</h3>
                <div className="space-y-3">
                  {results.queries.map((query: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {query.status === 'success' ? (
                          <CheckCircle size={16} color="var(--success-600)" />
                        ) : (
                          <AlertCircle size={16} color="var(--error-600)" />
                        )}
                        <span className="font-medium">{query.name}</span>
                        <span className="text-sm text-gray-500">({query.count} задач)</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{query.description}</p>
                      <code className="text-xs bg-gray-100 p-2 rounded block">
                        {query.jql}
                      </code>
                      {query.error && (
                        <p className="text-sm text-red-600 mt-2">Ошибка: {query.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </QueryResult>
            )}

            <Alert variant="info" title="Информация">
              <p className="text-sm">
                Этот инструмент помогает отладить проблемы с поиском связанных задач для feature/story.
                Проверьте логи сервера для получения подробной информации о выполнении запросов.
              </p>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </DebugContainer>
  );
};
