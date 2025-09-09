import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Settings, History, BarChart3 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../components/ui';
import { TaskUrlForm } from '../components/task/TaskUrlForm';
import { TaskDetails } from '../components/task/TaskDetails';
import { EstimationProcess } from '../components/estimation/EstimationProcess';
import { EstimationResult } from '../components/estimation/EstimationResult';
import { HistoryModal } from '../components/estimation/HistoryModal';
import { SettingsModal } from '../components/settings/SettingsModal';
import { useAuth } from '../contexts/AuthContext';
import { Task, JiraIssueResponse, EstimationResponse } from '../types';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const Header = styled.header`
  background-color: var(--white);
  border-bottom: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
  padding: 1rem 0;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const LogoIcon = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--secondary-500) 100%);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--white);
  font-weight: 700;
  font-size: 1.25rem;
`;

const LogoText = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--gray-50);
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-200);
`;

const UserName = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-700);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const FixedBottomBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem 0;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--gray-200);
  box-shadow: var(--shadow-lg);
  z-index: 50;
`;

const BottomBarContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: flex-end;
`;

const EstimationButton = styled(Button)`
  padding: 0.75rem 2rem !important;
  font-size: 1.125rem !important;
  font-weight: 600 !important;
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  padding-bottom: 6rem; /* Отступ для фиксированного блока */
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

type AppState = 'url-form' | 'task-details' | 'estimation-process' | 'estimation-result';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [appState, setAppState] = useState<AppState>('url-form');
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [estimationResult, setEstimationResult] = useState<EstimationResponse | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleTaskLoaded = (response: JiraIssueResponse) => {
    console.log('📥 Получен ответ от Jira API:', {
      mainIssue: {
        key: response.mainIssue.jiraKey,
        type: response.mainIssue.issueType,
        title: response.mainIssue.title
      },
      subtasksCount: response.subtasks.length,
      subtasks: response.subtasks.map(task => ({
        key: task.jiraKey,
        type: task.issueType,
        title: task.title
      }))
    });
    
    setCurrentTask(response.mainIssue);
    setSubtasks(response.subtasks);
    setAppState('task-details');
  };

  const handleStartEstimation = () => {
    if (currentTask) {
      setAppState('estimation-process');
    }
  };

  const handleEstimationComplete = (result: EstimationResponse) => {
    setEstimationResult(result);
    setAppState('estimation-result');
  };

  const handleNewEstimation = () => {
    setAppState('url-form');
    setCurrentTask(null);
    setSubtasks([]);
    setEstimationResult(null);
  };

  const handleViewHistory = () => {
    setIsHistoryModalOpen(true);
  };

  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
  };

  const handleOpenSettings = () => {
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  const renderContent = () => {
    switch (appState) {
      case 'url-form':
        return (
          <TaskUrlForm
            onTaskLoaded={handleTaskLoaded}
          />
        );
      
      case 'task-details':
        return currentTask ? (
          <>
            <div className="space-y-4">
              <TaskDetails
                task={currentTask}
                similarTasks={[]}
              />
              {subtasks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Подзадачи ({subtasks.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {subtasks.map((subtask, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-semibold text-primary-600">{subtask.jiraKey}</span>
                            <p className="text-sm text-gray-600">{subtask.title}</p>
                          </div>
                          <span className="text-sm text-gray-500">{subtask.status}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            {/* Зафиксированная кнопка внизу экрана */}
            <FixedBottomBar>
              <BottomBarContent>
                <EstimationButton
                  size="lg"
                  onClick={handleStartEstimation}
                >
                  Получить оценку времени
                </EstimationButton>
              </BottomBarContent>
            </FixedBottomBar>
          </>
        ) : null;
      
      case 'estimation-process':
        return currentTask ? (
          <EstimationProcess
            task={currentTask}
            relatedTasks={subtasks}
            onEstimationComplete={handleEstimationComplete}
            onCancel={() => setAppState('task-details')}
          />
        ) : null;
      
      case 'estimation-result':
        return estimationResult ? (
          <EstimationResult
            result={estimationResult}
            onNewEstimation={handleNewEstimation}
            onViewHistory={handleViewHistory}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <DashboardContainer>
      <Header>
        <HeaderContent>
          <Logo>
            <LogoIcon>JE</LogoIcon>
            <LogoText>Jira Estimate</LogoText>
          </Logo>
          
          <UserSection>
            <UserInfo>
              <User size={16} color="var(--gray-500)" />
              <UserName>{user?.username}</UserName>
            </UserInfo>
            
            <ActionButtons>
              <Button variant="ghost" size="sm" onClick={handleOpenSettings}>
                <Settings size={16} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleViewHistory}>
                <History size={16} />
              </Button>
              <Button variant="ghost" size="sm">
                <BarChart3 size={16} />
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut size={16} />
              </Button>
            </ActionButtons>
          </UserSection>
        </HeaderContent>
      </Header>

      <MainContent>

        <ContentArea>
          <AnimatePresence mode="wait">
            <motion.div
              key={appState}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </ContentArea>
      </MainContent>

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={handleCloseHistoryModal}
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={handleCloseSettingsModal}
      />
    </DashboardContainer>
  );
};
