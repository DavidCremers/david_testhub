'use client'

import { useState, useMemo } from 'react'
import { useEvents } from '@/hooks/useEvents'
import type { TaskCategory, CalendarEvent } from '@/types/database'
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddEventModal } from './AddEventModal'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO
} from 'date-fns'
import { nl } from 'date-fns/locale'

interface CalendarProps {
  category: TaskCategory
}

export function Calendar({ category }: CalendarProps) {
  const { events, loading } = useEvents(category)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAddEvent, setShowAddEvent] = useState(false)

  const accentColor = category === 'work' ? 'work' : 'personal'

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const days: Date[] = []
    let day = startDate
    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [currentMonth])

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event =>
      isSameDay(parseISO(event.start_date), date)
    )
  }

  // Get events for selected date
  const selectedDateEvents = useMemo(() =>
    getEventsForDate(selectedDate),
    [selectedDate, events]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-work-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-ios">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: nl })}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            const dayEvents = getEventsForDate(day)
            const isSelected = isSameDay(day, selectedDate)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const today = isToday(day)

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'relative aspect-square p-1 rounded-xl flex flex-col items-center justify-center transition-all btn-press',
                  isSelected && `bg-${accentColor}-500 text-white`,
                  !isSelected && today && 'bg-gray-100 dark:bg-gray-700',
                  !isSelected && !today && 'hover:bg-gray-50 dark:hover:bg-gray-700',
                  !isCurrentMonth && 'opacity-30'
                )}
              >
                <span className={cn(
                  'text-sm font-medium',
                  isSelected ? 'text-white' : 'text-gray-900 dark:text-white'
                )}>
                  {format(day, 'd')}
                </span>
                {/* Event dots */}
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          isSelected ? 'bg-white/80' : `bg-${accentColor}-500`
                        )}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-ios">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold capitalize">
            {isToday(selectedDate)
              ? 'Vandaag'
              : format(selectedDate, 'EEEE d MMMM', { locale: nl })
            }
          </h3>
          <span className="text-sm text-gray-500">
            {selectedDateEvents.length} afspraak{selectedDateEvents.length !== 1 ? 'en' : ''}
          </span>
        </div>

        {selectedDateEvents.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">Geen afspraken</p>
            <button
              onClick={() => setShowAddEvent(true)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium btn-press',
                `bg-${accentColor}-100 text-${accentColor}-700`
              )}
            >
              <Plus className="w-4 h-4" />
              Toevoegen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDateEvents.map(event => (
              <EventCard key={event.id} event={event} accentColor={accentColor} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddEvent(true)}
        className={cn(
          'fixed right-4 bottom-24 w-14 h-14 rounded-full shadow-ios-lg flex items-center justify-center z-40 btn-press',
          `bg-${accentColor}-500 text-white`
        )}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal */}
      {showAddEvent && (
        <AddEventModal
          category={category}
          onClose={() => setShowAddEvent(false)}
        />
      )}
    </div>
  )
}

function EventCard({ event, accentColor }: { event: CalendarEvent; accentColor: string }) {
  const startTime = format(parseISO(event.start_date), 'HH:mm')
  const endTime = format(parseISO(event.end_date), 'HH:mm')

  return (
    <div className={cn(
      'p-4 rounded-2xl border-l-4',
      'bg-gray-50 dark:bg-gray-700/50',
      `border-${accentColor}-500`
    )}>
      <h4 className="font-semibold text-gray-900 dark:text-white">
        {event.title}
      </h4>
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>{event.is_all_day ? 'Hele dag' : `${startTime} - ${endTime}`}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4" />
            <span>{event.location}</span>
          </div>
        )}
      </div>
    </div>
  )
}
