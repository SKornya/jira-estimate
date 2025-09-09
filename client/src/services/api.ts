import axios, { AxiosResponse } from 'axios';
import {
  User,
  LoginFormData,
  RegisterRequestData,
  JiraIssueResponse,
  EstimationRequest,
  EstimationResponse,
  TasksResponse,
  EstimationHistoryResponse,
  EstimationStats,
  TaskStats,
  AppSettings,
  SettingsUpdateRequest,
  SettingsUpdateResponse
} from '../types';
import { hashPassword } from '../utils/passwordHash';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Создание экземпляра axios с базовой конфигурацией
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API методы для аутентификации
export const authAPI = {
  login: async (data: LoginFormData): Promise<{ token: string; user: User }> => {
    // Для логина не хешируем пароль, так как сервер должен проверить его с сохраненной солью
    const response: AxiosResponse<{ token: string; user: User }> = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequestData): Promise<{ token: string; user: User }> => {
    // Хешируем пароль перед отправкой
    const hashedData = {
      ...data,
      password: hashPassword(data.password)
    };
    const response: AxiosResponse<{ token: string; user: User }> = await api.post('/auth/register', hashedData);
    return response.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const response: AxiosResponse<{ user: User }> = await api.get('/auth/me');
    return response.data;
  },

  verifyToken: async (): Promise<{ valid: boolean; user: User }> => {
    const response: AxiosResponse<{ valid: boolean; user: User }> = await api.get('/auth/verify');
    return response.data;
  },
};

// API методы для работы с Jira
export const jiraAPI = {
  fetchIssue: async (issueUrl: string): Promise<JiraIssueResponse> => {
    const response: AxiosResponse<JiraIssueResponse> = await api.post('/jira/fetch-issue', { issueUrl });
    return response.data;
  },

  syncUserTasks: async (maxResults?: number): Promise<{ syncedCount: number; errorCount: number; errors?: any[] }> => {
    const response: AxiosResponse<{ syncedCount: number; errorCount: number; errors?: any[] }> = 
      await api.post('/jira/sync-user-tasks', { maxResults });
    return response.data;
  },

  testConnection: async (): Promise<{ connected: boolean; message: string }> => {
    const response: AxiosResponse<{ connected: boolean; message: string }> = await api.get('/jira/test-connection');
    return response.data;
  },
};

// API методы для оценки времени
export const estimationAPI = {
  estimate: async (data: EstimationRequest): Promise<EstimationResponse> => {
    const response: AxiosResponse<EstimationResponse> = await api.post('/estimation/estimate', data);
    return response.data;
  },

  getHistory: async (limit?: number, page?: number): Promise<EstimationHistoryResponse> => {
    const response: AxiosResponse<EstimationHistoryResponse> = await api.get('/estimation/history', {
      params: { limit, page }
    });
    return response.data;
  },

  getStats: async (): Promise<EstimationStats> => {
    const response: AxiosResponse<EstimationStats> = await api.get('/estimation/stats');
    return response.data;
  },
};

// API методы для работы с задачами
export const tasksAPI = {
  getTasks: async (params?: {
    limit?: number;
    page?: number;
    issueType?: string;
    status?: string;
    hasEstimate?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<TasksResponse> => {
    const response: AxiosResponse<TasksResponse> = await api.get('/tasks', { params });
    return response.data;
  },

  getTask: async (jiraKey: string): Promise<{ task: any }> => {
    const response: AxiosResponse<{ task: any }> = await api.get(`/tasks/${jiraKey}`);
    return response.data;
  },

  getSimilarTasks: async (jiraKey: string, limit?: number): Promise<{ similarTasks: any[] }> => {
    const response: AxiosResponse<{ similarTasks: any[] }> = await api.get(`/tasks/${jiraKey}/similar`, {
      params: { limit }
    });
    return response.data;
  },

  updateTask: async (jiraKey: string, data: any): Promise<{ task: any; message: string }> => {
    const response: AxiosResponse<{ task: any; message: string }> = await api.put(`/tasks/${jiraKey}`, data);
    return response.data;
  },

  deleteTask: async (jiraKey: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.delete(`/tasks/${jiraKey}`);
    return response.data;
  },

  getStats: async (): Promise<TaskStats> => {
    const response: AxiosResponse<TaskStats> = await api.get('/tasks/stats/overview');
    return response.data;
  },
};

// API методы для настроек
export const settingsAPI = {
  getSettings: async (): Promise<AppSettings> => {
    const response: AxiosResponse<AppSettings> = await api.get('/settings');
    return response.data;
  },

  updateSettings: async (data: SettingsUpdateRequest): Promise<SettingsUpdateResponse> => {
    const response: AxiosResponse<SettingsUpdateResponse> = await api.put('/settings', data);
    return response.data;
  },

  testJiraConnection: async (settings: { baseUrl: string; email: string; apiToken: string }): Promise<{ connected: boolean; message: string }> => {
    const response: AxiosResponse<{ connected: boolean; message: string }> = await api.post('/settings/test-jira', settings);
    return response.data;
  },

  testAIConnection: async (settings: { host: string; token: string }): Promise<{ connected: boolean; message: string }> => {
    const response: AxiosResponse<{ connected: boolean; message: string }> = await api.post('/settings/test-ai', settings);
    return response.data;
  },
};

// Общие API методы
export const commonAPI = {
  healthCheck: async (): Promise<{ status: string; message: string }> => {
    const response: AxiosResponse<{ status: string; message: string }> = await api.get('/health');
    return response.data;
  },
};

export default api;
