import { TaskPriority } from './task';
import { WorkspaceType } from './workspace';

export type ParsedItemType = 'task' | 'event';

export interface ParsedInput {
  type: ParsedItemType;
  title: string;
  workspace?: WorkspaceType;
  priority?: TaskPriority;
  labels?: string[];
  projectName?: string;
  deadline?: Date;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  recurrence?: RecurrenceInfo;
  rawInput: string;
  confidence: number;
}

export interface RecurrenceInfo {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  endDate?: Date;
  count?: number;
}

export interface ParseResult {
  success: boolean;
  parsed: ParsedInput | null;
  error?: string;
  suggestions?: string[];
}

// Parsing conventions
export const WORKSPACE_MARKERS = {
  '@werk': 'work' as WorkspaceType,
  '@work': 'work' as WorkspaceType,
  '@privé': 'private' as WorkspaceType,
  '@prive': 'private' as WorkspaceType,
  '@private': 'private' as WorkspaceType,
  '@thuis': 'private' as WorkspaceType,
};

export const PRIORITY_MARKERS = {
  '!hoog': 'high' as TaskPriority,
  '!high': 'high' as TaskPriority,
  '!normaal': 'normal' as TaskPriority,
  '!normal': 'normal' as TaskPriority,
  '!laag': 'low' as TaskPriority,
  '!low': 'low' as TaskPriority,
};

export const RECURRENCE_PATTERNS = {
  'elke dag': { frequency: 'daily' as const },
  'dagelijks': { frequency: 'daily' as const },
  'elke week': { frequency: 'weekly' as const },
  'wekelijks': { frequency: 'weekly' as const },
  'elke maand': { frequency: 'monthly' as const },
  'maandelijks': { frequency: 'monthly' as const },
  'elk jaar': { frequency: 'yearly' as const },
  'jaarlijks': { frequency: 'yearly' as const },
};
