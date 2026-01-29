import { RRule, Frequency, Weekday } from 'rrule';
import type { RecurrenceInfo } from '../types/parser';

/**
 * Convert RecurrenceInfo to RRULE string
 */
export function createRRule(info: RecurrenceInfo): string {
  const options: Partial<RRule.Options> = {
    freq: frequencyToRRule(info.frequency),
    interval: info.interval || 1,
  };

  if (info.daysOfWeek && info.daysOfWeek.length > 0) {
    options.byweekday = info.daysOfWeek.map(dayToRRuleWeekday);
  }

  if (info.endDate) {
    options.until = info.endDate;
  }

  if (info.count) {
    options.count = info.count;
  }

  const rule = new RRule(options);
  return rule.toString();
}

/**
 * Parse RRULE string to RecurrenceInfo
 */
export function parseRRule(rruleString: string): RecurrenceInfo | null {
  try {
    const rule = RRule.fromString(rruleString);
    const options = rule.options;

    return {
      frequency: rruleToFrequency(options.freq),
      interval: options.interval,
      daysOfWeek: options.byweekday?.map((w) => {
        if (typeof w === 'number') return w;
        return w.weekday;
      }),
      endDate: options.until || undefined,
      count: options.count || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Get next occurrences of a recurring item
 */
export function getNextOccurrences(
  rruleString: string,
  startDate: Date,
  count: number = 10,
  afterDate?: Date
): Date[] {
  try {
    const rule = RRule.fromString(rruleString);
    const after = afterDate || new Date();
    return rule.between(after, new Date(after.getTime() + 365 * 24 * 60 * 60 * 1000), true).slice(0, count);
  } catch {
    return [];
  }
}

/**
 * Get human-readable description of recurrence
 */
export function describeRecurrence(rruleString: string): string {
  try {
    const rule = RRule.fromString(rruleString);
    const options = rule.options;

    const frequencyNames: Record<Frequency, string> = {
      [Frequency.DAILY]: 'dag',
      [Frequency.WEEKLY]: 'week',
      [Frequency.MONTHLY]: 'maand',
      [Frequency.YEARLY]: 'jaar',
      [Frequency.HOURLY]: 'uur',
      [Frequency.MINUTELY]: 'minuut',
      [Frequency.SECONDLY]: 'seconde',
    };

    const dayNames = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

    let description = 'Elke ';

    if (options.interval && options.interval > 1) {
      description += `${options.interval} ${frequencyNames[options.freq]}en`;
    } else {
      description += frequencyNames[options.freq];
    }

    if (options.byweekday && options.byweekday.length > 0) {
      const days = options.byweekday.map((w) => {
        const dayIndex = typeof w === 'number' ? w : w.weekday;
        return dayNames[dayIndex];
      });
      description += ` op ${days.join(', ')}`;
    }

    if (options.until) {
      description += ` tot ${options.until.toLocaleDateString('nl-NL')}`;
    }

    if (options.count) {
      description += ` (${options.count} keer)`;
    }

    return description;
  } catch {
    return 'Herhalend';
  }
}

/**
 * Parse Dutch recurrence text
 */
export function parseDutchRecurrence(text: string): RecurrenceInfo | null {
  const lowerText = text.toLowerCase();

  // "elke dag" / "dagelijks"
  if (lowerText.includes('elke dag') || lowerText.includes('dagelijks')) {
    return { frequency: 'daily' };
  }

  // "elke week" / "wekelijks"
  if (lowerText.includes('elke week') || lowerText.includes('wekelijks')) {
    return { frequency: 'weekly' };
  }

  // "elke maand" / "maandelijks"
  if (lowerText.includes('elke maand') || lowerText.includes('maandelijks')) {
    return { frequency: 'monthly' };
  }

  // "elk jaar" / "jaarlijks"
  if (lowerText.includes('elk jaar') || lowerText.includes('jaarlijks')) {
    return { frequency: 'yearly' };
  }

  // "elke X weken/dagen/maanden"
  const intervalMatch = lowerText.match(/elke\s+(\d+)\s+(dagen?|weken?|maanden?)/);
  if (intervalMatch) {
    const interval = parseInt(intervalMatch[1], 10);
    const unit = intervalMatch[2];

    if (unit.startsWith('dag')) {
      return { frequency: 'daily', interval };
    }
    if (unit.startsWith('week')) {
      return { frequency: 'weekly', interval };
    }
    if (unit.startsWith('maand')) {
      return { frequency: 'monthly', interval };
    }
  }

  // "elke maandag" / "elke dinsdag" etc.
  const dayNames = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  const dayMatch = lowerText.match(/elke\s+(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)/);
  if (dayMatch) {
    const dayIndex = dayNames.indexOf(dayMatch[1]);
    return {
      frequency: 'weekly',
      daysOfWeek: [dayIndex],
    };
  }

  return null;
}

// Helper functions
function frequencyToRRule(freq: RecurrenceInfo['frequency']): Frequency {
  const map: Record<RecurrenceInfo['frequency'], Frequency> = {
    daily: Frequency.DAILY,
    weekly: Frequency.WEEKLY,
    monthly: Frequency.MONTHLY,
    yearly: Frequency.YEARLY,
  };
  return map[freq];
}

function rruleToFrequency(freq: Frequency): RecurrenceInfo['frequency'] {
  const map: Partial<Record<Frequency, RecurrenceInfo['frequency']>> = {
    [Frequency.DAILY]: 'daily',
    [Frequency.WEEKLY]: 'weekly',
    [Frequency.MONTHLY]: 'monthly',
    [Frequency.YEARLY]: 'yearly',
  };
  return map[freq] || 'daily';
}

function dayToRRuleWeekday(day: number): Weekday {
  const weekdays = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
  return weekdays[day];
}
