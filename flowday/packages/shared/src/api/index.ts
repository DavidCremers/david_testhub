// Supabase client
export { initSupabase, getSupabase, isSupabaseInitialized } from './supabase';

// Auth
export {
  signUp,
  signIn,
  signInWithMagicLink,
  signOut,
  getCurrentUser,
  getSession,
  refreshSession,
  updateProfile,
  resetPassword,
  updatePassword,
  onAuthStateChange,
} from './auth';

// Workspaces
export {
  getWorkspaces,
  getWorkspace,
  getWorkspaceByType,
  createDefaultWorkspaces,
  updateWorkspace,
} from './workspaces';

// Tasks
export {
  getTasks,
  getTasksByStatus,
  getTodayTasks,
  getUpcomingTasks,
  getTask,
  createTask,
  updateTask,
  completeTask,
  reopenTask,
  deleteTask,
  getLabels,
  createLabel,
  deleteLabel,
  addLabelToTask,
  removeLabelFromTask,
} from './tasks';

// Events
export {
  getEvents,
  getEventsInRange,
  getTodayEvents,
  getEventsForDay,
  getUpcomingEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  markEventSynced,
} from './events';

// Types
export type { Database } from './database.types';
