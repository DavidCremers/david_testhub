export type TaskCategory = 'work' | 'personal';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ImportSource = 'manual' | 'voice' | 'gmail' | 'whatsapp';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  import_source: ImportSource;
  source_reference: string | null;
  tags: string[];
  reminder_date: string | null;
  original_input: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: TaskCategory;
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  location: string | null;
  import_source: ImportSource;
  source_reference: string | null;
  color: string | null;
  reminder_minutes_before: number | null;
  recurrence: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null;
  attendees: string[];
  original_input: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  preferences: {
    defaultCategory: TaskCategory;
    theme: 'light' | 'dark' | 'system';
    voiceLanguage: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Task>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Event>;
      };
    };
  };
}
