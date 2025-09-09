import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { Link, ExternalLink, Loader } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Alert } from '../ui';
import { jiraAPI } from '../../services/api';
import { JiraIssueResponse } from '../../types';

const schema = yup.object({
  issueUrl: yup
    .string()
    .url('Введите корректный URL')
    .required('URL задачи обязателен')
    .test('jira-url', 'URL должен быть ссылкой на задачу Jira', (value) => {
      if (!value) return false;
      // Поддерживаем как atlassian.net, так и другие домены Jira (например, jira.hh.ru)
      const isJiraDomain = value.includes('atlassian.net') || value.includes('jira.') || value.includes('.jira');
      const hasCorrectPath = value.includes('/browse/') || value.includes('/issues/');
      return isJiraDomain && hasCorrectPath;
    }),
});

interface TaskUrlFormProps {
  onTaskLoaded: (response: JiraIssueResponse) => void;
  className?: string;
}

interface FormData {
  issueUrl: string;
}

export const TaskUrlForm: React.FC<TaskUrlFormProps> = ({ onTaskLoaded, className }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await jiraAPI.fetchIssue(data.issueUrl);
      onTaskLoaded(response);
      reset();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки задачи');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link size={24} color="var(--primary-600)" />
            Загрузка задачи из Jira
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="error" title="Ошибка загрузки">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register('issueUrl')}
              type="url"
              label="URL задачи Jira"
              placeholder="https://your-domain.atlassian.net/browse/PROJECT-123 или https://jira.company.com/browse/PROJECT-123"
              error={errors.issueUrl?.message}
              helperText="Вставьте ссылку на задачу, портфель или эпик из Jira"
              startIcon={<ExternalLink size={20} />}
              fullWidth
              disabled={isLoading}
            />

            <div className="mt-6">
              <Button
              type="submit"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Загрузка задачи...
                </>
              ) : (
                'Загрузить задачу'
              )}
            </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Поддерживаемые форматы URL:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li> https://domain.atlassian.net/browse/PROJECT-123</li>
              <li> https://domain.atlassian.net/jira/software/projects/PROJECT/boards/1/backlog?selectedIssue=PROJECT-123</li>
              <li> https://domain.atlassian.net/jira/core/projects/PROJECT/issues/PROJECT-123</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
