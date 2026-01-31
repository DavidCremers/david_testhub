'use client'

import { useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import type { TaskCategory, Task } from '@/types/database'
import { Plus, Search, Filter, Trash2, Check, X } from 'lucide-react'
import { cn, formatDueDate, isOverdue, priorityConfig } from '@/lib/utils'
import { AddTaskModal } from './AddTaskModal'

interface TaskListProps {
  category: TaskCategory
}

export function TaskList({ category }: TaskListProps) {
  const { tasks, incompleteTasks, completedTasks, loading, toggleComplete, deleteTask } = useTasks(category)
  const [showAddTask, setShowAddTask] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const filteredTasks = (showCompleted ? tasks : incompleteTasks).filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedTasks = groupTasksByDate(filteredTasks)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-work-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek taken..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-work-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className={cn(
            'p-2.5 rounded-xl border',
            showCompleted
              ? 'bg-work-100 border-work-300 text-work-700'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600'
          )}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Task Groups */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'Geen resultaten' : 'Geen taken'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'Probeer een andere zoekterm' : 'Voeg je eerste taak toe'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowAddTask(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-work-600 text-white rounded-lg hover:bg-work-700"
            >
              <Plus className="w-4 h-4" />
              Nieuwe taak
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTasks).map(([group, groupTasks]) => (
            <div key={group}>
              <h3 className={cn(
                'text-sm font-semibold mb-2 px-1',
                group === 'Verlopen' ? 'text-red-500' : 'text-gray-500'
              )}>
                {group}
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
                {groupTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => toggleComplete(task.id)}
                    onDelete={() => deleteTask(task.id)}
                    onClick={() => setSelectedTask(task)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddTask(true)}
        className={cn(
          'fixed right-4 bottom-24 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40',
          category === 'work'
            ? 'bg-work-600 hover:bg-work-700'
            : 'bg-personal-600 hover:bg-personal-700',
          'text-white'
        )}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal */}
      {showAddTask && (
        <AddTaskModal
          category={category}
          onClose={() => setShowAddTask(false)}
        />
      )}
    </div>
  )
}

function TaskItem({
  task,
  onToggle,
  onDelete,
  onClick
}: {
  task: Task
  onToggle: () => void
  onDelete: () => void
  onClick: () => void
}) {
  const [showActions, setShowActions] = useState(false)
  const priority = priorityConfig[task.priority]
  const overdue = isOverdue(task.due_date, task.is_completed)

  return (
    <div
      className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
      onClick={onClick}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={cn(
          'w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
          task.is_completed
            ? 'bg-green-500 border-green-500 text-white'
            : `border-gray-300 hover:border-${task.priority === 'urgent' ? 'red' : task.priority === 'high' ? 'orange' : 'gray'}-400`
        )}
      >
        {task.is_completed && <Check className="w-4 h-4" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium',
          task.is_completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'
        )}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {task.due_date && (
            <span className={cn('text-xs', overdue ? 'text-red-500' : 'text-gray-500')}>
              {formatDueDate(task.due_date)}
            </span>
          )}
          {task.tags.length > 0 && (
            <span className="text-xs text-gray-400">
              #{task.tags[0]}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={cn('text-xs px-2 py-1 rounded', priority.bg, priority.color)}>
          {priority.label}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1 text-gray-400 hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function groupTasksByDate(tasks: Task[]): Record<string, Task[]> {
  const groups: Record<string, Task[]> = {}
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  tasks.forEach((task) => {
    let group: string

    if (!task.due_date) {
      group = 'Geen deadline'
    } else {
      const dueDate = new Date(task.due_date)
      dueDate.setHours(0, 0, 0, 0)

      if (dueDate < today && !task.is_completed) {
        group = 'Verlopen'
      } else if (dueDate.getTime() === today.getTime()) {
        group = 'Vandaag'
      } else if (dueDate.getTime() === tomorrow.getTime()) {
        group = 'Morgen'
      } else {
        group = 'Later'
      }
    }

    if (!groups[group]) groups[group] = []
    groups[group].push(task)
  })

  // Sort groups
  const order = ['Verlopen', 'Vandaag', 'Morgen', 'Later', 'Geen deadline']
  const sorted: Record<string, Task[]> = {}
  order.forEach((key) => {
    if (groups[key]) sorted[key] = groups[key]
  })

  return sorted
}
