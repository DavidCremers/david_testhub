'use client'

import { useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useEvents } from '@/hooks/useEvents'
import type { TaskCategory } from '@/types/database'
import { CheckCircle, Clock, AlertTriangle, Calendar, Plus } from 'lucide-react'
import { cn, formatDueDate, isOverdue, priorityConfig } from '@/lib/utils'
import { AddTaskModal } from './AddTaskModal'
import { AddEventModal } from './AddEventModal'

interface DashboardProps {
  category: TaskCategory
}

export function Dashboard({ category }: DashboardProps) {
  const { tasks, incompleteTasks, todayTasks, overdueTasks, toggleComplete, loading } = useTasks(category)
  const { upcomingEvents } = useEvents(category)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)

  const completedCount = tasks.filter(t => t.is_completed).length
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  const accentColor = category === 'work' ? 'work' : 'personal'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-work-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          value={incompleteTasks.length}
          label="Te doen"
          color={`text-${accentColor}-600`}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          value={todayTasks.length}
          label="Vandaag"
          color="text-orange-500"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          value={overdueTasks.length}
          label="Verlopen"
          color={overdueTasks.length > 0 ? 'text-red-500' : 'text-gray-400'}
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          value={`${completionRate}%`}
          label="Voltooid"
          color="text-green-500"
        />
      </div>

      {/* Today's Tasks */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-yellow-500">☀️</span> Vandaag
          </h2>
        </div>

        {todayTasks.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Geen taken voor vandaag</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.slice(0, 4).map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => toggleComplete(task.id)}
              />
            ))}
            {todayTasks.length > 4 && (
              <p className="text-center text-sm text-gray-500 mt-2">
                + {todayTasks.length - 4} meer
              </p>
            )}
          </div>
        )}
      </section>

      {/* Upcoming Events */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" /> Komende afspraken
          </h2>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Geen komende afspraken</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
          Snel toevoegen
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddTask(true)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium',
              `bg-${accentColor}-100 text-${accentColor}-700 hover:bg-${accentColor}-200`
            )}
          >
            <Plus className="w-5 h-5" />
            Taak
          </button>
          <button
            onClick={() => setShowAddEvent(true)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium',
              `bg-${accentColor}-100 text-${accentColor}-700 hover:bg-${accentColor}-200`
            )}
          >
            <Plus className="w-5 h-5" />
            Afspraak
          </button>
        </div>
      </section>

      {/* Modals */}
      {showAddTask && (
        <AddTaskModal
          category={category}
          onClose={() => setShowAddTask(false)}
        />
      )}
      {showAddEvent && (
        <AddEventModal
          category={category}
          onClose={() => setShowAddEvent(false)}
        />
      )}
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  color
}: {
  icon: React.ReactNode
  value: string | number
  label: string
  color: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm text-center">
      <div className={cn('mx-auto mb-1', color)}>{icon}</div>
      <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

function TaskRow({
  task,
  onToggle
}: {
  task: any
  onToggle: () => void
}) {
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig]
  const overdue = isOverdue(task.due_date, task.is_completed)

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
      <button
        onClick={onToggle}
        className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center',
          task.is_completed
            ? 'bg-green-500 border-green-500 text-white'
            : `border-${task.priority === 'urgent' ? 'red' : task.priority === 'high' ? 'orange' : 'gray'}-400`
        )}
      >
        {task.is_completed && '✓'}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium truncate',
          task.is_completed && 'line-through text-gray-400'
        )}>
          {task.title}
        </p>
        {task.due_date && (
          <p className={cn('text-xs', overdue ? 'text-red-500' : 'text-gray-500')}>
            {formatDueDate(task.due_date)}
          </p>
        )}
      </div>

      <span className={cn('text-xs px-2 py-1 rounded', priority.bg, priority.color)}>
        {priority.label}
      </span>
    </div>
  )
}

function EventRow({ event }: { event: any }) {
  const time = event.is_all_day
    ? 'Hele dag'
    : new Date(event.start_date).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex items-center gap-3 p-2">
      <div className={cn(
        'w-1 h-10 rounded-full',
        event.category === 'work' ? 'bg-work-500' : 'bg-personal-500'
      )} />
      <div className="flex-1">
        <p className="font-medium text-gray-900 dark:text-white">{event.title}</p>
        <p className="text-sm text-gray-500">
          {time}
          {event.location && ` • ${event.location}`}
        </p>
      </div>
    </div>
  )
}
