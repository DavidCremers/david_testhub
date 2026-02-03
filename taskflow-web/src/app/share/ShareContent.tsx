'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { useTasks } from '@/hooks/useTasks'
import type { TaskCategory } from '@/types/database'

export default function ShareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [category, setCategory] = useState<TaskCategory>('personal')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const { addTask } = useTasks()
  const supabase = createBrowserClient()

  useEffect(() => {
    // Get shared content from URL params
    const sharedTitle = searchParams.get('title') || ''
    const sharedText = searchParams.get('text') || ''
    const sharedUrl = searchParams.get('url') || ''

    // Combine text and URL if both present
    let fullText = sharedText
    if (sharedUrl && sharedUrl !== sharedText) {
      fullText = fullText ? `${fullText}\n\n${sharedUrl}` : sharedUrl
    }

    setTitle(sharedTitle || 'Gedeelde taak')
    setText(fullText)

    // Check auth
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkAuth()
  }, [searchParams, supabase.auth])

  const handleSubmit = async () => {
    if (!title.trim() || isSubmitting || !user) return

    setIsSubmitting(true)
    setError(null)

    try {
      await addTask({
        title: title.trim(),
        description: text.trim(),
        category,
        priority: 'medium',
        due_date: null,
        is_completed: false,
        completed_at: null,
        import_source: 'manual',
        source_reference: null,
        tags: ['gedeeld'],
        reminder_date: null,
      })
      router.push('/')
    } catch (err) {
      console.error('Failed to add task:', err)
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg max-w-md w-full text-center">
          <h1 className="text-xl font-bold mb-4">Log eerst in</h1>
          <p className="text-gray-600 mb-4">Je moet ingelogd zijn om content te delen naar TaskFlow.</p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '12px',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Naar login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-2xl p-6 shadow-lg max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-6 text-center">Opslaan als taak</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Category */}
          <div className="flex gap-2">
            <button
              onClick={() => setCategory('personal')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 500,
                cursor: 'pointer',
                backgroundColor: category === 'personal' ? '#a855f7' : '#f3e8ff',
                color: category === 'personal' ? 'white' : '#7c3aed',
              }}
            >
              Privé
            </button>
            <button
              onClick={() => setCategory('work')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 500,
                cursor: 'pointer',
                backgroundColor: category === 'work' ? '#3b82f6' : '#dbeafe',
                color: category === 'work' ? 'white' : '#1d4ed8',
              }}
            >
              Werk
            </button>
          </div>

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              fontSize: '16px',
            }}
          />

          {/* Description */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Beschrijving"
            rows={4}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              resize: 'none',
            }}
          />

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push('/')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                backgroundColor: 'white',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Annuleer
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || isSubmitting}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: category === 'work' ? '#3b82f6' : '#a855f7',
                color: 'white',
                fontWeight: 600,
                cursor: !title.trim() || isSubmitting ? 'not-allowed' : 'pointer',
                opacity: !title.trim() || isSubmitting ? 0.5 : 1,
              }}
            >
              {isSubmitting ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
