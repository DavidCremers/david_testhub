import { addDays, addWeeks, setHours, setMinutes, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday } from 'date-fns';
import { TaskCategory, TaskPriority } from '../types/database';

interface ParsedInput {
  title: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  dateTime?: Date;
  isEvent: boolean;
  isAllDay: boolean;
  location?: string;
}

export function parseVoiceInput(input: string): ParsedInput {
  const lowerInput = input.toLowerCase();
  let title = input;
  let dateTime: Date | undefined;
  let category: TaskCategory | undefined;
  let priority: TaskPriority | undefined;
  let isEvent = false;
  let isAllDay = false;
  let location: string | undefined;

  // Detect if it's an event
  const eventKeywords = ['vergadering', 'meeting', 'afspraak', 'event', 'feest', 'bijeenkomst', 'presentatie', 'lunch', 'diner', 'concert'];
  isEvent = eventKeywords.some(keyword => lowerInput.includes(keyword));

  // Detect category
  if (lowerInput.includes('werk') || lowerInput.includes('kantoor') || lowerInput.includes('office') || lowerInput.includes('klant') || lowerInput.includes('project')) {
    category = 'work';
    title = title.replace(/\b(werk|kantoor|office)\b/gi, '').trim();
  } else if (lowerInput.includes('privé') || lowerInput.includes('prive') || lowerInput.includes('thuis') || lowerInput.includes('persoonlijk')) {
    category = 'personal';
    title = title.replace(/\b(privé|prive|thuis|persoonlijk)\b/gi, '').trim();
  }

  // Detect priority
  if (lowerInput.includes('urgent') || lowerInput.includes('spoed') || lowerInput.includes('asap') || lowerInput.includes('direct')) {
    priority = 'urgent';
    title = title.replace(/\b(urgent|spoed|asap|direct)\b/gi, '').trim();
  } else if (lowerInput.includes('belangrijk') || lowerInput.includes('hoge prioriteit') || lowerInput.includes('high priority')) {
    priority = 'high';
    title = title.replace(/\b(belangrijk|hoge prioriteit|high priority)\b/gi, '').trim();
  } else if (lowerInput.includes('lage prioriteit') || lowerInput.includes('low priority') || lowerInput.includes('niet belangrijk')) {
    priority = 'low';
    title = title.replace(/\b(lage prioriteit|low priority|niet belangrijk)\b/gi, '').trim();
  }

  // Parse date/time
  const now = new Date();

  // Time patterns
  const timeMatch = lowerInput.match(/om\s*(\d{1,2})(?::(\d{2}))?\s*(uur)?/i);
  let hours = 9;
  let minutes = 0;

  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    title = title.replace(/om\s*\d{1,2}(?::\d{2})?\s*uur?/gi, '').trim();
  }

  // Date patterns
  if (lowerInput.includes('vandaag')) {
    dateTime = setMinutes(setHours(now, hours), minutes);
    title = title.replace(/vandaag/gi, '').trim();
  } else if (lowerInput.includes('morgen')) {
    dateTime = setMinutes(setHours(addDays(now, 1), hours), minutes);
    title = title.replace(/morgen/gi, '').trim();
  } else if (lowerInput.includes('overmorgen')) {
    dateTime = setMinutes(setHours(addDays(now, 2), hours), minutes);
    title = title.replace(/overmorgen/gi, '').trim();
  } else if (lowerInput.includes('volgende week')) {
    const weekdayMatch = lowerInput.match(/volgende week\s*(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)?/i);
    if (weekdayMatch && weekdayMatch[1]) {
      const weekday = weekdayMatch[1].toLowerCase();
      const weekdayFunctions: Record<string, (date: Date) => Date> = {
        'maandag': nextMonday,
        'dinsdag': nextTuesday,
        'woensdag': nextWednesday,
        'donderdag': nextThursday,
        'vrijdag': nextFriday,
        'zaterdag': nextSaturday,
        'zondag': nextSunday,
      };
      const nextDay = weekdayFunctions[weekday](addDays(now, 7));
      dateTime = setMinutes(setHours(nextDay, hours), minutes);
    } else {
      dateTime = setMinutes(setHours(addWeeks(now, 1), hours), minutes);
    }
    title = title.replace(/volgende week\s*(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)?/gi, '').trim();
  } else if (lowerInput.includes('dit weekend')) {
    dateTime = setMinutes(setHours(nextSaturday(now), hours), minutes);
    title = title.replace(/dit weekend/gi, '').trim();
  } else if (lowerInput.includes('vrijdag')) {
    dateTime = setMinutes(setHours(nextFriday(now), hours), minutes);
    title = title.replace(/vrijdag/gi, '').trim();
  } else if (lowerInput.includes('maandag')) {
    dateTime = setMinutes(setHours(nextMonday(now), hours), minutes);
    title = title.replace(/maandag/gi, '').trim();
  } else if (lowerInput.includes('dinsdag')) {
    dateTime = setMinutes(setHours(nextTuesday(now), hours), minutes);
    title = title.replace(/dinsdag/gi, '').trim();
  } else if (lowerInput.includes('woensdag')) {
    dateTime = setMinutes(setHours(nextWednesday(now), hours), minutes);
    title = title.replace(/woensdag/gi, '').trim();
  } else if (lowerInput.includes('donderdag')) {
    dateTime = setMinutes(setHours(nextThursday(now), hours), minutes);
    title = title.replace(/donderdag/gi, '').trim();
  } else if (lowerInput.includes('zaterdag')) {
    dateTime = setMinutes(setHours(nextSaturday(now), hours), minutes);
    title = title.replace(/zaterdag/gi, '').trim();
  } else if (lowerInput.includes('zondag')) {
    dateTime = setMinutes(setHours(nextSunday(now), hours), minutes);
    title = title.replace(/zondag/gi, '').trim();
  }

  // Detect all-day
  if (lowerInput.includes('hele dag') || lowerInput.includes('all day')) {
    isAllDay = true;
    title = title.replace(/hele dag|all day/gi, '').trim();
  }

  // Extract location (after "in" or "bij" or "op")
  const locationMatch = lowerInput.match(/(?:in|bij|op)\s+(?:de\s+)?([a-zA-Z\s]+?)(?:\s+om|\s+morgen|\s+volgende|$)/i);
  if (locationMatch && isEvent) {
    const possibleLocation = locationMatch[1].trim();
    // Only set location if it looks like a place, not a time reference
    if (possibleLocation.length > 2 && !['de', 'het', 'een'].includes(possibleLocation)) {
      location = possibleLocation;
    }
  }

  // Clean up title
  title = title
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim();

  // Capitalize first letter
  if (title) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return {
    title: title || 'Nieuwe taak',
    category,
    priority,
    dateTime,
    isEvent,
    isAllDay,
    location,
  };
}
