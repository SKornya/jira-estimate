import React from 'react';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const ButtonStyled = styled(motion.button)<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;

  ${({ fullWidth }) =>
    fullWidth &&
    css`
      width: 100%;
    `}

  ${({ size }) => {
    switch (size) {
      case 'sm':
        return css`
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
        `;
      case 'lg':
        return css`
          padding: 0.875rem 1.5rem;
          font-size: 1.125rem;
          line-height: 1.75rem;
        `;
      default:
        return css`
          padding: 0.625rem 1rem;
          font-size: 1rem;
          line-height: 1.5rem;
        `;
    }
  }}

  ${({ variant, disabled }) => {
    if (disabled) {
      return css`
        background-color: var(--gray-200);
        color: var(--gray-400);
        cursor: not-allowed;
        opacity: 0.6;
      `;
    }

    switch (variant) {
      case 'secondary':
        return css`
          background-color: var(--secondary-500);
          color: var(--white);
          &:hover {
            background-color: var(--secondary-600);
          }
          &:active {
            background-color: var(--secondary-700);
          }
        `;
      case 'success':
        return css`
          background-color: var(--success-500);
          color: var(--white);
          &:hover {
            background-color: var(--success-600);
          }
          &:active {
            background-color: var(--success-700);
          }
        `;
      case 'warning':
        return css`
          background-color: var(--warning-500);
          color: var(--white);
          &:hover {
            background-color: var(--warning-600);
          }
          &:active {
            background-color: var(--warning-700);
          }
        `;
      case 'error':
        return css`
          background-color: var(--error-500);
          color: var(--white);
          &:hover {
            background-color: var(--error-600);
          }
          &:active {
            background-color: var(--error-700);
          }
        `;
      case 'ghost':
        return css`
          background-color: transparent;
          color: var(--primary-600);
          border-color: var(--primary-200);
          &:hover {
            background-color: var(--primary-50);
            border-color: var(--primary-300);
          }
          &:active {
            background-color: var(--primary-100);
          }
        `;
      default:
        return css`
          background-color: var(--primary-500);
          color: var(--white);
          &:hover {
            background-color: var(--primary-600);
          }
          &:active {
            background-color: var(--primary-700);
          }
        `;
    }
  }}

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  }

  ${({ loading }) =>
    loading &&
    css`
      cursor: wait;
      pointer-events: none;
    `}
`;

const LoadingSpinner = styled.div`
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className,
}) => {
  return (
    <ButtonStyled
      variant={variant}
      size={size}
      disabled={disabled || loading}
      loading={loading}
      fullWidth={fullWidth}
      onClick={onClick}
      type={type}
      className={className}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {loading && <LoadingSpinner />}
      {children}
    </ButtonStyled>
  );
};
