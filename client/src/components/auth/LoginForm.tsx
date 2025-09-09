import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import styled from 'styled-components';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Alert } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { LoginFormData } from '../../types';

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ButtonContainer = styled.div`
  margin-top: 1.5rem;
`;

const SwitchFormContainer = styled.div`
  margin-top: 1.5rem;
  text-align: center;
`;

const schema = yup.object({
  email: yup
    .string()
    .email('Введите корректный email')
    .required('Email обязателен'),
  password: yup
    .string()
    .min(6, 'Пароль должен содержать минимум 6 символов')
    .required('Пароль обязателен'),
});

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      await login(data);
      
      // Принудительное перенаправление после успешного входа
      console.log('Login completed, navigating to dashboard');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка входа в систему');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Вход в систему</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="error" title="Ошибка входа">
              {error}
            </Alert>
          )}
          
          <FormContainer onSubmit={handleSubmit(onSubmit)}>
            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="Введите ваш email"
              error={errors.email?.message}
              startIcon={<Mail size={20} />}
              fullWidth
            />

            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              label="Пароль"
              placeholder="Введите ваш пароль"
              error={errors.password?.message}
              startIcon={<Lock size={20} />}
              endIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--gray-400)', 
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--gray-600)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--gray-400)'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
              fullWidth
            />

            <ButtonContainer>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </Button>
            </ButtonContainer>
          </FormContainer>

          <SwitchFormContainer>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', margin: 0 }}>
              Нет аккаунта?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                style={{
                  color: 'var(--primary-600)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--primary-700)';
                  e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--primary-600)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Зарегистрироваться
              </button>
            </p>
          </SwitchFormContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};
