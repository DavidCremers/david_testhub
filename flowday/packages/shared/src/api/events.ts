import { getSupabase } from './supabase';
import type { CalendarEvent, CalendarEventCreate, CalendarEventUpdate } from '../types';

/**
 * Convert database row to CalendarEvent type
 */
function toEvent(row: any): CalendarEvent {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    description: row.description,
    startTime: new Date(row.start_time),
    endTime: row.end_time ? new Date(row.end_time) : null,
    location: row.location,
    recurrenceRule: row.recurrence_rule,
    parentEventId: row.parent_event_id,
    googleEventId: row.google_event_id,
    syncStatus: row.sync_status,
    lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Get all events for a workspace
 */
export async function getEvents(workspaceId: string): Promise<CalendarEvent[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return (data || []).map(toEvent);
}

/**
 * Get events within a date range
 */
export async function getEventsInRange(
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())
    .order('start_time', { ascending: true });

  if (error) throw error;
  return (data || []).map(toEvent);
}

/**
 * Get events for today
 */
export async function getTodayEvents(workspaceId: string): Promise<CalendarEvent[]> {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  return getEventsInRange(workspaceId, startOfDay, endOfDay);
}

/**
 * Get events for a specific day
 */
export async function getEventsForDay(workspaceId: string, date: Date): Promise<CalendarEvent[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return getEventsInRange(workspaceId, startOfDay, endOfDay);
}

/**
 * Get upcoming events (next 7 days)
 */
export async function getUpcomingEvents(workspaceId: string, days: number = 7): Promise<CalendarEvent[]> {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return getEventsInRange(workspaceId, today, futureDate);
}

/**
 * Get a single event by ID
 */
export async function getEvent(id: string): Promise<CalendarEvent | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? toEvent(data) : null;
}

/**
 * Create a new event
 */
export async function createEvent(event: CalendarEventCreate): Promise<CalendarEvent> {
  const supabase = getSupabase();

  // Default end time to 30 minutes after start if not provided
  const endTime = event.endTime || new Date(event.startTime.getTime() + 30 * 60 * 1000);

  const { data, error } = await supabase
    .from('events')
    .insert({
      workspace_id: event.workspaceId,
      title: event.title,
      description: event.description || null,
      start_time: event.startTime.toISOString(),
      end_time: endTime.toISOString(),
      location: event.location || null,
      recurrence_rule: event.recurrenceRule || null,
    })
    .select()
    .single();

  if (error) throw error;
  return toEvent(data);
}

/**
 * Update an event
 */
export async function updateEvent(id: string, update: CalendarEventUpdate): Promise<CalendarEvent> {
  const supabase = getSupabase();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (update.title !== undefined) updateData.title = update.title;
  if (update.description !== undefined) updateData.description = update.description;
  if (update.startTime !== undefined) updateData.start_time = update.startTime.toISOString();
  if (update.endTime !== undefined) updateData.end_time = update.endTime?.toISOString() || null;
  if (update.location !== undefined) updateData.location = update.location;
  if (update.recurrenceRule !== undefined) updateData.recurrence_rule = update.recurrenceRule;

  const { data, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toEvent(data);
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Mark event as synced with Google Calendar
 */
export async function markEventSynced(id: string, googleEventId: string): Promise<CalendarEvent> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('events')
    .update({
      google_event_id: googleEventId,
      sync_status: 'synced',
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toEvent(data);
}
