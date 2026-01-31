import { addDays, addWeeks, addMonths, setHours, setMinutes, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday, startOfDay } from 'date-fns'
import type { TaskCategory, TaskPriority } from '@/types/database'

export interface ParsedInput {
  type: 'task' | 'event'
  title: string
  description?: string
  category: TaskCategory
  priority?: TaskPriority
  dueDate?: Date
  startDate?: Date
  endDate?: Date
  isAllDay?: boolean
  location?: string
  tags?: string[]
  confidence: number // 0-1 how confident we are in the parsing
}

// Dutch day names
const dayMap: Record<string, (date: Date) => Date> = {
  'maandag': nextMonday,
  'dinsdag': nextTuesday,
  'woensdag': nextWednesday,
  'donderdag': nextThursday,
  'vrijdag': nextFriday,
  'zaterdag': nextSaturday,
  'zondag': nextSunday,
}

// Priority keywords
const priorityKeywords: Record<TaskPriority, string[]> = {
  urgent: ['urgent', 'dringend', 'asap', 'zo snel mogelijk', 'meteen', 'direct', 'belangrijk'],
  high: ['hoog', 'high', 'prioriteit', 'snel'],
  medium: ['gemiddeld', 'normaal', 'medium'],
  low: ['laag', 'low', 'rustig', 'wanneer het kan', 'geen haast'],
}

// Event keywords
const eventKeywords = [
  'afspraak', 'meeting', 'vergadering', 'overleg', 'gesprek', 'call',
  'lunch', 'diner', 'ontbijt', 'borrel', 'feest', 'verjaardag',
  'dokter', 'tandarts', 'kapper', 'presentatie'
]

// Work keywords
const workKeywords = [
  'werk', 'kantoor', 'project', 'meeting', 'vergadering', 'collega',
  'deadline', 'rapport', 'presentatie', 'klant', 'mail', 'email'
]

export function parseNaturalLanguage(input: string): ParsedInput {
  const text = input.toLowerCase().trim()
  let confidence = 0.5

  // Determine if it's a task or event
  const isEvent = eventKeywords.some(kw => text.includes(kw)) ||
    /om \d{1,2}[.:]\d{2}/.test(text) ||
    /van \d{1,2}[.:]\d{2} tot/.test(text)

  // Determine category
  const isWork = workKeywords.some(kw => text.includes(kw))
  const category: TaskCategory = isWork ? 'work' : 'personal'

  // Extract priority
  let priority: TaskPriority = 'medium'
  for (const [p, keywords] of Object.entries(priorityKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      priority = p as TaskPriority
      confidence += 0.1
      break
    }
  }

  // Extract date/time
  const { date, time, endTime, isAllDay } = extractDateTime(text)

  // Extract location (after "in", "bij", "op locatie")
  const locationMatch = text.match(/(?:in|bij|op|locatie:?)\s+(?:de\s+)?([a-zA-Z\s]+?)(?:\s+om|\s+van|$)/i)
  const location = locationMatch?.[1]?.trim()

  // Extract tags (words after #)
  const tags = text.match(/#(\w+)/g)?.map(t => t.slice(1)) || []

  // Clean title
  let title = cleanTitle(input, date !== null)

  // Build result
  const result: ParsedInput = {
    type: isEvent ? 'event' : 'task',
    title: title || input.slice(0, 100),
    category,
    confidence: Math.min(confidence + 0.2, 1),
  }

  if (isEvent) {
    result.isAllDay = isAllDay
    if (date) {
      result.startDate = time ? setTimeOnDate(date, time) : date
      result.endDate = endTime
        ? setTimeOnDate(date, endTime)
        : new Date(result.startDate.getTime() + 60 * 60 * 1000) // +1 hour default
    }
  } else {
    result.priority = priority
    if (date) {
      result.dueDate = time ? setTimeOnDate(date, time) : date
    }
  }

  if (location && location.length > 2) {
    result.location = capitalizeFirst(location)
  }

  if (tags.length > 0) {
    result.tags = tags
  }

  return result
}

function extractDateTime(text: string): {
  date: Date | null
  time: string | null
  endTime: string | null
  isAllDay: boolean
} {
  const now = new Date()
  let date: Date | null = null
  let time: string | null = null
  let endTime: string | null = null
  let isAllDay = false

  // Today
  if (text.includes('vandaag')) {
    date = startOfDay(now)
  }
  // Tomorrow
  else if (text.includes('morgen')) {
    date = startOfDay(addDays(now, 1))
  }
  // Day after tomorrow
  else if (text.includes('overmorgen')) {
    date = startOfDay(addDays(now, 2))
  }
  // This week
  else if (text.includes('deze week')) {
    date = startOfDay(addDays(now, 3))
  }
  // Next week
  else if (text.includes('volgende week')) {
    date = startOfDay(addWeeks(now, 1))
  }
  // Next month
  else if (text.includes('volgende maand')) {
    date = startOfDay(addMonths(now, 1))
  }
  // Weekend
  else if (text.includes('weekend') || text.includes('dit weekend')) {
    date = nextSaturday(now)
  }

  // Day names
  for (const [day, nextFn] of Object.entries(dayMap)) {
    if (text.includes(day)) {
      date = startOfDay(nextFn(now))
      break
    }
  }

  // Specific date (e.g., "15 januari", "15/01", "15-01")
  const dateMatch = text.match(/(\d{1,2})[\s/-]?(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|\d{1,2})/)
  if (dateMatch) {
    const day = parseInt(dateMatch[1])
    let month: number

    const monthNames: Record<string, number> = {
      januari: 0, februari: 1, maart: 2, april: 3, mei: 4, juni: 5,
      juli: 6, augustus: 7, september: 8, oktober: 9, november: 10, december: 11
    }

    if (monthNames[dateMatch[2]] !== undefined) {
      month = monthNames[dateMatch[2]]
    } else {
      month = parseInt(dateMatch[2]) - 1
    }

    const year = now.getFullYear()
    date = new Date(year, month, day)
    if (date < now) {
      date = new Date(year + 1, month, day)
    }
  }

  // Time extraction (e.g., "om 14:30", "om 2 uur", "14.30")
  const timeMatch = text.match(/om\s+(\d{1,2})[.:]?(\d{2})?\s*(uur)?/i) ||
    text.match(/(\d{1,2})[.:](\d{2})\s*(uur)?/)
  if (timeMatch) {
    const hours = parseInt(timeMatch[1])
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
    time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // Time range (e.g., "van 14:00 tot 15:30")
  const rangeMatch = text.match(/van\s+(\d{1,2})[.:]?(\d{2})?\s*(?:tot|[-–])\s*(\d{1,2})[.:]?(\d{2})?/i)
  if (rangeMatch) {
    const startHours = parseInt(rangeMatch[1])
    const startMins = rangeMatch[2] ? parseInt(rangeMatch[2]) : 0
    time = `${startHours.toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')}`

    const endHours = parseInt(rangeMatch[3])
    const endMins = rangeMatch[4] ? parseInt(rangeMatch[4]) : 0
    endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
  }

  // All day detection
  if (text.includes('hele dag') || text.includes('gehele dag')) {
    isAllDay = true
    time = null
    endTime = null
  }

  return { date, time, endTime, isAllDay }
}

function setTimeOnDate(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  return setMinutes(setHours(date, hours), minutes)
}

function cleanTitle(input: string, hasDate: boolean): string {
  let title = input

  // Remove common filler words at the start
  title = title.replace(/^(ik moet|moet ik|vergeet niet|herinner me|reminder|todo|taak|task)\s*/i, '')

  // Remove date/time references
  const removePatterns = [
    /\b(vandaag|morgen|overmorgen)\b/gi,
    /\b(deze week|volgende week|dit weekend)\b/gi,
    /\b(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\b/gi,
    /om\s+\d{1,2}[.:]\d{2}\s*(uur)?/gi,
    /van\s+\d{1,2}[.:]\d{2}\s*tot\s*\d{1,2}[.:]\d{2}/gi,
    /\b(urgent|dringend|hoog|laag|prioriteit)\b/gi,
    /\b(hele dag|gehele dag)\b/gi,
    /#\w+/g,
  ]

  for (const pattern of removePatterns) {
    title = title.replace(pattern, '')
  }

  // Clean up whitespace and punctuation
  title = title.replace(/\s+/g, ' ').trim()
  title = title.replace(/^[,.\s]+|[,.\s]+$/g, '')

  // Capitalize first letter
  return capitalizeFirst(title)
}

function capitalizeFirst(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Example inputs and expected outputs for testing:
// "Boodschappen doen morgen" -> task, due tomorrow
// "Meeting met Jan volgende week dinsdag om 14:00" -> event, next tuesday 14:00
// "Urgent: rapport afmaken vandaag" -> task, high priority, due today
// "Tandarts afspraak vrijdag om 10:30 in centrum" -> event, friday 10:30, location centrum
// "Bellen met klant #werk" -> task, work category, tag werk
