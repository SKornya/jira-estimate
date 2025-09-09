export interface User {
  id: string;
  username: string;
  email: string;
  jiraUsername: string;
  jiraBaseUrl?: string;
  jiraEmail?: string;
  jiraApiToken?: string;
  aiHost?: string;
  aiToken?: string;
  createdAt: string;
  lastLogin: string;
}

export interface Task {
  _id?: string;
  jiraKey: string;
  jiraId: string;
  title: string;
  description: string;
  issueType: 'Story' | 'Task' | 'Bug' | 'Epic' | 'Portfolio' | 'New Feature';
  status: string;
  priority: string;
  assignee: string;
  reporter: string;
  project: {
    key: string;
    name: string;
  };
  repository?: string;
  created: string;
  started?: string;
  completed?: string;
  parentKey?: string;
  subtasks?: string[];
  originalEstimate?: number;
  timeSpent?: number;
  aiEstimate?: {
    estimate: number;
    confidence: number;
    reasoning: string;
    similarTasks: string[];
    relatedTasks?: Task[]; // Добавляем связанные задачи для feature/story
    createdAt: string;
  };
  labels: string[];
  components: string[];
  fixVersions: string[];
  issueLinks: Array<{
    id: string;
    type: {
      id: string;
      name: string;
      inward: string;
      outward: string;
    };
    outwardIssue?: {
      key: string;
      fields: {
        summary: string;
        issuetype: {
          name: string;
        };
      };
    };
    inwardIssue?: {
      key: string;
      fields: {
        summary: string;
        issuetype: {
          name: string;
        };
      };
    };
  }>;
  lastSynced: string;
  syncStatus: 'synced' | 'pending' | 'error';
}

export interface EstimationRequest {
  taskData: Task;
  includeSimilarTasks?: boolean;
  relatedTasks?: Task[]; // Добавляем связанные задачи для feature/story
}

export interface EstimationResponse {
  estimation: {
    estimate: number;
    confidence: number;
    reasoning: string;
    similarTasksCount: number;
  };
  similarTasks: SimilarTask[];
  taskId: string;
  message: string;
}

export interface SimilarTask {
  jiraKey: string;
  title: string;
  issueType: string;
  actualDuration?: number;
  timeSpent?: number;
  status: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterRequestData {
  username: string;
  email: string;
  password: string;
}

export interface JiraIssueResponse {
  mainIssue: Task;
  subtasks: Task[];
  message: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface TasksResponse {
  tasks: Task[];
  pagination: PaginationInfo;
}

export interface EstimationHistoryItem {
  jiraKey: string;
  title: string;
  issueType: string;
  estimatedTime: number;
  confidence: number;
  reasoning: string;
  actualDuration?: number;
  timeSpent?: number;
  status: string;
  estimatedAt: string;
  created: string;
}

export interface EstimationHistoryResponse {
  tasks: EstimationHistoryItem[];
  pagination: PaginationInfo;
}

export interface EstimationStats {
  totalTasks: number;
  averageAccuracy: number;
  accuracyByType: Record<string, {
    count: number;
    totalAccuracy: number;
    averageAccuracy: number;
  }>;
  message: string;
}

export interface TaskStats {
  overview: {
    totalTasks: number;
    tasksWithEstimate: number;
    completedTasks: number;
    averageEstimate: number;
    averageActualTime: number;
  };
  byType: Array<{
    _id: string;
    count: number;
    averageEstimate: number;
    averageActualTime: number;
  }>;
  byStatus: Array<{
    _id: string;
    count: number;
  }>;
}

export interface JiraSettings {
  baseUrl: string;
  username: string;
  email: string;
  apiToken: string;
}

export interface AISettings {
  host: string;
  token: string;
}

export interface AppSettings {
  jira: JiraSettings;
  ai: AISettings;
}

export interface SettingsUpdateRequest {
  jira?: Partial<JiraSettings>;
  ai?: Partial<AISettings>;
}

export interface SettingsUpdateResponse {
  message: string;
  user: User;
}
