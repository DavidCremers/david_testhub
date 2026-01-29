export type SyncStatus = 'local' | 'synced' | 'pending' | 'conflict';

export interface CalendarEvent {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date | null;
  location: string | null;
  recurrenceRule: string | null; // RRULE format
  parentEventId: string | null; // for recurring instances
  googleEventId: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEventCreate {
  workspaceId: string;
  title: string;
  description?: string | null;
  startTime: Date;
  endTime?: Date | null;
  location?: string | null;
  recurrenceRule?: string | null;
}

export interface CalendarEventUpdate {
  title?: string;
  description?: string | null;
  startTime?: Date;
  endTime?: Date | null;
  location?: string | null;
  recurrenceRule?: string | null;
}

export interface CalendarConnection {
  id: string;
  userId: string;
  workspaceId: string;
  googleCalendarId: string;
  syncDirection: 'both' | 'pull_only' | 'push_only';
  lastSyncAt: Date | null;
  createdAt: Date;
}

export interface CalendarConnectionCreate {
  workspaceId: string;
  googleCalendarId: string;
  googleRefreshToken: string;
  syncDirection?: 'both' | 'pull_only' | 'push_only';
}
