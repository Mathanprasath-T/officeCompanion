import {

  User,

  Task,

  WorkSession,

  FollowUp,

  Activity,

  NotificationItem,

  TaskCounts,

  PriorityRecommendation,

  CommitmentDetectionResult,

  DailyPlanResponse,

  Meeting,

  ProductivitySummary,

  WorkloadDay,

  TimeDistribution,

  ProductivityPatterns,

  WeeklyInsights,

} from '../types';



const RAW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';

// Accept either a backend origin (https://example.onrender.com) or a base URL
// already ending in /api. This ensures every API request includes exactly one /api.
const API_BASE_URL = `${RAW_API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/i, '')}/api`;



class ApiClient {

  private getToken(): string | null {

    return localStorage.getItem('token');

  }



  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {

    const token = this.getToken();

    const headers: HeadersInit = {

      'Content-Type': 'application/json',

      ...(token ? { Authorization: `Bearer ${token}` } : {}),

      ...options.headers,

    };



    try {

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {

        ...options,

        headers,

      });



      const data = await response.json().catch(() => ({}));



      if (!response.ok) {

        if (response.status === 401) {

          // Token expired or invalid

          localStorage.removeItem('token');

          localStorage.removeItem('user');

          if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {

            window.location.href = '/login';

          }

        }

        throw new Error(data.message || `Request failed with status ${response.status}`);

      }



      return data as T;

    } catch (error: any) {

      if (error.name === 'TypeError' && error.message.includes('fetch')) {

        throw new Error('Unable to connect to the server. Please check your backend connection.');

      }

      throw error;

    }

  }



  // Auth APIs

  auth = {

    login: (credentials: { email: string; password: string }) =>

      this.request<{ success: boolean; token: string; user: User; message: string }>('/auth/login', {

        method: 'POST',

        body: JSON.stringify(credentials),

      }),

    googleLogin: (payload: {

      credential?: string;

      accessToken?: string;

      profile?: any;

      email?: string;

      name?: string;

      googleId?: string;

      picture?: string;

    }) =>

      this.request<{ success: boolean; token: string; user: User; isNewUser?: boolean; message: string }>('/auth/google', {

        method: 'POST',

        body: JSON.stringify(payload),

      }),

    register: (data: {

      name: string;

      email: string;

      password: string;

      confirmPassword?: string;

      department?: string;

      role?: string;

    }) =>

      this.request<{ success: boolean; token: string; user: User; message: string }>('/auth/register', {

        method: 'POST',

        body: JSON.stringify(data),

      }),

    getMe: () => this.request<{ success: boolean; user: User }>('/auth/me'),

    changePassword: (payload: { currentPassword: string; newPassword: string; confirmPassword: string }) =>

      this.request<{ success: boolean; message: string }>('/auth/change-password', {

        method: 'POST',

        body: JSON.stringify(payload),

      }),

  };



  // Task APIs

  tasks = {

    getAll: (params?: { filter?: string; search?: string; importance?: string; priority?: string }) => {

      const query = new URLSearchParams(params as any).toString();

      return this.request<{ success: boolean; data: Task[]; counts: TaskCounts }>(`/tasks${query ? `?${query}` : ''}`);

    },

    getById: (id: string) =>

      this.request<{ success: boolean; data: { task: Task; latestSession: WorkSession | null; activities: Activity[] } }>(

        `/tasks/${id}`

      ),

    create: (data: Partial<Task>) =>

      this.request<{ success: boolean; message: string; data: Task }>('/tasks', {

        method: 'POST',

        body: JSON.stringify(data),

      }),

    update: (id: string, data: Partial<Task>) =>

      this.request<{ success: boolean; message: string; data: Task }>(`/tasks/${id}`, {

        method: 'PATCH',

        body: JSON.stringify(data),

      }),

    complete: (id: string) =>

      this.request<{ success: boolean; message: string; data: Task }>(`/tasks/${id}/complete`, {

        method: 'POST',

      }),

    delete: (id: string) =>

      this.request<{ success: boolean; message: string }>(`/tasks/${id}`, {

        method: 'DELETE',

      }),

    exportCsv: async () => {

      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/tasks/export/csv`, {

        headers: {

          ...(token ? { Authorization: `Bearer ${token}` } : {}),

        },

      });

      if (!response.ok) {

        throw new Error('Failed to export CSV from server');

      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = url;

      link.download = `OfficeCompanion_AI_Predicted_Tasks\_${new Date().toISOString().slice(0, 10)}.csv`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);

    },

  };



  // AI APIs

  ai = {

    getRecommendation: () =>

      this.request<{ success: boolean; data: PriorityRecommendation | null; message?: string }>('/ai/recommendation'),

    prioritize: () =>

      this.request<{ success: boolean; message: string; data: any[] }>('/ai/priority', {

        method: 'POST',

      }),

    detectCommitment: (text: string) =>

      this.request<{ success: boolean; data: CommitmentDetectionResult | null; message?: string }>('/ai/commitments', {

        method: 'POST',

        body: JSON.stringify({ text }),

      }),

  };



  // Context & Work Session APIs

  context = {

    getRecent: () => this.request<{ success: boolean; data: WorkSession[] }>('/context/recent'),

    start: (taskId: string) =>

      this.request<{ success: boolean; message: string; data: WorkSession }>('/context/start', {

        method: 'POST',

        body: JSON.stringify({ taskId }),

      }),

    update: (id: string, data: Partial<WorkSession>) =>

      this.request<{ success: boolean; message: string; data: WorkSession }>(`/context/${id}`, {

        method: 'PATCH',

        body: JSON.stringify(data),

      }),

    resume: (id: string) =>

      this.request<{ success: boolean; message: string; data: WorkSession }>(`/context/${id}/resume`, {

        method: 'POST',

      }),

  };



  // Follow-up APIs

  followups = {

    getAll: (params?: { status?: string }) => {

      const query = new URLSearchParams(params as any).toString();

      return this.request<{ success: boolean; data: FollowUp[]; counts: Record<string, number> }>(

        `/followups${query ? `?${query}` : ''}`

      );

    },

    create: (data: Partial<FollowUp>) =>

      this.request<{ success: boolean; message: string; data: FollowUp }>('/followups', {

        method: 'POST',

        body: JSON.stringify(data),

      }),

    update: (id: string, data: Partial<FollowUp>) =>

      this.request<{ success: boolean; message: string; data: FollowUp }>(`/followups/${id}`, {

        method: 'PATCH',

        body: JSON.stringify(data),

      }),

    complete: (id: string) =>

      this.request<{ success: boolean; message: string; data: FollowUp }>(`/followups/${id}/complete`, {

        method: 'POST',

      }),

    delete: (id: string) =>

      this.request<{ success: boolean; message: string }>(`/followups/${id}`, {

        method: 'DELETE',

      }),

  };



  // Daily Planner APIs

  planner = {

    getToday: () =>

      this.request<{ success: boolean; data: DailyPlanResponse }>('/planner/today'),

    generate: () =>

      this.request<{ success: boolean; message: string; data: DailyPlanResponse }>('/planner/generate', {

        method: 'POST',

      }),

    reorder: (orderedTaskIds: string[]) =>

      this.request<{ success: boolean; message: string; data: DailyPlanResponse }>('/planner/reorder', {

        method: 'PUT',

        body: JSON.stringify({ orderedTaskIds }),

      }),

    toggleTask: (taskId: string, include: boolean) =>

      this.request<{ success: boolean; message: string; data: DailyPlanResponse }>('/planner/toggle-task', {

        method: 'POST',

        body: JSON.stringify({ taskId, include }),

      }),

  };



  // Meeting Intelligence APIs

  meetings = {

    analyze: (rawNotes: string) =>

      this.request<{ success: boolean; message: string; data: Meeting }>('/meetings/analyze', {

        method: 'POST',

        body: JSON.stringify({ rawNotes }),

      }),

    getAll: () =>

      this.request<{ success: boolean; data: Meeting[] }>('/meetings'),

    getById: (id: string) =>

      this.request<{ success: boolean; data: Meeting }>(`/meetings/${id}`),

    createTask: (meetingId: string, actionIndex: number, customData?: Partial<Task>) =>

      this.request<{ success: boolean; message: string; data: Task }>(`/meetings/${meetingId}/create-task`, {

        method: 'POST',

        body: JSON.stringify({ actionIndex, customData }),

      }),

    createFollowUp: (meetingId: string, commitmentIndex: number, customData?: Partial<FollowUp>) =>

      this.request<{ success: boolean; message: string; data: FollowUp }>(`/meetings/${meetingId}/create-followup`, {

        method: 'POST',

        body: JSON.stringify({ commitmentIndex, customData }),

      }),

    delete: (id: string) =>

      this.request<{ success: boolean; message: string }>(`/meetings/${id}`, {

        method: 'DELETE',

      }),

  };



  // Productivity Insights APIs

  insights = {

    getSummary: () =>

      this.request<{ success: boolean; data: ProductivitySummary }>('/insights/summary'),

    getWorkload: () =>

      this.request<{ success: boolean; data: WorkloadDay[] }>('/insights/workload'),

    getDistribution: () =>

      this.request<{ success: boolean; data: TimeDistribution }>('/insights/distribution'),

    getActivityPatterns: () =>

      this.request<{ success: boolean; data: ProductivityPatterns }>('/insights/activity'),

    getWeekly: () =>

      this.request<{ success: boolean; data: WeeklyInsights }>('/insights/weekly'),

  };



  // Activity APIs

  activity = {

    getAll: (params?: { limit?: number; type?: string }) => {

      const query = new URLSearchParams(params as any).toString();

      return this.request<{ success: boolean; data: Activity[] }>(`/activity${query ? `?${query}` : ''}`);

    },

  };



  // Notifications APIs

  notifications = {

    getAll: () =>

      this.request<{ success: boolean; data: NotificationItem[]; unreadCount: number }>('/notifications'),

    markRead: (id: string) =>

      this.request<{ success: boolean; data: NotificationItem }>(`/notifications/${id}/read`, {

        method: 'PATCH',

      }),

    markAllRead: () =>

      this.request<{ success: boolean; message: string }>('/notifications/read-all', {

        method: 'POST',

      }),

  };



  // User Settings APIs

  users = {

    getMe: () => this.request<{ success: boolean; data: User }>('/users/me'),

    update: (data: Partial<User>) =>

      this.request<{ success: boolean; message: string; data: User }>('/users/me', {

        method: 'PATCH',

        body: JSON.stringify(data),

      }),

  };

}



export const api = new ApiClient();
