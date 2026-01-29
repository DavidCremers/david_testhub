import { create } from 'zustand';
import type { Task, TaskCreate, TaskUpdate, Label } from '../shared';
import {
  getTasks,
  getTodayTasks,
  getUpcomingTasks,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  completeTask as apiCompleteTask,
  reopenTask as apiReopenTask,
  deleteTask as apiDeleteTask,
  getLabels,
} from '../shared';

interface TasksState {
  tasks: Task[];
  todayTasks: Task[];
  upcomingTasks: Task[];
  labels: Label[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTasks: (workspaceId: string) => Promise<void>;
  loadTodayTasks: (workspaceId: string) => Promise<void>;
  loadUpcomingTasks: (workspaceId: string, days?: number) => Promise<void>;
  loadLabels: (workspaceId: string) => Promise<void>;
  createTask: (task: TaskCreate) => Promise<Task>;
  updateTask: (id: string, update: TaskUpdate) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  reopenTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearTasks: () => void;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  todayTasks: [],
  upcomingTasks: [],
  labels: [],
  isLoading: false,
  error: null,

  loadTasks: async (workspaceId: string) => {
    try {
      set({ isLoading: true, error: null });
      const tasks = await getTasks(workspaceId);
      set({ tasks, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load tasks',
      });
    }
  },

  loadTodayTasks: async (workspaceId: string) => {
    try {
      const todayTasks = await getTodayTasks(workspaceId);
      set({ todayTasks });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load today tasks',
      });
    }
  },

  loadUpcomingTasks: async (workspaceId: string, days: number = 7) => {
    try {
      const upcomingTasks = await getUpcomingTasks(workspaceId, days);
      set({ upcomingTasks });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load upcoming tasks',
      });
    }
  },

  loadLabels: async (workspaceId: string) => {
    try {
      const labels = await getLabels(workspaceId);
      set({ labels });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load labels',
      });
    }
  },

  createTask: async (task: TaskCreate) => {
    try {
      set({ isLoading: true, error: null });
      const newTask = await apiCreateTask(task);

      // Update all relevant task lists
      set((state) => ({
        tasks: [newTask, ...state.tasks],
        isLoading: false,
      }));

      // Reload today/upcoming tasks to keep them in sync
      get().loadTodayTasks(task.workspaceId);
      get().loadUpcomingTasks(task.workspaceId);

      return newTask;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create task',
      });
      throw error;
    }
  },

  updateTask: async (id: string, update: TaskUpdate) => {
    try {
      set({ isLoading: true, error: null });
      const updatedTask = await apiUpdateTask(id, update);

      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        todayTasks: state.todayTasks.map((t) => (t.id === id ? updatedTask : t)),
        upcomingTasks: state.upcomingTasks.map((t) => (t.id === id ? updatedTask : t)),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update task',
      });
      throw error;
    }
  },

  completeTask: async (id: string) => {
    try {
      const completedTask = await apiCompleteTask(id);

      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? completedTask : t)),
        todayTasks: state.todayTasks.filter((t) => t.id !== id),
        upcomingTasks: state.upcomingTasks.filter((t) => t.id !== id),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to complete task',
      });
      throw error;
    }
  },

  reopenTask: async (id: string) => {
    try {
      const reopenedTask = await apiReopenTask(id);

      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? reopenedTask : t)),
      }));

      // Reload today/upcoming as the task may need to appear there
      const task = get().tasks.find((t) => t.id === id);
      if (task) {
        get().loadTodayTasks(task.workspaceId);
        get().loadUpcomingTasks(task.workspaceId);
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reopen task',
      });
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    try {
      await apiDeleteTask(id);

      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        todayTasks: state.todayTasks.filter((t) => t.id !== id),
        upcomingTasks: state.upcomingTasks.filter((t) => t.id !== id),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete task',
      });
      throw error;
    }
  },

  clearTasks: () => {
    set({
      tasks: [],
      todayTasks: [],
      upcomingTasks: [],
      labels: [],
      error: null,
    });
  },
}));
