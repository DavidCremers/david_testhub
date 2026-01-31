'use client'

import { Home, CheckSquare, Calendar, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'home' | 'tasks' | 'calendar' | 'integrations'

interface BottomNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  accentColor: 'work' | 'personal'
}

const tabs = [
  { id: 'home' as Tab, label: 'Home', icon: Home },
  { id: 'tasks' as Tab, label: 'Taken', icon: CheckSquare },
  { id: 'calendar' as Tab, label: 'Agenda', icon: Calendar },
  { id: 'integrations' as Tab, label: 'Integraties', icon: Link2 },
]

export function BottomNav({ activeTab, onTabChange, accentColor }: BottomNavProps) {
  const activeColorClass = accentColor === 'work' ? 'text-work-600' : 'text-personal-600'

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full',
                isActive ? activeColorClass : 'text-gray-400'
              )}
            >
              <Icon className={cn('w-6 h-6', isActive && 'scale-110')} />
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
