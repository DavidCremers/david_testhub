'use client'

import { Briefcase, User } from 'lucide-react'
import type { TaskCategory } from '@/types/database'
import { cn } from '@/lib/utils'

interface CategorySelectorProps {
  selected: TaskCategory
  onChange: (category: TaskCategory) => void
}

export function CategorySelector({ selected, onChange }: CategorySelectorProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange('work')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all',
          selected === 'work'
            ? 'bg-work-600 text-white shadow-lg shadow-work-500/30'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
        )}
      >
        <Briefcase className="w-4 h-4" />
        <span>Werk</span>
      </button>

      <button
        onClick={() => onChange('personal')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all',
          selected === 'personal'
            ? 'bg-personal-600 text-white shadow-lg shadow-personal-500/30'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
        )}
      >
        <User className="w-4 h-4" />
        <span>Privé</span>
      </button>
    </div>
  )
}
