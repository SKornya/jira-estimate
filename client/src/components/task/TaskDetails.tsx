import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  AlertCircle, 
  CheckCircle, 
  Play, 
  Pause,
  ExternalLink,
  Brain,
  TrendingUp,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Alert } from '../ui';
import { Task, SimilarTask } from '../../types';

interface TaskDetailsProps {
  task: Task;
  similarTasks?: SimilarTask[];
  className?: string;
}

const TaskDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const TaskHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const TaskKey = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-600);
  margin: 0;
  margin-bottom: 0.5rem;
`;

const TaskTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--gray-900);
  margin: 0;
  line-height: 1.4;
`;

const TaskDescription = styled.div`
  font-size: 1rem;
  color: var(--gray-700);
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 0.5rem;
  
  /* Стилизация скроллбара */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--gray-100);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--gray-300);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: var(--gray-400);
  }
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: var(--gray-50);
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-200);
`;

const MetaIcon = styled.div`
  color: var(--gray-500);
  display: flex;
  align-items: center;
`;

const MetaContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const MetaLabel = styled.span`
  font-size: 0.75rem;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MetaValue = styled.span`
  font-size: 0.875rem;
  color: var(--gray-900);
  font-weight: 500;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const EstimationCard = styled(Card)`
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--secondary-50) 100%);
  border: 1px solid var(--primary-200);
`;

const EstimationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const EstimationValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-600);
  margin-bottom: 0.5rem;
`;

const ConfidenceBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: 1rem;
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
  margin: 0;
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
`;

const SimilarTaskDuration = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-900);
`;

const getStatusColor = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('done') || statusLower.includes('closed') || statusLower.includes('resolved')) {
    return 'success';
  }
  if (statusLower.includes('progress') || statusLower.includes('development')) {
    return 'primary';
  }
  if (statusLower.includes('review') || statusLower.includes('testing')) {
    return 'warning';
  }
  if (statusLower.includes('blocked') || statusLower.includes('rejected')) {
    return 'error';
  }
  return 'default';
};

const getIssueTypeColor = (issueType: string) => {
  switch (issueType) {
    case 'Story':
      return 'primary';
    case 'Task':
      return 'info';
    case 'Bug':
      return 'error';
    case 'Epic':
      return 'secondary';
    case 'Portfolio':
      return 'warning';
    default:
      return 'default';
  }
};

const getPriorityColor = (priority: string) => {
  const priorityLower = priority.toLowerCase();
  if (priorityLower.includes('high') || priorityLower.includes('critical')) {
    return 'error';
  }
  if (priorityLower.includes('medium')) {
    return 'warning';
  }
  if (priorityLower.includes('low')) {
    return 'success';
  }
  return 'default';
};

const getStatusIcon = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('done') || statusLower.includes('closed') || statusLower.includes('resolved')) {
    return <CheckCircle size={16} />;
  }
  if (statusLower.includes('progress') || statusLower.includes('development')) {
    return <Play size={16} />;
  }
  if (statusLower.includes('review') || statusLower.includes('testing')) {
    return <Pause size={16} />;
  }
  if (statusLower.includes('blocked') || statusLower.includes('rejected')) {
    return <AlertCircle size={16} />;
  }
  return <Clock size={16} />;
};

export const TaskDetails: React.FC<TaskDetailsProps> = ({ task, similarTasks = [], className }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Не указано';
    const hours = Math.round(seconds / 3600);
    return `${hours} ч`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  return (
    <TaskDetailsContainer className={className}>
      {/* Основная карточка задачи на полную ширину */}
      <Card>
        <CardContent>
          <TaskHeader>
            <div>
              <TaskKey>{task.jiraKey}</TaskKey>
              <TaskTitle>{task.title}</TaskTitle>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
              <Badge variant={getIssueTypeColor(task.issueType)} size="md">
                {task.issueType}
              </Badge>
              <Badge variant={getStatusColor(task.status)} size="md">
                {getStatusIcon(task.status)}
                <span style={{ marginLeft: '0.25rem' }}>{task.status}</span>
              </Badge>
              <Badge variant={getPriorityColor(task.priority)} size="sm">
                {task.priority}
              </Badge>
            </div>
          </TaskHeader>

          {task.description && (
            <TaskDescription>{task.description}</TaskDescription>
          )}

          <MetaGrid style={{ marginTop: '1.5rem' }}>
            <MetaItem>
              <MetaIcon>
                <User size={20} />
              </MetaIcon>
              <MetaContent>
                <MetaLabel>Исполнитель</MetaLabel>
                <MetaValue>{task.assignee}</MetaValue>
              </MetaContent>
            </MetaItem>

            <MetaItem>
              <MetaIcon>
                <User size={20} />
              </MetaIcon>
              <MetaContent>
                <MetaLabel>Создатель</MetaLabel>
                <MetaValue>{task.reporter}</MetaValue>
              </MetaContent>
            </MetaItem>

            <MetaItem>
              <MetaIcon>
                <Calendar size={20} />
              </MetaIcon>
              <MetaContent>
                <MetaLabel>Создана</MetaLabel>
                <MetaValue>{formatDate(task.created)}</MetaValue>
              </MetaContent>
            </MetaItem>

            {task.started && (
              <MetaItem>
                <MetaIcon>
                  <Play size={20} />
                </MetaIcon>
                <MetaContent>
                  <MetaLabel>Начата</MetaLabel>
                  <MetaValue>{formatDate(task.started)}</MetaValue>
                </MetaContent>
              </MetaItem>
            )}

            {task.completed && (
              <MetaItem>
                <MetaIcon>
                  <CheckCircle size={20} />
                </MetaIcon>
                <MetaContent>
                  <MetaLabel>Завершена</MetaLabel>
                  <MetaValue>{formatDate(task.completed)}</MetaValue>
                </MetaContent>
              </MetaItem>
            )}

            {task.timeSpent && (
              <MetaItem>
                <MetaIcon>
                  <Clock size={20} />
                </MetaIcon>
                <MetaContent>
                  <MetaLabel>Затрачено</MetaLabel>
                  <MetaValue>{formatDuration(task.timeSpent)}</MetaValue>
                </MetaContent>
              </MetaItem>
            )}

            {task.originalEstimate && (
              <MetaItem>
                <MetaIcon>
                  <Target size={20} />
                </MetaIcon>
                <MetaContent>
                  <MetaLabel>Оригинальная оценка</MetaLabel>
                  <MetaValue>{formatDuration(task.originalEstimate)}</MetaValue>
                </MetaContent>
              </MetaItem>
            )}
          </MetaGrid>

          {(task.labels.length > 0 || task.components.length > 0) && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--gray-900)' }}>
                Метки и компоненты
              </h3>
              <TagsContainer>
                {task.labels.map((label, index) => (
                  <Badge key={index} variant="default" size="sm">
                    <Tag size={12} style={{ marginRight: '0.25rem' }} />
                    {label}
                  </Badge>
                ))}
                {task.components.map((component, index) => (
                  <Badge key={index} variant="info" size="sm">
                    {component}
                  </Badge>
                ))}
              </TagsContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Боковая панель с оценкой ИИ и похожими задачами */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {task.aiEstimate && (
          <EstimationCard>
            <CardHeader>
              <EstimationHeader>
                <Brain size={20} color="var(--primary-600)" />
                <CardTitle>Оценка ИИ</CardTitle>
              </EstimationHeader>
            </CardHeader>
            <CardContent>
              <EstimationValue>{task.aiEstimate.estimate} ч</EstimationValue>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Уверенность</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-900)' }}>
                    {Math.round(task.aiEstimate.confidence * 100)}%
                  </span>
                </div>
                <ConfidenceBar>
                  <ConfidenceFill confidence={task.aiEstimate.confidence} />
                </ConfidenceBar>
              </div>

              <ReasoningText>{task.aiEstimate.reasoning}</ReasoningText>
            </CardContent>
          </EstimationCard>
        )}

        {similarTasks.length > 0 && (
          <Card>
            <CardHeader>
              <EstimationHeader>
                <TrendingUp size={20} color="var(--primary-600)" />
                <CardTitle>Похожие задачи</CardTitle>
              </EstimationHeader>
            </CardHeader>
            <CardContent>
              <SimilarTasksList>
                {similarTasks.map((similarTask, index) => (
                  <SimilarTaskItem key={index}>
                    <SimilarTaskInfo>
                      <SimilarTaskKey>{similarTask.jiraKey}</SimilarTaskKey>
                      <SimilarTaskTitle>{similarTask.title}</SimilarTaskTitle>
                    </SimilarTaskInfo>
                    <SimilarTaskDuration>
                      {similarTask.actualDuration ? `${Math.round(similarTask.actualDuration)} ч` : 'Не завершена'}
                    </SimilarTaskDuration>
                  </SimilarTaskItem>
                ))}
              </SimilarTasksList>
            </CardContent>
          </Card>
        )}
      </div>
    </TaskDetailsContainer>
  );
};
