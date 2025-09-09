import React from 'react';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const AlertStyled = styled(motion.div)<{ variant: string }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid;
  margin-bottom: 1rem;

  ${({ variant }) => {
    switch (variant) {
      case 'success':
        return css`
          background-color: var(--success-50);
          border-color: var(--success-200);
          color: var(--success-800);
        `;
      case 'warning':
        return css`
          background-color: var(--warning-50);
          border-color: var(--warning-200);
          color: var(--warning-800);
        `;
      case 'error':
        return css`
          background-color: var(--error-50);
          border-color: var(--error-200);
          color: var(--error-800);
        `;
      default:
        return css`
          background-color: var(--primary-50);
          border-color: var(--primary-200);
          color: var(--primary-800);
        `;
    }
  }}
`;

const IconWrapper = styled.div<{ variant: string }>`
  flex-shrink: 0;
  margin-top: 0.125rem;

  ${({ variant }) => {
    switch (variant) {
      case 'success':
        return css`
          color: var(--success-600);
        `;
      case 'warning':
        return css`
          color: var(--warning-600);
        `;
      case 'error':
        return css`
          color: var(--error-600);
        `;
      default:
        return css`
          color: var(--primary-600);
        `;
    }
  }}
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
`;

const Message = styled.div`
  font-size: 0.875rem;
  line-height: 1.5;
`;

const DismissButton = styled.button`
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  color: inherit;
  opacity: 0.7;
  transition: opacity var(--transition-fast);

  &:hover {
    opacity: 1;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px currentColor;
  }
`;

const getIcon = (variant: string) => {
  switch (variant) {
    case 'success':
      return <CheckCircle size={20} />;
    case 'warning':
      return <AlertTriangle size={20} />;
    case 'error':
      return <AlertCircle size={20} />;
    default:
      return <Info size={20} />;
  }
};

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  className,
}) => {
  return (
    <AlertStyled
      variant={variant}
      className={className}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <IconWrapper variant={variant}>
        {getIcon(variant)}
      </IconWrapper>
      <Content>
        {title && <Title>{title}</Title>}
        <Message>{children}</Message>
      </Content>
      {dismissible && (
        <DismissButton onClick={onDismiss} aria-label="Закрыть">
          <X size={16} />
        </DismissButton>
      )}
    </AlertStyled>
  );
};
