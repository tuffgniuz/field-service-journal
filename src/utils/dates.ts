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

export function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

export function monthLabel(d: Date, locale: string = 'en-US'): string {
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export function monthShortLabel(d: Date, locale: string = 'en-US'): string {
  return d.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
}

/** Locale-correct narrow weekday initials (Sun...Sat), e.g. S M T W T F S in English, Z M D W D V Z in Dutch. */
export function weekdayLabels(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
  // Jan 4, 1970 was a Sunday — used purely as a known week anchor.
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(1970, 0, 4 + i)));
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatShortDate(key: string, locale: string = 'en-US'): string {
  return parseDateKey(key).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

export function daysSince(key: string): number {
  const then = parseDateKey(key);
  const now = new Date();
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((startOfNow.getTime() - then.getTime()) / 86400000);
}

export function isSameMonth(key: string, monthKey: string): boolean {
  return key.slice(0, 7) === monthKey;
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
