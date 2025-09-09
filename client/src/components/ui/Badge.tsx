import React from 'react';
import styled, { css } from 'styled-components';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BadgeStyled = styled.span<{ variant: string; size: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border-radius: var(--radius-full);
  white-space: nowrap;

  ${({ size }) => {
    switch (size) {
      case 'sm':
        return css`
          padding: 0.125rem 0.5rem;
          font-size: 0.75rem;
          line-height: 1rem;
        `;
      case 'lg':
        return css`
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
        `;
      default:
        return css`
          padding: 0.25rem 0.625rem;
          font-size: 0.75rem;
          line-height: 1rem;
        `;
    }
  }}

  ${({ variant }) => {
    switch (variant) {
      case 'primary':
        return css`
          background-color: var(--primary-100);
          color: var(--primary-800);
        `;
      case 'secondary':
        return css`
          background-color: var(--secondary-100);
          color: var(--secondary-800);
        `;
      case 'success':
        return css`
          background-color: var(--success-100);
          color: var(--success-800);
        `;
      case 'warning':
        return css`
          background-color: var(--warning-100);
          color: var(--warning-800);
        `;
      case 'error':
        return css`
          background-color: var(--error-100);
          color: var(--error-800);
        `;
      case 'info':
        return css`
          background-color: var(--primary-100);
          color: var(--primary-800);
        `;
      default:
        return css`
          background-color: var(--gray-100);
          color: var(--gray-800);
        `;
    }
  }}
`;

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
}) => {
  return (
    <BadgeStyled variant={variant} size={size} className={className}>
      {children}
    </BadgeStyled>
  );
};
