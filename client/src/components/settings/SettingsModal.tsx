import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, TestTube, CheckCircle, XCircle, Eye, EyeOff, Settings } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Alert } from '../ui';
import { settingsAPI } from '../../services/api';
import { AppSettings, JiraSettings, AISettings } from '../../types';

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
  max-width: 800px;
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


const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const FormRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const StyledCard = styled(Card)`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-700);
`;

const PasswordInputWrapper = styled.div`
  position: relative;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--gray-500);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: var(--gray-700);
  }
`;

const TestButton = styled(Button)`
  margin-top: 0.5rem;
`;

const ModalFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--gray-200);
`;

const StatusIcon = styled.div<{ status: 'success' | 'error' | 'loading' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${props => 
    props.status === 'success' ? 'var(--green-600)' :
    props.status === 'error' ? 'var(--red-600)' :
    'var(--gray-600)'
  };
`;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AppSettings>({
    jira: {
      baseUrl: '',
      username: '',
      email: '',
      apiToken: ''
    },
    ai: {
      host: '',
      token: ''
    }
  });

  const [showJiraToken, setShowJiraToken] = useState(false);
  const [showAIToken, setShowAIToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [jiraTestStatus, setJiraTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [aiTestStatus, setAiTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [jiraTestMessage, setJiraTestMessage] = useState('');
  const [aiTestMessage, setAiTestMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log('📥 Загрузка настроек...');
      const currentSettings = await settingsAPI.getSettings();
      console.log('📥 Загруженные настройки:', {
        jira: { ...currentSettings.jira, apiToken: currentSettings.jira.apiToken ? '***' + currentSettings.jira.apiToken.slice(-4) : undefined },
        ai: { ...currentSettings.ai, token: currentSettings.ai.token ? '***' + currentSettings.ai.token.slice(-4) : undefined }
      });
      setSettings(currentSettings);
    } catch (err: any) {
      setError('Не удалось загрузить настройки');
      console.error('Ошибка загрузки настроек:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJiraChange = (field: keyof JiraSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      jira: {
        ...prev.jira,
        [field]: value
      }
    }));
  };

  const handleAIChange = (field: keyof AISettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      ai: {
        ...prev.ai,
        [field]: value
      }
    }));
  };

  const testJiraConnection = async () => {
    setJiraTestStatus('loading');
    setJiraTestMessage('');
    
    try {
      const result = await settingsAPI.testJiraConnection({
        baseUrl: settings.jira.baseUrl,
        email: settings.jira.email,
        apiToken: settings.jira.apiToken
      });
      
      setJiraTestStatus(result.connected ? 'success' : 'error');
      setJiraTestMessage(result.message);
    } catch (err: any) {
      setJiraTestStatus('error');
      setJiraTestMessage('Ошибка тестирования подключения');
      console.error('Ошибка тестирования Jira:', err);
    }
  };

  const testAIConnection = async () => {
    setAiTestStatus('loading');
    setAiTestMessage('');
    
    try {
      const result = await settingsAPI.testAIConnection({
        host: settings.ai.host,
        token: settings.ai.token
      });
      
      setAiTestStatus(result.connected ? 'success' : 'error');
      setAiTestMessage(result.message);
    } catch (err: any) {
      setAiTestStatus('error');
      setAiTestMessage('Ошибка тестирования подключения');
      console.error('Ошибка тестирования AI:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    
    console.log('💾 Сохранение настроек:', {
      jira: { ...settings.jira, apiToken: settings.jira.apiToken ? '***' + settings.jira.apiToken.slice(-4) : undefined },
      ai: { ...settings.ai, token: settings.ai.token ? '***' + settings.ai.token.slice(-4) : undefined }
    });
    
    try {
      await settingsAPI.updateSettings({
        jira: settings.jira,
        ai: settings.ai
      });
      
      console.log('✅ Настройки успешно сохранены');
      onClose();
    } catch (err: any) {
      setError('Не удалось сохранить настройки');
      console.error('Ошибка сохранения настроек:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setError('');
    setJiraTestStatus('idle');
    setAiTestStatus('idle');
    setJiraTestMessage('');
    setAiTestMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <ModalOverlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <ModalContent
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <ModalHeader>
            <ModalTitle>
              <Settings size={24} />
              Настройки приложения
            </ModalTitle>
            <CloseButton variant="ghost" onClick={handleClose}>
              <X size={20} />
            </CloseButton>
          </ModalHeader>

          <ModalBody>
            {error && (
              <div style={{ marginBottom: '1rem' }}>
                <Alert variant="error">
                  {error}
                </Alert>
              </div>
            )}

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                Загрузка настроек...
              </div>
            ) : (
              <>
                {/* Настройки Jira */}
                <StyledCard>
                  <CardHeader>
                    <CardTitle>Настройки Jira</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormGrid>
                      <FormRow>
                        <Label>URL Jira</Label>
                        <Input
                          type="url"
                          value={settings.jira.baseUrl}
                          onChange={(e) => handleJiraChange('baseUrl', e.target.value)}
                          placeholder="https://your-domain.atlassian.net"
                        />
                      </FormRow>
                      
                      <FormRow>
                        <Label>Имя пользователя</Label>
                        <Input
                          type="text"
                          value={settings.jira.username}
                          onChange={(e) => handleJiraChange('username', e.target.value)}
                          placeholder="username"
                        />
                      </FormRow>
                      
                      <FormRow>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={settings.jira.email}
                          onChange={(e) => handleJiraChange('email', e.target.value)}
                          placeholder="user@example.com"
                        />
                      </FormRow>
                      
                      <FormRow>
                        <Label>API Token</Label>
                        <PasswordInputWrapper>
                          <Input
                            type={showJiraToken ? 'text' : 'password'}
                            value={settings.jira.apiToken}
                            onChange={(e) => handleJiraChange('apiToken', e.target.value)}
                            placeholder="Введите API токен"
                          />
                          <PasswordToggle onClick={() => setShowJiraToken(!showJiraToken)}>
                            {showJiraToken ? <EyeOff size={16} /> : <Eye size={16} />}
                          </PasswordToggle>
                        </PasswordInputWrapper>
                      </FormRow>
                    </FormGrid>
                    
                    <div style={{ marginTop: '1rem' }}>
                      <TestButton
                        variant="ghost"
                        size="sm"
                        onClick={testJiraConnection}
                        disabled={jiraTestStatus === 'loading'}
                      >
                        <TestTube size={16} />
                        {jiraTestStatus === 'loading' ? 'Тестирование...' : 'Тестировать подключение'}
                      </TestButton>
                    </div>
                    
                    {jiraTestStatus !== 'idle' && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <StatusIcon status={jiraTestStatus === 'success' ? 'success' : 'error'}>
                          {jiraTestStatus === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                          {jiraTestMessage}
                        </StatusIcon>
                      </div>
                    )}
                  </CardContent>
                </StyledCard>

                {/* Настройки AI */}
                <StyledCard>
                  <CardHeader>
                    <CardTitle>Настройки AI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormGrid>
                      <FormRow>
                        <Label>Хост AI сервиса</Label>
                        <Input
                          type="url"
                          value={settings.ai.host}
                          onChange={(e) => handleAIChange('host', e.target.value)}
                          placeholder="https://api.openai.com"
                        />
                      </FormRow>
                      
                      <FormRow>
                        <Label>API Token</Label>
                        <PasswordInputWrapper>
                          <Input
                            type={showAIToken ? 'text' : 'password'}
                            value={settings.ai.token}
                            onChange={(e) => handleAIChange('token', e.target.value)}
                            placeholder="Введите API токен"
                          />
                          <PasswordToggle onClick={() => setShowAIToken(!showAIToken)}>
                            {showAIToken ? <EyeOff size={16} /> : <Eye size={16} />}
                          </PasswordToggle>
                        </PasswordInputWrapper>
                      </FormRow>
                    </FormGrid>
                    
                    <div style={{ marginTop: '1rem' }}>
                      <TestButton
                        variant="ghost"
                        size="sm"
                        onClick={testAIConnection}
                        disabled={aiTestStatus === 'loading'}
                      >
                        <TestTube size={16} />
                        {aiTestStatus === 'loading' ? 'Тестирование...' : 'Тестировать подключение'}
                      </TestButton>
                    </div>
                    
                    {aiTestStatus !== 'idle' && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <StatusIcon status={aiTestStatus === 'success' ? 'success' : 'error'}>
                          {aiTestStatus === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                          {aiTestMessage}
                        </StatusIcon>
                      </div>
                    )}
                  </CardContent>
                </StyledCard>
              </>
            )}

            <ModalFooter>
              <Button variant="ghost" onClick={handleClose}>
                Отмена
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || isLoading}
              >
                <Save size={16} />
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </ModalFooter>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </AnimatePresence>
  );
};
