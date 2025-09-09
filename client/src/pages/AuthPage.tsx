import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';

const AuthPageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Content = styled.div`
  width: 100%;
  max-width: 1200px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const LeftSide = styled.div`
  color: white;
  text-align: center;

  @media (max-width: 768px) {
    order: 2;
  }
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #fff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 2rem;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  max-width: 400px;
  margin: 0 auto;

  li {
    display: flex;
    align-items: center;
    margin-bottom: 0.75rem;
    font-size: 1rem;
    opacity: 0.9;

    &::before {
      content: '✓';
      color: #10b981;
      font-weight: bold;
      margin-right: 0.75rem;
      font-size: 1.25rem;
    }
  }
`;

const RightSide = styled.div`
  @media (max-width: 768px) {
    order: 1;
  }
`;

type AuthMode = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <AuthPageContainer>
      <Content>
        <LeftSide>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Title>Jira Estimate</Title>
            <Subtitle>
              Умная оценка времени выполнения задач с использованием ИИ
            </Subtitle>
            <FeaturesList>
              <li>Интеграция с Jira для автоматического получения задач</li>
              <li>ИИ-анализ для точной оценки времени</li>
              <li>Сравнение с похожими задачами</li>
              <li>История оценок и статистика</li>
              <li>Современный и удобный интерфейс</li>
            </FeaturesList>
          </motion.div>
        </LeftSide>

        <RightSide>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {mode === 'login' ? (
              <LoginForm onSwitchToRegister={() => setMode('register')} />
            ) : (
              <RegisterForm onSwitchToLogin={() => setMode('login')} />
            )}
          </motion.div>
        </RightSide>
      </Content>
    </AuthPageContainer>
  );
};
