export type TaskCategory = 'work' | 'personal'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ImportSource = 'manual' | 'voice' | 'gmail' | 'whatsapp' | 'google_calendar'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  preferences: {
    defaultCategory: TaskCategory
    theme: 'light' | 'dark' | 'system'
  }
  google_access_token: string | null
  google_refresh_token: string | null
  google_token_expiry: string | null
  google_connected: boolean
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string
  category: TaskCategory
  priority: TaskPriority
  due_date: string | null
  is_completed: boolean
  completed_at: string | null
  import_source: ImportSource
  source_reference: string | null
  tags: string[]
  reminder_date: string | null
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description: string
  category: TaskCategory
  start_date: string
  end_date: string
  is_all_day: boolean
  location: string | null
  import_source: ImportSource
  source_reference: string | null
  color: string | null
  reminder_minutes_before: number | null
  recurrence: string | null
  attendees: string[]
  created_at: string
  updated_at: string
}

export interface Integration {
  id: string
  user_id: string
  provider: 'google'
  access_token: string | null
  refresh_token: string | null
  token_expires_at: string | null
  email: string | null
  is_active: boolean
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

// Insert/Update types
export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at'>
export type TaskUpdate = Partial<TaskInsert>

export type EventInsert = Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>
export type EventUpdate = Partial<EventInsert>

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      tasks: {
        Row: Task
        Insert: TaskInsert
        Update: TaskUpdate
      }
      events: {
        Row: CalendarEvent
        Insert: EventInsert
        Update: EventUpdate
      }
      integrations: {
        Row: Integration
        Insert: Omit<Integration, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Integration, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
