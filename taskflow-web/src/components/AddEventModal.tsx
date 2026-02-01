'use client'

import { useState } from 'react'
import { X, MapPin, Clock, Mic, AlertCircle } from 'lucide-react'
import { useEvents } from '@/hooks/useEvents'
import type { TaskCategory } from '@/types/database'
import { cn } from '@/lib/utils'
import { VoiceInput } from './VoiceInput'

interface AddEventModalProps {
  category: TaskCategory
  onClose: () => void
}

export function AddEventModal({ category, onClose }: AddEventModalProps) {
  const { addEvent } = useEvents()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accentColor = category === 'work' ? 'work' : 'personal'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !startDate || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const start = new Date(startDate)
      const end = endDate ? new Date(endDate) : new Date(start.getTime() + 60 * 60 * 1000)

      await addEvent({
        title: title.trim(),
        description: description.trim(),
        category,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        is_all_day: isAllDay,
        location: location.trim() || null,
        import_source: 'manual',
        source_reference: null,
        color: null,
        reminder_minutes_before: 15,
        recurrence: null,
        attendees: [],
      })
      onClose()
    } catch (err) {
      console.error('Failed to add event:', err)
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
            <h2 className="font-semibold text-gray-900 dark:text-white">Nieuwe afspraak</h2>
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
                placeholder="Titel afspraak"
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

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Locatie
              </label>
              <input
                type="text"
                placeholder="Voeg locatie toe"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-2xl mt-2',
                  'bg-gray-100 dark:bg-gray-800 border-0',
                  'placeholder-gray-400 focus:ring-2',
                  `focus:ring-${accentColor}-500`
                )}
              />
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center justify-between py-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" /> Hele dag
              </label>
              <button
                type="button"
                onClick={() => setIsAllDay(!isAllDay)}
                className={cn(
                  'relative w-12 h-7 rounded-full transition-colors',
                  isAllDay ? `bg-${accentColor}-500` : 'bg-gray-300 dark:bg-gray-600'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform',
                    isAllDay ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">
                  Start
                </label>
                <input
                  type={isAllDay ? 'date' : 'datetime-local'}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className={cn(
                    'w-full px-4 py-3 rounded-2xl',
                    'bg-gray-100 dark:bg-gray-800 border-0',
                    'focus:ring-2',
                    `focus:ring-${accentColor}-500`
                  )}
                />
              </div>
              {!isAllDay && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">
                    Einde
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className={cn(
                      'w-full px-4 py-3 rounded-2xl',
                      'bg-gray-100 dark:bg-gray-800 border-0',
                      'focus:ring-2',
                      `focus:ring-${accentColor}-500`
                    )}
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!title.trim() || !startDate || isSubmitting}
              className={cn(
                'w-full py-4 rounded-2xl font-semibold text-white btn-press',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                `bg-${accentColor}-500 hover:bg-${accentColor}-600`,
                'shadow-lg',
                `shadow-${accentColor}-500/25`
              )}
            >
              {isSubmitting ? 'Toevoegen...' : 'Afspraak toevoegen'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
