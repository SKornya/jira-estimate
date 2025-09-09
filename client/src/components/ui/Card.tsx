import React from 'react';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

const CardStyled = styled(motion.div)<CardProps>`
  background-color: var(--white);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);

  ${({ variant }) => {
    switch (variant) {
      case 'elevated':
        return css`
          box-shadow: var(--shadow-lg);
          border: none;
        `;
      case 'outlined':
        return css`
          border: 1px solid var(--gray-200);
          box-shadow: none;
        `;
      default:
        return css`
          box-shadow: var(--shadow);
          border: 1px solid var(--gray-100);
        `;
    }
  }}

  ${({ padding }) => {
    switch (padding) {
      case 'none':
        return css`
          padding: 0;
        `;
      case 'sm':
        return css`
          padding: 1rem;
        `;
      case 'lg':
        return css`
          padding: 2rem;
        `;
      default:
        return css`
          padding: 1.5rem;
        `;
    }
  }}

  ${({ hover, onClick }) =>
    (hover || onClick) &&
    css`
      cursor: pointer;
      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-xl);
      }
    `}
`;

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className,
  onClick,
}) => {
  return (
    <CardStyled
      variant={variant}
      padding={padding}
      hover={hover}
      className={className}
      onClick={onClick}
      whileHover={hover || onClick ? { y: -2 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {children}
    </CardStyled>
  );
};

// Компоненты для структуры карточки
export const CardHeader = styled.div`
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--gray-100);
  margin-bottom: 1rem;
`;

export const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
`;

export const CardDescription = styled.p`
  font-size: 0.875rem;
  color: var(--gray-600);
  margin: 0.5rem 0 0 0;
`;

export const CardContent = styled.div`
  flex: 1;
`;

export const CardFooter = styled.div`
  padding-top: 1rem;
  border-top: 1px solid var(--gray-100);
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;
