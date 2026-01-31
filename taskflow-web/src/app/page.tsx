'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { TaskCategory } from '@/types/database'
import { AuthScreen } from '@/components/AuthScreen'
import { Dashboard } from '@/components/Dashboard'
import { TaskList } from '@/components/TaskList'
import { Calendar } from '@/components/Calendar'
import { Integrations } from '@/components/Integrations'
import { BottomNav } from '@/components/BottomNav'
import { CategorySelector } from '@/components/CategorySelector'

type Tab = 'home' | 'tasks' | 'calendar' | 'integrations'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [category, setCategory] = useState<TaskCategory>('personal')

  const supabase = createBrowserClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-work-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              TaskFlow
            </h1>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Uitloggen
            </button>
          </div>
          <CategorySelector
            selected={category}
            onChange={setCategory}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4">
        {activeTab === 'home' && <Dashboard category={category} />}
        {activeTab === 'tasks' && <TaskList category={category} />}
        {activeTab === 'calendar' && <Calendar category={category} />}
        {activeTab === 'integrations' && <Integrations />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor={category === 'work' ? 'work' : 'personal'}
      />
    </div>
  )
}
