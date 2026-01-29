import {
  format,
  formatRelative,
  isToday,
  isTomorrow,
  isYesterday,
  isThisWeek,
  isThisYear,
  addDays,
  addWeeks,
  addMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isBefore,
  isAfter,
  isSameDay,
} from 'date-fns';
import { nl } from 'date-fns/locale';

// Default locale for Dutch
const defaultLocale = nl;

/**
 * Format a date for display in the UI
 */
export function formatDate(date: Date | string, formatStr?: string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;

  if (formatStr) {
    return format(d, formatStr, { locale: defaultLocale });
  }

  if (isToday(d)) {
    return 'Vandaag';
  }
  if (isTomorrow(d)) {
    return 'Morgen';
  }
  if (isYesterday(d)) {
    return 'Gisteren';
  }
  if (isThisWeek(d)) {
    return format(d, 'EEEE', { locale: defaultLocale });
  }
  if (isThisYear(d)) {
    return format(d, 'd MMMM', { locale: defaultLocale });
  }
  return format(d, 'd MMMM yyyy', { locale: defaultLocale });
}

/**
 * Format a time for display
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm', { locale: defaultLocale });
}

/**
 * Format a date and time together
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return `${formatDate(d)} ${formatTime(d)}`;
}

/**
 * Format a relative date (e.g., "over 2 dagen")
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatRelative(d, new Date(), { locale: defaultLocale });
}

/**
 * Get a human-readable deadline string
 */
export function formatDeadline(deadline: Date | string): { text: string; isOverdue: boolean; urgency: 'overdue' | 'urgent' | 'soon' | 'normal' } {
  const d = typeof deadline === 'string' ? parseISO(deadline) : deadline;
  const now = new Date();
  const daysDiff = differenceInDays(d, now);

  if (isBefore(d, now) && !isSameDay(d, now)) {
    return {
      text: `${Math.abs(daysDiff)} ${Math.abs(daysDiff) === 1 ? 'dag' : 'dagen'} te laat`,
      isOverdue: true,
      urgency: 'overdue',
    };
  }

  if (isToday(d)) {
    return { text: 'Vandaag', isOverdue: false, urgency: 'urgent' };
  }

  if (isTomorrow(d)) {
    return { text: 'Morgen', isOverdue: false, urgency: 'urgent' };
  }

  if (daysDiff <= 7) {
    return { text: formatDate(d), isOverdue: false, urgency: 'soon' };
  }

  return { text: formatDate(d), isOverdue: false, urgency: 'normal' };
}

/**
 * Parse Dutch natural language date references
 */
export function parseDutchDateReference(text: string, referenceDate = new Date()): Date | null {
  const lowerText = text.toLowerCase().trim();

  // Direct references
  if (lowerText === 'vandaag') {
    return startOfDay(referenceDate);
  }
  if (lowerText === 'morgen') {
    return startOfDay(addDays(referenceDate, 1));
  }
  if (lowerText === 'overmorgen') {
    return startOfDay(addDays(referenceDate, 2));
  }

  // "volgende week" patterns
  if (lowerText.includes('volgende week')) {
    const dayMatch = lowerText.match(/volgende week\s*(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)?/);
    if (dayMatch) {
      const dayName = dayMatch[1];
      const nextWeekStart = addWeeks(startOfWeek(referenceDate, { weekStartsOn: 1 }), 1);
      if (!dayName) {
        return nextWeekStart;
      }
      const dayIndex = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'].indexOf(dayName);
      return addDays(nextWeekStart, dayIndex);
    }
  }

  // "over X dagen/weken/maanden"
  const overMatch = lowerText.match(/over\s+(\d+)\s+(dag|dagen|week|weken|maand|maanden)/);
  if (overMatch) {
    const amount = parseInt(overMatch[1], 10);
    const unit = overMatch[2];
    if (unit.startsWith('dag')) {
      return addDays(referenceDate, amount);
    }
    if (unit.startsWith('week') || unit.startsWith('weken')) {
      return addWeeks(referenceDate, amount);
    }
    if (unit.startsWith('maand')) {
      return addMonths(referenceDate, amount);
    }
  }

  // Day names (coming up this week)
  const dayNames = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  const dayIndex = dayNames.indexOf(lowerText);
  if (dayIndex !== -1) {
    const currentDayIndex = referenceDate.getDay();
    let daysToAdd = dayIndex - currentDayIndex;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    return addDays(referenceDate, daysToAdd);
  }

  return null;
}

/**
 * Parse a time string (e.g., "14:00", "2:30")
 */
export function parseTimeString(text: string): { hours: number; minutes: number } | null {
  const match = text.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes };
    }
  }

  // Also try "14u" or "14 uur" format
  const hourMatch = text.match(/(\d{1,2})\s*(u|uur)/);
  if (hourMatch) {
    const hours = parseInt(hourMatch[1], 10);
    if (hours >= 0 && hours <= 23) {
      return { hours, minutes: 0 };
    }
  }

  return null;
}

export {
  isToday,
  isTomorrow,
  isYesterday,
  isThisWeek,
  isThisYear,
  isBefore,
  isAfter,
  isSameDay,
  addDays,
  addWeeks,
  addMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
};
