import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, TrendingUp, User, AlertCircle } from 'lucide-react';
import { Button, Card, CardContent } from '../ui';
import { estimationAPI } from '../../services/api';
import { EstimationHistoryItem, PaginationInfo } from '../../types';

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled(motion.div)`
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--secondary-50) 100%);
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled(Button)`
  padding: 0.5rem;
  min-width: auto;
  width: 2.5rem;
  height: 2.5rem;
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const HistoryItem = styled(Card)`
  transition: all 0.2s ease;
  border: 1px solid var(--gray-200);
  
  &:hover {
    border-color: var(--primary-300);
    box-shadow: var(--shadow-md);
  }
`;

const HistoryItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const TaskInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TaskKey = styled.span`
  font-weight: 700;
  color: var(--primary-600);
  font-size: 1rem;
`;

const TaskTitle = styled.p`
  color: var(--gray-700);
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
`;

const TaskMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--gray-500);
`;

const EstimationDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
  margin-top: 1rem;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: var(--gray-50);
  border-radius: var(--radius-sm);
`;

const DetailLabel = styled.span`
  font-size: 0.75rem;
  color: var(--gray-600);
  font-weight: 500;
`;

const DetailValue = styled.span`
  font-size: 0.875rem;
  color: var(--gray-900);
  font-weight: 600;
`;

const ConfidenceBadge = styled.span<{ confidence: number }>`
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  background-color: ${props => {
    if (props.confidence >= 80) return 'var(--green-100)';
    if (props.confidence >= 60) return 'var(--yellow-100)';
    return 'var(--red-100)';
  }};
  color: ${props => {
    if (props.confidence >= 80) return 'var(--green-700)';
    if (props.confidence >= 60) return 'var(--yellow-700)';
    return 'var(--red-700)';
  }};
`;

const ReasoningText = styled.p`
  color: var(--gray-600);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 1rem 0 0 0;
  padding: 1rem;
  background-color: var(--gray-50);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--primary-300);
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 3rem;
  color: var(--gray-500);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 3rem;
  text-align: center;
  color: var(--gray-500);
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 3rem;
  text-align: center;
  color: var(--red-600);
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--gray-200);
`;

const PageInfo = styled.span`
  font-size: 0.875rem;
  color: var(--gray-600);
`;

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const [historyItems, setHistoryItems] = useState<EstimationHistoryItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadHistory = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Загрузка истории оценок, страница:', page);
      const response = await estimationAPI.getHistory(10, page);
      console.log('📊 Ответ API истории оценок:', response);
      console.log('📋 Количество задач в ответе:', response.tasks?.length || 0);
      setHistoryItems(response.tasks);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('❌ Ошибка загрузки истории оценок:', err);
      console.error('❌ Детали ошибки:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Ошибка при загрузке истории оценок';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory(1);
    }
  }, [isOpen]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && pagination && newPage <= pagination.pages) {
      loadHistory(newPage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} мин`;
    } else if (hours < 24) {
      return `${Math.round(hours)} ч`;
    } else {
      const days = Math.floor(hours / 8);
      const remainingHours = Math.round(hours % 8);
      return `${days} дн ${remainingHours > 0 ? `${remainingHours} ч` : ''}`;
    }
  };

  const renderHistoryItem = (item: EstimationHistoryItem) => (
    <HistoryItem key={`${item.jiraKey}-${item.estimatedAt}`}>
      <CardContent>
        <HistoryItemHeader>
          <TaskInfo>
            <TaskKey>{item.jiraKey}</TaskKey>
            <TaskTitle>{item.title}</TaskTitle>
            <TaskMeta>
              <span>{item.issueType}</span>
              <span>•</span>
              <span>{item.status}</span>
              <span>•</span>
              <span>{formatDate(item.estimatedAt)}</span>
            </TaskMeta>
          </TaskInfo>
          <ConfidenceBadge confidence={item.confidence * 100}>
            {Math.round(item.confidence * 100)}% уверенность
          </ConfidenceBadge>
        </HistoryItemHeader>

        <EstimationDetails>
          <DetailItem>
            <Clock size={16} color="var(--gray-500)" />
            <div>
              <DetailLabel>Оценка </DetailLabel>
              <DetailValue>{formatDuration(item.estimatedTime)}</DetailValue>
            </div>
          </DetailItem>

          {item.actualDuration && (
            <DetailItem>
              <TrendingUp size={16} color="var(--gray-500)" />
              <div>
                <DetailLabel>Фактическое время</DetailLabel>
                <DetailValue>{formatDuration(item.actualDuration)}</DetailValue>
              </div>
            </DetailItem>
          )}

          {item.timeSpent && (
            <DetailItem>
              <User size={16} color="var(--gray-500)" />
              <div>
                <DetailLabel>Затрачено времени</DetailLabel>
                <DetailValue>{formatDuration(item.timeSpent)}</DetailValue>
              </div>
            </DetailItem>
          )}
        </EstimationDetails>

        {item.reasoning && (
          <ReasoningText>{item.reasoning}</ReasoningText>
        )}
      </CardContent>
    </HistoryItem>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <LoadingState>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p style={{ marginTop: '1rem' }}>Загрузка истории оценок...</p>
        </LoadingState>
      );
    }

    if (error) {
      return (
        <ErrorState>
          <AlertCircle size={48} />
          <p style={{ marginTop: '1rem' }}>{error}</p>
          <Button 
            variant="ghost" 
            onClick={() => loadHistory(currentPage)}
            className="mt-4"
          >
            Попробовать снова
          </Button>
        </ErrorState>
      );
    }

    if (historyItems.length === 0) {
      return (
        <EmptyState>
          <Clock size={48} />
          <p style={{ marginTop: '1rem' }}>История оценок пуста</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Здесь будут отображаться все ваши оценки времени
          </p>
        </EmptyState>
      );
    }

    return (
      <>
        <HistoryList>
          {historyItems.map(renderHistoryItem)}
        </HistoryList>

        {pagination && pagination.pages > 1 && (
          <PaginationControls>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Назад
            </Button>
            
            <PageInfo>
              Страница {currentPage} из {pagination.pages}
            </PageInfo>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.pages}
            >
              Вперед
            </Button>
          </PaginationControls>
        )}
      </>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <ModalContent
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitle>
                <Clock size={24} />
                История оценок
              </ModalTitle>
              <CloseButton variant="ghost" onClick={onClose}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              {renderContent()}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};
