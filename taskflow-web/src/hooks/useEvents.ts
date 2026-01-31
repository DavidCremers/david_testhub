'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import type { CalendarEvent, EventInsert, EventUpdate, TaskCategory } from '@/types/database'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, parseISO } from 'date-fns'

export function useEvents(category?: TaskCategory) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient()

  const fetchEvents = useCallback(async (start?: Date, end?: Date) => {
    try {
      setLoading(true)
      let query = supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true })

      if (category) {
        query = query.eq('category', category)
      }

      if (start) {
        query = query.gte('start_date', start.toISOString())
      }

      if (end) {
        query = query.lte('start_date', end.toISOString())
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setEvents(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij ophalen events')
    } finally {
      setLoading(false)
    }
  }, [supabase, category])

  const fetchEventsForMonth = useCallback((date: Date) => {
    const start = startOfMonth(date)
    const end = endOfMonth(date)
    return fetchEvents(start, end)
  }, [fetchEvents])

  const fetchEventsForDate = useCallback(async (date: Date) => {
    try {
      const start = startOfDay(date)
      const end = endOfDay(date)

      let query = supabase
        .from('events')
        .select('*')
        .gte('start_date', start.toISOString())
        .lte('start_date', end.toISOString())
        .order('start_date', { ascending: true })

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij ophalen events')
      return []
    }
  }, [supabase, category])

  const addEvent = async (event: Omit<EventInsert, 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Niet ingelogd')

      const { data, error: insertError } = await supabase
        .from('events')
        .insert({ ...event, user_id: user.id })
        .select()
        .single()

      if (insertError) throw insertError
      setEvents(prev => [...prev, data].sort((a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      ))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij toevoegen event')
      throw err
    }
  }

  const updateEvent = async (id: string, updates: EventUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      setEvents(prev => prev.map(e => e.id === id ? data : e))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij bijwerken event')
      throw err
    }
  }

  const deleteEvent = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      setEvents(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij verwijderen event')
      throw err
    }
  }

  // Real-time subscription
  useEffect(() => {
    fetchEvents()

    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEvents(prev => [...prev, payload.new as CalendarEvent].sort((a, b) =>
              new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
            ))
          } else if (payload.eventType === 'UPDATE') {
            setEvents(prev => prev.map(e =>
              e.id === payload.new.id ? payload.new as CalendarEvent : e
            ))
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(e => e.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchEvents, supabase])

  // Computed values
  const todayEvents = events.filter(e => {
    const today = new Date().toDateString()
    return new Date(e.start_date).toDateString() === today
  })

  const upcomingEvents = events
    .filter(e => new Date(e.start_date) >= new Date())
    .slice(0, 5)

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toDateString()
    return events.filter(e => new Date(e.start_date).toDateString() === dateStr)
  }

  return {
    events,
    todayEvents,
    upcomingEvents,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    fetchEvents,
    fetchEventsForMonth,
    fetchEventsForDate,
    getEventsForDate,
    refresh: fetchEvents
  }
}
