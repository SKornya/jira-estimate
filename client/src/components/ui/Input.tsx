import React, { forwardRef } from 'react';
import styled, { css } from 'styled-components';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const InputContainer = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-700);
`;

const InputWrapper = styled.div<{ hasError?: boolean; hasStartIcon?: boolean; hasEndIcon?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;

  ${({ hasStartIcon }) =>
    hasStartIcon &&
    css`
      .input {
        padding-left: 2.5rem;
      }
    `}

  ${({ hasEndIcon }) =>
    hasEndIcon &&
    css`
      .input {
        padding-right: 2.5rem;
      }
    `}
`;

const InputStyled = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  line-height: 1.5rem;
  color: var(--gray-900);
  background-color: var(--white);
  border: 1px solid ${({ hasError }) => (hasError ? 'var(--error-300)' : 'var(--gray-300)')};
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  outline: none;

  &::placeholder {
    color: var(--gray-400);
  }

  &:focus {
    border-color: ${({ hasError }) => (hasError ? 'var(--error-500)' : 'var(--primary-500)')};
    box-shadow: 0 0 0 3px
      ${({ hasError }) => (hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(14, 165, 233, 0.1)')};
  }

  &:disabled {
    background-color: var(--gray-50);
    color: var(--gray-500);
    cursor: not-allowed;
    opacity: 0.6;
  }

  ${({ hasError }) =>
    hasError &&
    css`
      &:focus {
        border-color: var(--error-500);
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      }
    `}
`;

const IconWrapper = styled.div<{ position: 'start' | 'end' }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ position }) => (position === 'start' ? 'left: 0.75rem;' : 'right: 0.75rem;')}
  color: var(--gray-400);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

const ErrorText = styled.span`
  font-size: 0.875rem;
  color: var(--error-600);
  margin-top: 0.25rem;
`;

const HelperText = styled.span`
  font-size: 0.875rem;
  color: var(--gray-500);
  margin-top: 0.25rem;
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      startIcon,
      endIcon,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <InputContainer fullWidth={fullWidth} className={className}>
        {label && <Label>{label}</Label>}
        <InputWrapper
          hasError={!!error}
          hasStartIcon={!!startIcon}
          hasEndIcon={!!endIcon}
        >
          {startIcon && <IconWrapper position="start">{startIcon}</IconWrapper>}
          <InputStyled
            ref={ref}
            hasError={!!error}
            className="input"
            {...props}
          />
          {endIcon && <IconWrapper position="end">{endIcon}</IconWrapper>}
        </InputWrapper>
        {error && <ErrorText>{error}</ErrorText>}
        {helperText && !error && <HelperText>{helperText}</HelperText>}
      </InputContainer>
    );
  }
);

Input.displayName = 'Input';
