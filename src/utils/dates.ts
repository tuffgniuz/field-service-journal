import i18next from 'i18next';

const pad2 = (n: number) => String(n).padStart(2, '0');

/** "YYYY-MM-DD" for a Date, in local time. */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

/** "YYYY-MM" for a Date, in local time. */
export function monthKeyOf(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

export function currentMonthKey(): string {
  return monthKeyOf(new Date());
}

/** Parses a "YYYY-MM" month key back to a Date (the 1st of that month), local time. */
export function parseMonthKey(key: string): Date {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1);
}

/** Returns the Date for the 1st of the month `offset` months from the current month (0 = this month). */
export function monthByOffset(offset: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + offset, 1);
}

/** Returns the "YYYY-MM" key for the month right after the given one. */
export function nextMonthKey(key: string): string {
  const d = parseMonthKey(key);
  return monthKeyOf(new Date(d.getFullYear(), d.getMonth() + 1, 1));
}

/** Returns the "YYYY-MM" key for the month right before the given one. */
export function previousMonthKey(key: string): string {
  const d = parseMonthKey(key);
  return monthKeyOf(new Date(d.getFullYear(), d.getMonth() - 1, 1));
}

export function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

export function monthLabel(d: Date, locale: string = 'en-US'): string {
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export function monthShortLabel(d: Date, locale: string = 'en-US'): string {
  return d.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
}

/** Locale-correct abbreviated month name without a year, e.g. "Aug". */
export function monthAbbrevLabel(d: Date, locale: string = 'en-US'): string {
  const label = d.toLocaleDateString(locale, { month: 'short' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Locale-correct narrow weekday initials (Sun...Sat), e.g. S M T W T F S in English, Z M D W D V Z in Dutch. */
export function weekdayLabels(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
  // Jan 4, 1970 was a Sunday — used purely as a known week anchor.
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(1970, 0, 4 + i)));
}

export function parseDateKey(key: string): Date {
  if (!key || typeof key !== 'string') return new Date();
  if (key.includes('T')) {
    return new Date(key);
  }
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatShortDate(key: string, locale: string = 'en-US', includeYear: boolean = true): string {
  return parseDateKey(key).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
}

export function daysSince(key: string): number {
  const then = parseDateKey(key);
  const now = new Date();
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((startOfNow.getTime() - then.getTime()) / 86400000);
}

/**
 * The JW "service year" runs September 1 – August 31 and is labeled by the
 * year it ends in (e.g. Sep 2025 – Aug 2026 is "service year 2026"; the next
 * one, starting Sep 1 2026, is "service year 2027").
 */
export function serviceYearLabel(d: Date): number {
  return d.getMonth() >= 8 ? d.getFullYear() + 1 : d.getFullYear();
}

export function currentServiceYearLabel(): number {
  return serviceYearLabel(new Date());
}

/** Start (inclusive) and end (exclusive) dates spanning the given service year label. */
export function serviceYearRange(label: number): { start: Date; end: Date } {
  return { start: new Date(label - 1, 8, 1), end: new Date(label, 8, 1) };
}

export function formatRelativeTime(dateStr: string, locale: string = 'en-US'): string {
  // Check if it's a pure date without time (length 10 like "YYYY-MM-DD")
  const isPureDate = dateStr.length === 10 && dateStr.includes('-') && !dateStr.includes('T');

  let days = 0;
  if (isPureDate) {
    const today = todayKey();
    if (dateStr === today) {
      return i18next.t('dates.today', { defaultValue: 'Today' });
    }

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = dateKey(yesterdayDate);
    if (dateStr === yesterday) {
      return i18next.t('dates.yesterday', { defaultValue: 'Yesterday' });
    }

    // Calculate daysSince
    days = daysSince(dateStr);
  } else {
    // It's a full timestamp (ISO string with time)
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // If the date is in the future or extremely close to now
    if (diffMs < 60000) {
      return i18next.t('dates.now', { defaultValue: 'now' });
    }

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
      return i18next.t('dates.minutesAgo', { count: diffMins, defaultValue: `${diffMins} minutes ago` });
    }

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return i18next.t('dates.hoursAgo', { count: diffHours, defaultValue: `${diffHours} hours ago` });
    }

    // More than 24 hours: fallback to days calculation
    const pureDatePart = dateStr.slice(0, 10);
    days = daysSince(pureDatePart);
  }

  // Handle day-based scales (Yesterday is handled above for pure date, but let's handle 1 day for ISO dates too)
  if (days === 1) {
    return i18next.t('dates.yesterday', { defaultValue: 'Yesterday' });
  }

  if (days < 7) {
    return i18next.t('dates.daysAgo', { count: days, defaultValue: `${days} days ago` });
  }

  // Handle weeks
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return i18next.t('dates.weeksAgo', { count: weeks, defaultValue: `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago` });
  }

  // Handle months
  if (days < 365) {
    const months = Math.floor(days / 30);
    return i18next.t('dates.monthsAgo', { count: months, defaultValue: `${months} ${months === 1 ? 'month' : 'months'} ago` });
  }

  // Handle years
  const years = Math.floor(days / 365);
  return i18next.t('dates.yearsAgo', { count: years, defaultValue: `${years} ${years === 1 ? 'year' : 'years'} ago` });
}
