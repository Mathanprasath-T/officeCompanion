export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';
export type ImportanceLevel = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type WorkSessionStatus = 'active' | 'paused' | 'completed';
export type FollowUpStatus = 'pending' | 'due' | 'overdue' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  authProvider?: 'local' | 'google';
  googleId?: string;
  department: string;
  role: string;
  createdAt?: string;
  preferences?: {
    emailNotifications: boolean;
    priorityReminders: boolean;
    followupAlerts: boolean;
    contextAutoSave: boolean;
  };
}

export interface Task {
  _id: string;
  id?: string;
  title: string;
  description: string;
  deadline: string;
  importance: ImportanceLevel;
  estimatedTime: string;
  status: TaskStatus;
  priority: PriorityLevel;
  priorityReason: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  isOverdue?: boolean;
}

export interface WorkSession {
  _id: string;
  taskId: Task | string;
  userId: string;
  startedAt: string;
  lastActiveAt: string;
  completedActions: string[];
  remainingActions: string[];
  currentContext: string;
  nextAction: string;
  status: WorkSessionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface FollowUp {
  _id: string;
  title: string;
  person: string;
  dueDate: string;
  source: string;
  status: FollowUpStatus;
  reminderTime?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  type: string;
  description: string;
  timestamp: string;
  taskId?: Task | { _id: string; title: string; priority: string; status: string };
  userId: string;
  createdAt?: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'urgent' | 'reminder' | 'context' | 'success';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface TaskCounts {
  total: number;
  urgent: number;
  today: number;
  later: number;
  completed: number;
}

export interface PriorityRecommendation {
  task: Task | null;
  priority: PriorityLevel;
  reason: string;
  score: number;
  estimatedEffort: string;
}

export interface CommitmentDetectionResult {
  action: string;
  person: string;
  dueDate: string;
  type: string;
  confidence: number;
}

// Daily Planner Types
export interface PlanItem {
  _id?: string;
  taskId?: string | null;
  type: 'task' | 'break';
  title: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  durationFormatted: string;
  priority: string;
  reason: string;
  isCompleted: boolean;
  taskDetails?: Task | null;
}

export interface DailyPlanResponse {
  date: string;
  workStartTime: string;
  metrics: {
    tasksToday: number;
    highPriority: number;
    estimatedWorkMinutes: number;
    estimatedWorkFormatted: string;
    availableTimeMinutes: number;
    availableTimeFormatted: string;
  };
  progress: {
    completed: number;
    inProgress: number;
    remaining: number;
    total: number;
  };
  planItems: PlanItem[];
  availableTasks: Array<{
    _id: string;
    title: string;
    priority: PriorityLevel;
    estimatedTime: string;
    deadline: string;
    status: TaskStatus;
  }>;
}

// Meeting Intelligence Types
export interface MeetingActionItem {
  _id?: string;
  action: string;
  person: string;
  deadline: string;
  priority: PriorityLevel;
  estimatedTime?: string;
  taskId?: Task | string | null;
}

export interface MeetingCommitment {
  _id?: string;
  action: string;
  person: string;
  dueDate: string;
  type?: string;
  confidence?: number;
  followUpId?: FollowUp | string | null;
}

export interface Meeting {
  _id: string;
  title: string;
  rawNotes: string;
  summary: string;
  decisions: string[];
  actionItems: MeetingActionItem[];
  commitments: MeetingCommitment[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Productivity Insights Types
export interface ProductivitySummary {
  kpis: {
    tasksCompleted: number;
    highPriorityCompleted: number;
    followUpsCompleted: number;
    overdueTasks: number;
    totalTasks: number;
    totalFollowUps: number;
    followUpCompletionRate: number;
    meetingsAnalyzed: number;
  };
}

export interface WorkloadDay {
  day: string;
  date: string;
  fullDate: string;
  completed: number;
  remaining: number;
}

export interface TimeDistribution {
  hasEnoughData: boolean;
  message?: string;
  explanation?: string;
  totalTrackedMinutes?: number;
  totalTrackedFormatted?: string;
  distribution: Array<{
    category: string;
    minutes: number;
    percentage: number;
    color: string;
  }>;
}

export interface ProductivityPatterns {
  completedByTimeWindow: Array<{
    window: string;
    count: number;
  }>;
  peakWindow: string;
  peakObservation: string;
  averageTaskDuration: string;
  averageTaskDurationMinutes: number;
  followUpCompletionRate: string;
  totalActivitiesLogged: number;
}

export interface WeeklyInsights {
  metricsSnapshot: {
    tasksCompleted: number;
    highPriorityCompleted: number;
    overdueTasks: number;
    followUpsCompleted: number;
    averageTaskDuration: string;
    mostActivePeriod: string;
  };
  observations: string[];
  suggestions: Array<{
    title: string;
    description: string;
    tag: string;
  }>;
}
