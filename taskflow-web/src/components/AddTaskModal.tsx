'use client'

import { useState } from 'react'
import { X, Calendar as CalendarIcon, Flag, Tag, Mic, AlertCircle } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import type { TaskCategory, TaskPriority } from '@/types/database'
import { cn } from '@/lib/utils'
import { VoiceInput } from './VoiceInput'

interface AddTaskModalProps {
  category: TaskCategory
  onClose: () => void
}

const priorities: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Laag', color: 'bg-gray-200 text-gray-700' },
  { value: 'medium', label: 'Normaal', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'Hoog', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
]

export function AddTaskModal({ category, onClose }: AddTaskModalProps) {
  const { addTask } = useTasks()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [tags, setTags] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accentColor = category === 'work' ? 'work' : 'personal'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      await addTask({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        is_completed: false,
        completed_at: null,
        import_source: 'manual',
        source_reference: null,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        reminder_date: null,
      })
      onClose()
    } catch (err) {
      console.error('Failed to add task:', err)
      const message = err instanceof Error ? err.message : 'Er ging iets mis bij het toevoegen'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showVoice) {
    return <VoiceInput category={category} onClose={() => setShowVoice(false)} />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md mx-0 sm:mx-4 animate-slide-up">
        <div className="bg-white dark:bg-gray-900 sm:rounded-3xl rounded-t-3xl shadow-ios-xl overflow-hidden">
          {/* Header */}
          <div className={cn(
            'px-5 py-4 flex items-center justify-between',
            'border-b border-gray-100 dark:border-gray-800'
          )}>
            <button onClick={onClose} className="text-gray-500 font-medium">
              Annuleer
            </button>
            <h2 className="font-semibold text-gray-900 dark:text-white">Nieuwe taak</h2>
            <button
              onClick={() => setShowVoice(true)}
              className={`text-${accentColor}-600 p-1`}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <input
                type="text"
                placeholder="Wat moet je doen?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-2xl text-lg font-medium',
                  'bg-gray-100 dark:bg-gray-800 border-0',
                  'placeholder-gray-400 focus:ring-2',
                  `focus:ring-${accentColor}-500`
                )}
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <textarea
                placeholder="Notities (optioneel)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className={cn(
                  'w-full px-4 py-3 rounded-2xl resize-none',
                  'bg-gray-100 dark:bg-gray-800 border-0',
                  'placeholder-gray-400 focus:ring-2',
                  `focus:ring-${accentColor}-500`
                )}
              />
            </div>

            {/* Priority */}
            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <Flag className="w-4 h-4" /> Prioriteit
              </label>
              <div className="flex gap-2 mt-2">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all btn-press',
                      priority === p.value
                        ? p.color + ' ring-2 ring-offset-2 ring-gray-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> Deadline
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-2xl mt-2',
                  'bg-gray-100 dark:bg-gray-800 border-0',
                  'focus:ring-2',
                  `focus:ring-${accentColor}-500`
                )}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Tags (komma-gescheiden)
              </label>
              <input
                type="text"
                placeholder="werk, project, idee"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-2xl mt-2',
                  'bg-gray-100 dark:bg-gray-800 border-0',
                  'placeholder-gray-400 focus:ring-2',
                  `focus:ring-${accentColor}-500`
                )}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                fontWeight: 600,
                color: 'white',
                backgroundColor: category === 'work' ? '#3b82f6' : '#a855f7',
                border: 'none',
                cursor: !title.trim() || isSubmitting ? 'not-allowed' : 'pointer',
                opacity: !title.trim() || isSubmitting ? 0.5 : 1,
              }}
            >
              {isSubmitting ? 'Toevoegen...' : 'Taak toevoegen'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
