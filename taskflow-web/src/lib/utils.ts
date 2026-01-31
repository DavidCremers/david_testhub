import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isTomorrow, isThisWeek, isPast, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDueDate(dateString: string | null): string | null {
  if (!dateString) return null

  const date = parseISO(dateString)

  if (isToday(date)) return 'Vandaag'
  if (isTomorrow(date)) return 'Morgen'
  if (isThisWeek(date)) return format(date, 'EEEE', { locale: nl })

  return format(date, 'd MMM', { locale: nl })
}

export function isOverdue(dateString: string | null, isCompleted: boolean): boolean {
  if (!dateString || isCompleted) return false
  return isPast(parseISO(dateString))
}

export function formatTimeRange(startDate: string, endDate: string, isAllDay: boolean): string {
  if (isAllDay) return 'Hele dag'

  const start = parseISO(startDate)
  const end = parseISO(endDate)

  return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
}

export function formatEventDate(dateString: string): string {
  const date = parseISO(dateString)
  return format(date, 'EEEE d MMMM yyyy', { locale: nl })
}

export const categoryColors = {
  work: {
    bg: 'bg-work-100',
    bgDark: 'bg-work-600',
    text: 'text-work-700',
    textDark: 'text-work-100',
    border: 'border-work-300',
    accent: 'bg-work-500',
  },
  personal: {
    bg: 'bg-personal-100',
    bgDark: 'bg-personal-600',
    text: 'text-personal-700',
    textDark: 'text-personal-100',
    border: 'border-personal-300',
    accent: 'bg-personal-500',
  }
}

export const priorityConfig = {
  low: {
    label: 'Laag',
    color: 'text-gray-500',
    bg: 'bg-gray-100',
    icon: 'arrow-down'
  },
  medium: {
    label: 'Gemiddeld',
    color: 'text-blue-500',
    bg: 'bg-blue-100',
    icon: 'minus'
  },
  high: {
    label: 'Hoog',
    color: 'text-orange-500',
    bg: 'bg-orange-100',
    icon: 'arrow-up'
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-500',
    bg: 'bg-red-100',
    icon: 'alert-circle'
  }
}

export const sourceConfig = {
  manual: {
    label: 'Handmatig',
    color: 'text-gray-500',
    icon: 'hand'
  },
  gmail: {
    label: 'Gmail',
    color: 'text-red-500',
    icon: 'mail'
  },
  outlook: {
    label: 'Outlook',
    color: 'text-blue-600',
    icon: 'calendar'
  },
  whatsapp: {
    label: 'WhatsApp',
    color: 'text-green-500',
    icon: 'message-circle'
  }
}
