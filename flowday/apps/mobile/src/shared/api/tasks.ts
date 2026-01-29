import { getSupabase } from './supabase';
import type { Task, TaskCreate, TaskUpdate, Label, LabelCreate, TaskStatus } from '../types';

/**
 * Convert database row to Task type
 */
function toTask(row: any): Task {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    deadline: row.deadline ? new Date(row.deadline) : null,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    recurrenceRule: row.recurrence_rule,
    parentTaskId: row.parent_task_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    labels: row.labels?.map(toLabel),
  };
}

/**
 * Convert database row to Label type
 */
function toLabel(row: any): Label {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    color: row.color,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Get all tasks for a workspace
 */
export async function getTasks(workspaceId: string): Promise<Task[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      labels:task_labels(
        label:labels(*)
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    ...toTask(row),
    labels: row.labels?.map((tl: any) => toLabel(tl.label)).filter(Boolean) || [],
  }));
}

/**
 * Get tasks by status
 */
export async function getTasksByStatus(workspaceId: string, status: TaskStatus): Promise<Task[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      labels:task_labels(
        label:labels(*)
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('status', status)
    .order('deadline', { ascending: true, nullsFirst: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    ...toTask(row),
    labels: row.labels?.map((tl: any) => toLabel(tl.label)).filter(Boolean) || [],
  }));
}

/**
 * Get tasks due today or overdue
 */
export async function getTodayTasks(workspaceId: string): Promise<Task[]> {
  const supabase = getSupabase();
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      labels:task_labels(
        label:labels(*)
      )
    `)
    .eq('workspace_id', workspaceId)
    .neq('status', 'completed')
    .lte('deadline', today.toISOString())
    .order('deadline', { ascending: true });

  if (error) throw error;

  return (data || []).map((row) => ({
    ...toTask(row),
    labels: row.labels?.map((tl: any) => toLabel(tl.label)).filter(Boolean) || [],
  }));
}

/**
 * Get upcoming tasks (next 7 days)
 */
export async function getUpcomingTasks(workspaceId: string, days: number = 7): Promise<Task[]> {
  const supabase = getSupabase();
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      labels:task_labels(
        label:labels(*)
      )
    `)
    .eq('workspace_id', workspaceId)
    .neq('status', 'completed')
    .gte('deadline', today.toISOString())
    .lte('deadline', futureDate.toISOString())
    .order('deadline', { ascending: true });

  if (error) throw error;

  return (data || []).map((row) => ({
    ...toTask(row),
    labels: row.labels?.map((tl: any) => toLabel(tl.label)).filter(Boolean) || [],
  }));
}

/**
 * Get a single task by ID
 */
export async function getTask(id: string): Promise<Task | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      labels:task_labels(
        label:labels(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data
    ? {
        ...toTask(data),
        labels: data.labels?.map((tl: any) => toLabel(tl.label)).filter(Boolean) || [],
      }
    : null;
}

/**
 * Create a new task
 */
export async function createTask(task: TaskCreate): Promise<Task> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      workspace_id: task.workspaceId,
      project_id: task.projectId || null,
      title: task.title,
      description: task.description || null,
      priority: task.priority || 'normal',
      status: task.status || 'open',
      deadline: task.deadline?.toISOString() || null,
      recurrence_rule: task.recurrenceRule || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Add labels if provided
  if (task.labelIds && task.labelIds.length > 0) {
    const { error: labelError } = await supabase.from('task_labels').insert(
      task.labelIds.map((labelId) => ({
        task_id: data.id,
        label_id: labelId,
      }))
    );
    if (labelError) throw labelError;
  }

  return toTask(data);
}

/**
 * Update a task
 */
export async function updateTask(id: string, update: TaskUpdate): Promise<Task> {
  const supabase = getSupabase();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (update.title !== undefined) updateData.title = update.title;
  if (update.description !== undefined) updateData.description = update.description;
  if (update.priority !== undefined) updateData.priority = update.priority;
  if (update.status !== undefined) updateData.status = update.status;
  if (update.deadline !== undefined) updateData.deadline = update.deadline?.toISOString() || null;
  if (update.projectId !== undefined) updateData.project_id = update.projectId;
  if (update.recurrenceRule !== undefined) updateData.recurrence_rule = update.recurrenceRule;
  if (update.completedAt !== undefined) updateData.completed_at = update.completedAt?.toISOString() || null;

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toTask(data);
}

/**
 * Mark a task as completed
 */
export async function completeTask(id: string): Promise<Task> {
  return updateTask(id, {
    status: 'completed',
    completedAt: new Date(),
  });
}

/**
 * Reopen a completed task
 */
export async function reopenTask(id: string): Promise<Task> {
  return updateTask(id, {
    status: 'open',
    completedAt: null,
  });
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

// ==================== Labels ====================

/**
 * Get all labels for a workspace
 */
export async function getLabels(workspaceId: string): Promise<Label[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('labels')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name');

  if (error) throw error;
  return (data || []).map(toLabel);
}

/**
 * Create a new label
 */
export async function createLabel(label: LabelCreate): Promise<Label> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('labels')
    .insert({
      workspace_id: label.workspaceId,
      name: label.name,
      color: label.color,
    })
    .select()
    .single();

  if (error) throw error;
  return toLabel(data);
}

/**
 * Delete a label
 */
export async function deleteLabel(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('labels').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Add a label to a task
 */
export async function addLabelToTask(taskId: string, labelId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('task_labels').insert({
    task_id: taskId,
    label_id: labelId,
  });
  if (error) throw error;
}

/**
 * Remove a label from a task
 */
export async function removeLabelFromTask(taskId: string, labelId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('task_labels')
    .delete()
    .eq('task_id', taskId)
    .eq('label_id', labelId);
  if (error) throw error;
}
