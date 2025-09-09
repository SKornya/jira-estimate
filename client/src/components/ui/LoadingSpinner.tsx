import React from 'react';
import styled, { keyframes } from 'styled-components';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const SpinnerStyled = styled.div<{ size: string; color: string }>`
  border: 2px solid transparent;
  border-top: 2px solid ${({ color }) => color};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  
  ${({ size }) => {
    switch (size) {
      case 'sm':
        return `
          width: 1rem;
          height: 1rem;
          border-width: 1px;
        `;
      case 'lg':
        return `
          width: 3rem;
          height: 3rem;
          border-width: 3px;
        `;
      default:
        return `
          width: 2rem;
          height: 2rem;
          border-width: 2px;
        `;
    }
  }}
`;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'var(--primary-500)',
  className,
}) => {
  return (
    <SpinnerStyled
      size={size}
      color={color}
      className={className}
      role="status"
      aria-label="Загрузка"
    />
  );
};

// Компонент для центрированного спиннера
export const CenteredSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'lg',
  color = 'var(--primary-500)',
  className,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
      }}
      className={className}
    >
      <LoadingSpinner size={size} color={color} />
    </div>
  );
};

// Компонент для полноэкранного спиннера
export const FullScreenSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'lg',
  color = 'var(--primary-500)',
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 9999,
      }}
    >
      <LoadingSpinner size={size} color={color} />
    </div>
  );
};
