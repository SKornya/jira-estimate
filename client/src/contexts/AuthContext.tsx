import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginFormData, RegisterFormData, RegisterRequestData } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType extends AuthState {
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'AUTH_ERROR' };

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Проверка токена при загрузке приложения
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authAPI.verifyToken();
          if (response.valid) {
            dispatch({ type: 'SET_USER', payload: response.user });
          } else {
            dispatch({ type: 'AUTH_ERROR' });
          }
        } catch (error) {
          console.error('Ошибка проверки токена:', error);
          dispatch({ type: 'AUTH_ERROR' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (data: LoginFormData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.login(data);
      
      console.log('Login successful:', response);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
      
      // Принудительно обновляем состояние
      setTimeout(() => {
        dispatch({ type: 'SET_USER', payload: response.user });
        console.log('User state updated after login');
      }, 100);
    } catch (error: any) {
      console.error('Login error:', error);
      dispatch({ type: 'AUTH_ERROR' });
      throw error;
    }
  };

  const register = async (data: RegisterFormData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Убираем confirmPassword перед отправкой на сервер
      const { confirmPassword, ...registrationData } = data;
      const response = await authAPI.register(registrationData);
      
      console.log('Registration successful:', response);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
      
      // Принудительно обновляем состояние
      setTimeout(() => {
        dispatch({ type: 'SET_USER', payload: response.user });
        console.log('User state updated after registration');
      }, 100);
    } catch (error: any) {
      console.error('Registration error:', error);
      dispatch({ type: 'AUTH_ERROR' });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      dispatch({ type: 'SET_USER', payload: response.user });
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
      dispatch({ type: 'AUTH_ERROR' });
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};
