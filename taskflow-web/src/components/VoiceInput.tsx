'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Send, X, Loader2, Calendar, CheckSquare, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseNaturalLanguage, type ParsedInput } from '@/lib/voice-parser'
import { useTasks } from '@/hooks/useTasks'
import { useEvents } from '@/hooks/useEvents'
import type { TaskCategory } from '@/types/database'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

interface VoiceInputProps {
  category: TaskCategory
  onClose: () => void
}

// Web Speech API types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

export function VoiceInput({ category, onClose }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [parsed, setParsed] = useState<ParsedInput | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  const recognitionRef = useRef<any>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { addTask } = useTasks()
  const { addEvent } = useEvents()

  const accentColor = category === 'work' ? 'work' : 'personal'

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        setIsSupported(false)
        return
      }

      const recognition = new SpeechRecognition()
      recognition.lang = 'nl-NL'
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let final = ''
        let interim = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            final += result[0].transcript
          } else {
            interim += result[0].transcript
          }
        }

        if (final) {
          setTranscript(prev => prev + final)
          setInterimTranscript('')
        } else {
          setInterimTranscript(interim)
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'not-allowed') {
          setError('Microfoon toegang geweigerd. Sta toegang toe in je browser instellingen.')
        } else if (event.error === 'no-speech') {
          setError('Geen spraak gedetecteerd. Probeer opnieuw.')
        }
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Parse input when transcript changes
  useEffect(() => {
    const fullText = transcript + interimTranscript
    if (fullText.trim()) {
      const result = parseNaturalLanguage(fullText)
      result.category = category // Override with selected category
      setParsed(result)
    } else {
      setParsed(null)
    }
  }, [transcript, interimTranscript, category])

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      setError(null)
      setTranscript('')
      setInterimTranscript('')
      recognitionRef.current.start()
      setIsListening(true)
    }
  }, [isListening])

  const handleSubmit = async () => {
    if (!parsed || isProcessing) return

    setIsProcessing(true)
    setError(null)

    try {
      if (parsed.type === 'event' && parsed.startDate) {
        await addEvent({
          title: parsed.title,
          description: parsed.description || '',
          category: parsed.category,
          start_date: parsed.startDate.toISOString(),
          end_date: (parsed.endDate || new Date(parsed.startDate.getTime() + 3600000)).toISOString(),
          is_all_day: parsed.isAllDay || false,
          location: parsed.location || null,
          import_source: 'voice',
          source_reference: null,
          color: null,
          reminder_minutes_before: 15,
          recurrence: null,
          attendees: [],
        })
      } else {
        await addTask({
          title: parsed.title,
          description: parsed.description || '',
          category: parsed.category,
          priority: parsed.priority || 'medium',
          due_date: parsed.dueDate?.toISOString() || null,
          is_completed: false,
          completed_at: null,
          import_source: 'voice',
          source_reference: null,
          tags: parsed.tags || [],
          reminder_date: null,
        })
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTextChange = (text: string) => {
    setTranscript(text)
    setInterimTranscript('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg mx-4 mb-4 sm:mb-0">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className={cn(
            'px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50',
            `bg-gradient-to-r from-${accentColor}-500/10 to-${accentColor}-600/10`
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-2xl flex items-center justify-center',
                  `bg-${accentColor}-500`
                )}>
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Snel toevoegen
                  </h2>
                  <p className="text-sm text-gray-500">
                    Typ of spreek in
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-6">
            {/* Text input */}
            <div className="relative">
              <textarea
                ref={inputRef}
                value={transcript + interimTranscript}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Bijv: &quot;Meeting met Jan morgen om 14:00&quot; of &quot;Boodschappen doen vandaag&quot;"
                className={cn(
                  'w-full h-24 px-4 py-3 pr-12 rounded-2xl resize-none',
                  'bg-gray-100 dark:bg-gray-800 border-2 border-transparent',
                  'focus:border-2 focus:outline-none transition-all',
                  `focus:border-${accentColor}-500`,
                  'text-gray-900 dark:text-white placeholder-gray-400'
                )}
              />

              {/* Voice button */}
              {isSupported && (
                <button
                  onClick={toggleListening}
                  className={cn(
                    'absolute right-3 bottom-3 w-10 h-10 rounded-full flex items-center justify-center transition-all',
                    isListening
                      ? `bg-red-500 text-white animate-pulse`
                      : `bg-${accentColor}-500 text-white hover:bg-${accentColor}-600`
                  )}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
            </div>

            {/* Listening indicator */}
            {isListening && (
              <div className="mt-3 flex items-center gap-2 text-red-500">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-sm font-medium">Luisteren...</span>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Parsed preview */}
            {parsed && (transcript || interimTranscript) && (
              <div className={cn(
                'mt-4 p-4 rounded-2xl border-2',
                parsed.type === 'event'
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                    parsed.type === 'event' ? 'bg-purple-500' : 'bg-blue-500'
                  )}>
                    {parsed.type === 'event'
                      ? <Calendar className="w-4 h-4 text-white" />
                      : <CheckSquare className="w-4 h-4 text-white" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        parsed.type === 'event'
                          ? 'bg-purple-200 text-purple-700 dark:bg-purple-800 dark:text-purple-200'
                          : 'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-200'
                      )}>
                        {parsed.type === 'event' ? 'Afspraak' : 'Taak'}
                      </span>
                      {parsed.priority && parsed.type === 'task' && (
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          parsed.priority === 'urgent' ? 'bg-red-200 text-red-700' :
                            parsed.priority === 'high' ? 'bg-orange-200 text-orange-700' :
                              'bg-gray-200 text-gray-700'
                        )}>
                          {parsed.priority === 'urgent' ? 'Urgent' :
                            parsed.priority === 'high' ? 'Hoog' : ''}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mt-1">
                      {parsed.title}
                    </h3>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                      {parsed.dueDate && (
                        <p>📅 {format(parsed.dueDate, "EEEE d MMMM 'om' HH:mm", { locale: nl })}</p>
                      )}
                      {parsed.startDate && (
                        <p>📅 {format(parsed.startDate, "EEEE d MMMM 'om' HH:mm", { locale: nl })}</p>
                      )}
                      {parsed.location && <p>📍 {parsed.location}</p>}
                      {parsed.tags && parsed.tags.length > 0 && (
                        <p>🏷️ {parsed.tags.map(t => `#${t}`).join(' ')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {!transcript && !interimTranscript && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Probeer bijvoorbeeld:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Boodschappen doen vandaag',
                    'Meeting morgen om 10:00',
                    'Rapport afmaken #werk urgent',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleTextChange(suggestion)}
                      className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
            <button
              onClick={handleSubmit}
              disabled={!parsed || isProcessing}
              className={cn(
                'w-full py-3 px-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all',
                parsed && !isProcessing
                  ? `bg-${accentColor}-500 hover:bg-${accentColor}-600 text-white shadow-lg shadow-${accentColor}-500/25`
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {parsed?.type === 'event' ? 'Afspraak toevoegen' : 'Taak toevoegen'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
