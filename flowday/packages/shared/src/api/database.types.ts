export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'work' | 'private';
          color: string | null;
          icon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'work' | 'private';
          color?: string | null;
          icon?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'work' | 'private';
          color?: string | null;
          icon?: string | null;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          color: string | null;
          archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          color?: string | null;
          archived?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          color?: string | null;
          archived?: boolean;
          created_at?: string;
        };
      };
      labels: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          color: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          priority: 'high' | 'normal' | 'low';
          status: 'open' | 'in_progress' | 'completed';
          deadline: string | null;
          completed_at: string | null;
          recurrence_rule: string | null;
          parent_task_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          title: string;
          description?: string | null;
          priority?: 'high' | 'normal' | 'low';
          status?: 'open' | 'in_progress' | 'completed';
          deadline?: string | null;
          completed_at?: string | null;
          recurrence_rule?: string | null;
          parent_task_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string | null;
          title?: string;
          description?: string | null;
          priority?: 'high' | 'normal' | 'low';
          status?: 'open' | 'in_progress' | 'completed';
          deadline?: string | null;
          completed_at?: string | null;
          recurrence_rule?: string | null;
          parent_task_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_labels: {
        Row: {
          task_id: string;
          label_id: string;
        };
        Insert: {
          task_id: string;
          label_id: string;
        };
        Update: {
          task_id?: string;
          label_id?: string;
        };
      };
      events: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string | null;
          location: string | null;
          recurrence_rule: string | null;
          parent_event_id: string | null;
          google_event_id: string | null;
          sync_status: 'local' | 'synced' | 'pending' | 'conflict';
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time?: string | null;
          location?: string | null;
          recurrence_rule?: string | null;
          parent_event_id?: string | null;
          google_event_id?: string | null;
          sync_status?: 'local' | 'synced' | 'pending' | 'conflict';
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string | null;
          location?: string | null;
          recurrence_rule?: string | null;
          parent_event_id?: string | null;
          google_event_id?: string | null;
          sync_status?: 'local' | 'synced' | 'pending' | 'conflict';
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      calendar_connections: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string;
          google_calendar_id: string;
          google_refresh_token: string;
          sync_direction: 'both' | 'pull_only' | 'push_only';
          last_sync_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id: string;
          google_calendar_id: string;
          google_refresh_token: string;
          sync_direction?: 'both' | 'pull_only' | 'push_only';
          last_sync_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workspace_id?: string;
          google_calendar_id?: string;
          google_refresh_token?: string;
          sync_direction?: 'both' | 'pull_only' | 'push_only';
          last_sync_at?: string | null;
          created_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          default_workspace_id: string | null;
          notifications_enabled: boolean;
          language: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          default_workspace_id?: string | null;
          notifications_enabled?: boolean;
          language?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          default_workspace_id?: string | null;
          notifications_enabled?: boolean;
          language?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
