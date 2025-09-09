import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Search, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Alert, LoadingSpinner } from '../ui';
import { estimationAPI } from '../../services/api';
import { Task, EstimationResponse } from '../../types';

interface EstimationProcessProps {
  task: Task;
  relatedTasks?: Task[]; // Добавляем связанные задачи
  onEstimationComplete: (response: EstimationResponse) => void;
  onCancel: () => void;
  className?: string;
}

const ProcessContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const StepContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
`;

const StepIcon = styled.div<{ status: 'pending' | 'active' | 'completed' | 'error' }>`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-normal);

  ${({ status }) => {
    switch (status) {
      case 'completed':
        return `
          background-color: var(--success-100);
          color: var(--success-600);
        `;
      case 'active':
        return `
          background-color: var(--primary-100);
          color: var(--primary-600);
        `;
      case 'error':
        return `
          background-color: var(--error-100);
          color: var(--error-600);
        `;
      default:
        return `
          background-color: var(--gray-100);
          color: var(--gray-400);
        `;
    }
  }}
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h3<{ status: 'pending' | 'active' | 'completed' | 'error' }>`
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: ${({ status }) => {
    switch (status) {
      case 'completed':
        return 'var(--success-700)';
      case 'active':
        return 'var(--primary-700)';
      case 'error':
        return 'var(--error-700)';
      default:
        return 'var(--gray-700)';
    }
  }};
`;

const StepDescription = styled.p`
  font-size: 0.875rem;
  color: var(--gray-600);
  margin: 0;
  line-height: 1.4;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin: 1rem 0;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, var(--primary-500) 0%, var(--secondary-500) 100%);
  border-radius: var(--radius-full);
`;

const EstimationResult = styled(Card)`
  background: linear-gradient(135deg, var(--success-50) 0%, var(--primary-50) 100%);
  border: 1px solid var(--success-200);
`;

const EstimationValue = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: var(--success-600);
  text-align: center;
  margin-bottom: 1rem;
`;

const ConfidenceIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const ConfidenceBar = styled.div`
  width: 200px;
  height: 8px;
  background-color: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
`;

const ConfidenceFill = styled.div<{ confidence: number }>`
  height: 100%;
  background: linear-gradient(90deg, var(--error-500) 0%, var(--warning-500) 50%, var(--success-500) 100%);
  width: ${({ confidence }) => confidence * 100}%;
  transition: width var(--transition-normal);
`;

const ReasoningText = styled.p`
  font-size: 0.875rem;
  color: var(--gray-700);
  line-height: 1.5;
  text-align: center;
  margin: 0;
`;

const SimilarTasksInfo = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--gray-50);
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-200);
`;

const SimilarTasksTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SimilarTasksList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SimilarTaskTag = styled.span`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background-color: var(--primary-100);
  color: var(--primary-700);
  border-radius: var(--radius-sm);
  border: 1px solid var(--primary-200);
`;

type StepStatus = 'pending' | 'active' | 'completed' | 'error';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: StepStatus;
}

export const EstimationProcess: React.FC<EstimationProcessProps> = ({
  task,
  relatedTasks = [],
  onEstimationComplete,
  onCancel,
  className,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<Step[]>([
    {
      id: 'search-similar',
      title: 'Поиск похожих задач',
      description: 'Анализируем базу данных для поиска похожих задач...',
      icon: <Search size={20} />,
      status: 'pending',
    },
    {
      id: 'ai-analysis',
      title: 'Анализ ИИ',
      description: 'Искусственный интеллект анализирует задачу и похожие примеры...',
      icon: <Brain size={20} />,
      status: 'pending',
    },
    {
      id: 'estimation',
      title: 'Расчет оценки',
      description: 'Формируем итоговую оценку времени выполнения...',
      icon: <Clock size={20} />,
      status: 'pending',
    },
  ]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const updateStepStatus = (stepIndex: number, status: StepStatus) => {
    setSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, status } : step
    ));
  };

  const runEstimation = useCallback(async () => {
    try {
      setError(null);
      
      console.log('🚀 Начало процесса оценки:', {
        task: {
          key: task.jiraKey,
          type: task.issueType,
          title: task.title
        },
        relatedTasksCount: relatedTasks.length,
        relatedTasks: relatedTasks.map(rt => ({
          key: rt.jiraKey,
          type: rt.issueType,
          title: rt.title
        }))
      });
      
      // Шаг 1: Поиск похожих задач
      setCurrentStep(0);
      updateStepStatus(0, 'active');
      setProgress(10);
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Имитация поиска
      updateStepStatus(0, 'completed');
      
      // Шаг 2: Анализ ИИ
      setCurrentStep(1);
      updateStepStatus(1, 'active');
      setProgress(50);
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Имитация анализа
      updateStepStatus(1, 'completed');
      
      // Шаг 3: Получение оценки
      setCurrentStep(2);
      updateStepStatus(2, 'active');
      setProgress(80);
      
      const response = await estimationAPI.estimate({
        taskData: task,
        includeSimilarTasks: true,
        relatedTasks: relatedTasks.length > 0 ? relatedTasks : undefined,
      });
      
      updateStepStatus(2, 'completed');
      setProgress(100);
      
      // Показываем результат
      setTimeout(() => {
        onEstimationComplete(response);
      }, 1000);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка получения оценки');
      updateStepStatus(currentStep, 'error');
    }
  }, [task, relatedTasks, onEstimationComplete]);

  useEffect(() => {
    runEstimation();
  }, [runEstimation]);

  return (
    <ProcessContainer className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain size={24} color="var(--primary-600)" />
            Оценка времени выполнения
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-1">{task.jiraKey}</h3>
            <p className="text-sm text-gray-600">{task.title}</p>
          </div>

          {error && (
            <Alert variant="error" title="Ошибка оценки">
              {error}
            </Alert>
          )}

          <ProgressBar>
            <ProgressFill
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </ProgressBar>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <StepContainer
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="mb-4"
              >
                <StepIcon status={step.status}>
                  {step.status === 'active' ? (
                    <LoadingSpinner size="sm" color="var(--primary-600)" />
                  ) : step.status === 'completed' ? (
                    <CheckCircle size={20} />
                  ) : step.status === 'error' ? (
                    <AlertCircle size={20} />
                  ) : (
                    step.icon
                  )}
                </StepIcon>
                <StepContent>
                  <StepTitle status={step.status}>{step.title}</StepTitle>
                  <StepDescription>{step.description}</StepDescription>
                </StepContent>
              </StepContainer>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="ghost" onClick={onCancel} disabled={progress === 100}>
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    </ProcessContainer>
  );
};
