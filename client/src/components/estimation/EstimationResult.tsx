import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Clock, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../ui';
import { EstimationResponse } from '../../types';

interface EstimationResultProps {
  result: EstimationResponse;
  onNewEstimation: () => void;
  onViewHistory: () => void;
  className?: string;
}

const ResultContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const MainResult = styled(Card)`
  background: linear-gradient(135deg, var(--success-50) 0%, var(--primary-50) 100%);
  border: 1px solid var(--success-200);
`;

const EstimationValue = styled.div`
  font-size: 4rem;
  font-weight: 700;
  color: var(--success-600);
  text-align: center;
  margin-bottom: 1rem;
  line-height: 1;
`;

const EstimationLabel = styled.div`
  font-size: 1.25rem;
  color: var(--success-700);
  text-align: center;
  margin-bottom: 2rem;
  font-weight: 500;
`;

const ConfidenceSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ConfidenceValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-900);
`;

const ConfidenceBar = styled.div`
  width: 100%;
  height: 12px;
  background-color: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
`;

const ConfidenceFill = styled.div<{ confidence: number }>`
  height: 100%;
  background: linear-gradient(90deg, var(--error-500) 0%, var(--warning-500) 50%, var(--success-500) 100%);
  width: ${({ confidence }) => confidence * 100}%;
  transition: width var(--transition-normal);
  border-radius: var(--radius-full);
`;

const ReasoningCard = styled(Card)`
  background-color: var(--white);
  border: 1px solid var(--gray-200);
`;

const ReasoningText = styled.p`
  font-size: 1rem;
  color: var(--gray-700);
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
`;

const SimilarTasksCard = styled(Card)`
  background-color: var(--white);
  border: 1px solid var(--gray-200);
`;

const SimilarTasksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SimilarTaskItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: var(--gray-50);
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-200);
`;

const SimilarTaskInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SimilarTaskKey = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary-600);
`;

const SimilarTaskTitle = styled.span`
  font-size: 0.75rem;
  color: var(--gray-600);
  line-height: 1.3;
`;

const SimilarTaskDuration = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
`;

const DurationValue = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-900);
`;

const DurationLabel = styled.span`
  font-size: 0.75rem;
  color: var(--gray-500);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'var(--success-600)';
  if (confidence >= 0.6) return 'var(--warning-600)';
  return 'var(--error-600)';
};

const getConfidenceLabel = (confidence: number) => {
  if (confidence >= 0.8) return 'Высокая уверенность';
  if (confidence >= 0.6) return 'Средняя уверенность';
  return 'Низкая уверенность';
};

export const EstimationResult: React.FC<EstimationResultProps> = ({
  result,
  onNewEstimation,
  onViewHistory,
  className,
}) => {
  const { estimation, similarTasks } = result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <ResultContainer>
        <MainResult>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Brain size={24} color="var(--success-600)" />
              Результат оценки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EstimationValue>{estimation.estimate}</EstimationValue>
            <EstimationLabel>часов</EstimationLabel>

            <ConfidenceSection>
              <div className="flex items-center gap-2">
                <Target size={20} color="var(--gray-600)" />
                <span className="text-gray-600">Уверенность:</span>
                <ConfidenceValue style={{ color: getConfidenceColor(estimation.confidence) }}>
                  {Math.round(estimation.confidence * 100)}%
                </ConfidenceValue>
              </div>
              
              <ConfidenceBar>
                <ConfidenceFill confidence={estimation.confidence} />
              </ConfidenceBar>
              
              <Badge 
                variant={estimation.confidence >= 0.8 ? 'success' : estimation.confidence >= 0.6 ? 'warning' : 'error'}
                size="sm"
              >
                {getConfidenceLabel(estimation.confidence)}
              </Badge>
            </ConfidenceSection>

            <ActionButtons>
              <Button variant="primary" onClick={onNewEstimation} fullWidth>
                Новая оценка
              </Button>
              <Button variant="ghost" onClick={onViewHistory} fullWidth>
                История оценок
              </Button>
            </ActionButtons>
          </CardContent>
        </MainResult>

        <div className="space-y-4">
          <ReasoningCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain size={20} color="var(--primary-600)" />
                Обоснование
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReasoningText>{estimation.reasoning}</ReasoningText>
            </CardContent>
          </ReasoningCard>

          {similarTasks.length > 0 && (
            <SimilarTasksCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={20} color="var(--primary-600)" />
                  Похожие задачи ({similarTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimilarTasksList>
                  {similarTasks.map((task, index) => (
                    <SimilarTaskItem key={index}>
                      <SimilarTaskInfo>
                        <SimilarTaskKey>{task.jiraKey}</SimilarTaskKey>
                        <SimilarTaskTitle>{task.title}</SimilarTaskTitle>
                      </SimilarTaskInfo>
                      <SimilarTaskDuration>
                        <DurationValue>
                          {task.actualDuration ? `${Math.round(task.actualDuration)} ч` : 'Не завершена'}
                        </DurationValue>
                        <DurationLabel>
                          {task.timeSpent ? `Затрачено: ${task.timeSpent} ч` : task.status}
                        </DurationLabel>
                      </SimilarTaskDuration>
                    </SimilarTaskItem>
                  ))}
                </SimilarTasksList>
              </CardContent>
            </SimilarTasksCard>
          )}
        </div>
      </ResultContainer>
    </motion.div>
  );
};
