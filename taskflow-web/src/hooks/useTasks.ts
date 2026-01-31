'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import type { Task, TaskInsert, TaskUpdate, TaskCategory } from '@/types/database'

export function useTasks(category?: TaskCategory) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient()

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setTasks(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij ophalen taken')
    } finally {
      setLoading(false)
    }
  }, [supabase, category])

  const addTask = async (task: Omit<TaskInsert, 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Niet ingelogd')

      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert({ ...task, user_id: user.id })
        .select()
        .single()

      if (insertError) throw insertError
      setTasks(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij toevoegen taak')
      throw err
    }
  }

  const updateTask = async (id: string, updates: TaskUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      setTasks(prev => prev.map(t => t.id === id ? data : t))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij bijwerken taak')
      throw err
    }
  }

  const toggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    return updateTask(id, {
      is_completed: !task.is_completed,
      completed_at: !task.is_completed ? new Date().toISOString() : null
    })
  }

  const deleteTask = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij verwijderen taak')
      throw err
    }
  }

  // Real-time subscription
  useEffect(() => {
    fetchTasks()

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new as Task, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t =>
              t.id === payload.new.id ? payload.new as Task : t
            ))
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTasks, supabase])

  // Computed values
  const incompleteTasks = tasks.filter(t => !t.is_completed)
  const completedTasks = tasks.filter(t => t.is_completed)
  const todayTasks = incompleteTasks.filter(t => {
    if (!t.due_date) return false
    const today = new Date().toDateString()
    return new Date(t.due_date).toDateString() === today
  })
  const overdueTasks = incompleteTasks.filter(t => {
    if (!t.due_date) return false
    return new Date(t.due_date) < new Date() && !t.is_completed
  })

  return {
    tasks,
    incompleteTasks,
    completedTasks,
    todayTasks,
    overdueTasks,
    loading,
    error,
    addTask,
    updateTask,
    toggleComplete,
    deleteTask,
    refresh: fetchTasks
  }
}
