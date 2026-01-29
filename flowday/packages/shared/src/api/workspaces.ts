import { getSupabase } from './supabase';
import type { Workspace, WorkspaceCreate, WorkspaceUpdate, WorkspaceType } from '../types';

/**
 * Convert database row to Workspace type
 */
function toWorkspace(row: any): Workspace {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    color: row.color,
    icon: row.icon,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Get all workspaces for the current user
 */
export async function getWorkspaces(): Promise<Workspace[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('type', { ascending: true });

  if (error) throw error;
  return (data || []).map(toWorkspace);
}

/**
 * Get a single workspace by ID
 */
export async function getWorkspace(id: string): Promise<Workspace | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? toWorkspace(data) : null;
}

/**
 * Get workspace by type
 */
export async function getWorkspaceByType(type: WorkspaceType): Promise<Workspace | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('type', type)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? toWorkspace(data) : null;
}

/**
 * Create default workspaces for a new user
 */
export async function createDefaultWorkspaces(userId: string): Promise<Workspace[]> {
  const supabase = getSupabase();

  const workspacesToCreate = [
    {
      user_id: userId,
      name: 'Werk',
      type: 'work' as const,
      color: '#007AFF',
      icon: 'briefcase.fill',
    },
    {
      user_id: userId,
      name: 'Privé',
      type: 'private' as const,
      color: '#34C759',
      icon: 'house.fill',
    },
  ];

  const { data, error } = await supabase
    .from('workspaces')
    .insert(workspacesToCreate)
    .select();

  if (error) throw error;
  return (data || []).map(toWorkspace);
}

/**
 * Update a workspace
 */
export async function updateWorkspace(id: string, update: WorkspaceUpdate): Promise<Workspace> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('workspaces')
    .update({
      name: update.name,
      color: update.color,
      icon: update.icon,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toWorkspace(data);
}
