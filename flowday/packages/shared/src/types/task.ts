export type TaskPriority = 'high' | 'normal' | 'low';
export type TaskStatus = 'open' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  workspaceId: string;
  projectId: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: Date | null;
  completedAt: Date | null;
  recurrenceRule: string | null; // RRULE format
  parentTaskId: string | null; // for recurring instances
  createdAt: Date;
  updatedAt: Date;
  labels?: Label[];
}

export interface TaskCreate {
  workspaceId: string;
  projectId?: string | null;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  deadline?: Date | null;
  recurrenceRule?: string | null;
  labelIds?: string[];
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  deadline?: Date | null;
  projectId?: string | null;
  recurrenceRule?: string | null;
  completedAt?: Date | null;
}

export interface Label {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface LabelCreate {
  workspaceId: string;
  name: string;
  color: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  color: string | null;
  archived: boolean;
  createdAt: Date;
}

export interface ProjectCreate {
  workspaceId: string;
  name: string;
  color?: string | null;
}

export interface ProjectUpdate {
  name?: string;
  color?: string | null;
  archived?: boolean;
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: '#FF3B30', // iOS systemRed
  normal: '#007AFF', // iOS systemBlue
  low: '#8E8E93', // iOS systemGray
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'Hoog',
  normal: 'Normaal',
  low: 'Laag',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  open: 'Open',
  in_progress: 'In uitvoering',
  completed: 'Voltooid',
};
