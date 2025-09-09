import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Tag, AlertCircle, CheckCircle, Play, Pause } from 'lucide-react';
import { Card, CardContent, Badge } from '../ui';
import { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  className?: string;
}

const TaskCardContainer = styled(Card)<{ statusColor: string }>`
  cursor: pointer;
  transition: all var(--transition-normal);
  border-left: 4px solid var(--${props => props.statusColor}-500);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }
`;

const TaskHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const TaskKey = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--primary-600);
  margin: 0;
  margin-bottom: 0.25rem;
`;

const TaskTitle = styled.h4`
  font-size: 1rem;
  font-weight: 500;
  color: var(--gray-900);
  margin: 0;
  line-height: 1.4;
`;

const TaskMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--gray-600);
`;

const MetaIcon = styled.div`
  color: var(--gray-400);
  display: flex;
  align-items: center;
`;

const TaskDescription = styled.p`
  font-size: 0.875rem;
  color: var(--gray-700);
  line-height: 1.5;
  margin: 0.75rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
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

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, className }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Не указано';
    const hours = Math.round(seconds / 3600);
    return `${hours} ч`;
  };

  return (
    <TaskCardContainer
      onClick={onClick}
      className={className}
      hover
      statusColor={getStatusColor(task.status)}
    >
      <CardContent>
        <TaskHeader>
          <div>
            <TaskKey>{task.jiraKey}</TaskKey>
            <TaskTitle>{task.title}</TaskTitle>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
            <Badge variant={getIssueTypeColor(task.issueType)} size="sm">
              {task.issueType}
            </Badge>
            <Badge variant={getStatusColor(task.status)} size="sm">
              {getStatusIcon(task.status)}
              <span style={{ marginLeft: '0.25rem' }}>{task.status}</span>
            </Badge>
          </div>
        </TaskHeader>

        {task.description && (
          <TaskDescription>{task.description}</TaskDescription>
        )}

        <TaskMeta>
          <MetaRow>
            <MetaIcon>
              <User size={16} />
            </MetaIcon>
            <span>Исполнитель: {task.assignee}</span>
          </MetaRow>

          <MetaRow>
            <MetaIcon>
              <Calendar size={16} />
            </MetaIcon>
            <span>Создана: {formatDate(task.created)}</span>
          </MetaRow>

          {task.timeSpent && (
            <MetaRow>
              <MetaIcon>
                <Clock size={16} />
              </MetaIcon>
              <span>Затрачено: {formatDuration(task.timeSpent)}</span>
            </MetaRow>
          )}

          {task.aiEstimate && (
            <MetaRow>
              <MetaIcon>
                <Clock size={16} />
              </MetaIcon>
              <span>Оценка ИИ: {task.aiEstimate.estimate} ч (уверенность: {Math.round(task.aiEstimate.confidence * 100)}%)</span>
            </MetaRow>
          )}
        </TaskMeta>

        {(task.labels.length > 0 || task.components.length > 0) && (
          <TagsContainer>
            {task.labels.slice(0, 3).map((label, index) => (
              <Badge key={index} variant="default" size="sm">
                <Tag size={12} style={{ marginRight: '0.25rem' }} />
                {label}
              </Badge>
            ))}
            {task.components.slice(0, 2).map((component, index) => (
              <Badge key={index} variant="info" size="sm">
                {component}
              </Badge>
            ))}
          </TagsContainer>
        )}
      </CardContent>
    </TaskCardContainer>
  );
};
