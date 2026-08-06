import type { ActivityType, ScheduledActivity } from '../store/types';
import { dateKey, parseDateKey, todayKey } from './dates';

export type ScheduledActivityOccurrence = ScheduledActivity & { occurrenceDate: string };

export const ACTIVITY_TYPE_KEYS: Record<
  ActivityType,
  | 'activityType.fieldService'
  | 'activityType.bibleStudy'
  | 'activityType.returnVisit'
  | 'activityType.cart'
  | 'activityType.street'
  | 'activityType.other'
> = {
  field_service: 'activityType.fieldService',
  bible_study: 'activityType.bibleStudy',
  return_visit: 'activityType.returnVisit',
  cart: 'activityType.cart',
  street: 'activityType.street',
  other: 'activityType.other',
};

export interface ActivityColorOption {
  key: string;
  /** Selector-circle swatch, and the card background color — same in both themes. */
  swatch: string;
}

/**
 * Pastel palette users can tag a `ScheduledActivity` with, purely for visual
 * distinction on the Schedule list — no semantic meaning is attached to any
 * particular color.
 */
export const ACTIVITY_COLORS: ActivityColorOption[] = [
  { key: 'green', swatch: '#8FD9A8' },
  { key: 'teal', swatch: '#84D6D6' },
  { key: 'blue', swatch: '#8FBFEA' },
  { key: 'purple', swatch: '#C3A8EF' },
  { key: 'pink', swatch: '#EFA8D0' },
  { key: 'red', swatch: '#EFA0A0' },
  { key: 'orange', swatch: '#F0B67A' },
  { key: 'yellow', swatch: '#F0D264' },
];

export function activityColorOption(key: string | null | undefined): ActivityColorOption | null {
  return ACTIVITY_COLORS.find((c) => c.key === key) ?? null;
}

/** Monday of the week containing `d` (local time), as a fresh Date at midnight. */
export function weekStartOf(d: Date): Date {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const isoDow = (start.getDay() + 6) % 7; // Mon=0..Sun=6
  start.setDate(start.getDate() - isoDow);
  return start;
}

export function currentWeekStart(): Date {
  return weekStartOf(new Date());
}

/** The 7 dates (Mon..Sun) of the week starting at `weekStart`. */
export function weekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function shiftWeek(weekStart: Date, deltaWeeks: number): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + deltaWeeks * 7);
  return d;
}

export function isCurrentWeek(weekStart: Date): boolean {
  return dateKey(weekStart) === dateKey(currentWeekStart());
}

/** e.g. "Week of Aug 4–10, 2026" (or "Aug 4 – Sep 1, 2026" if the week spans two months). */
export function weekRangeLabel(weekStart: Date, locale: string = 'en-US'): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const sameMonth = weekStart.getMonth() === end.getMonth() && weekStart.getFullYear() === end.getFullYear();
  const startLabel = weekStart.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  const endLabel = sameMonth
    ? String(end.getDate())
    : end.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  return `${startLabel}–${endLabel}, ${end.getFullYear()}`;
}

/** Locale-correct short weekday names, Monday-first: ["Mon", "Tue", ..., "Sun"]. */
export function weekdayShortLabels(locale: string = 'en-US'): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  // Jan 5, 1970 was a Monday — used purely as a known week anchor.
  return Array.from({ length: 7 }, (_, i) => {
    const label = fmt.format(new Date(1970, 0, 5 + i));
    return label.charAt(0).toUpperCase() + label.slice(1);
  });
}

/** Whether `activity` occurs on the given "YYYY-MM-DD", accounting for its recurrence rule. */
export function activityOccursOnDate(activity: ScheduledActivity, key: string): boolean {
  if (key === activity.date) return true;
  if (activity.recurring === 'none') return false;
  const anchor = parseDateKey(activity.date);
  const target = parseDateKey(key);
  if (target < anchor) return false;
  const diffDays = Math.round((target.getTime() - anchor.getTime()) / 86_400_000);
  if (activity.recurring === 'weekly') return diffDays % 7 === 0;
  if (activity.recurring === 'biweekly') return diffDays % 14 === 0;
  // monthly: same day-of-month, at least one calendar month later
  return anchor.getDate() === target.getDate();
}

/** Best-effort parse of a free-text time (e.g. "9:00 AM", "14:30") to minutes-since-midnight, for sorting only. Unparseable times sort last. */
export function parseTimeToMinutes(time: string): number {
  const match = time.trim().match(/^(\d{1,2})(?:(:|\.)(\d{2}))?\s*(AM|PM|am|pm)?$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hours = parseInt(match[1], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;
  const meridiem = match[4]?.toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/** Activities occurring on `key`, sorted by (best-effort parsed) time. */
export function activitiesOnDate(activities: ScheduledActivity[], key: string): ScheduledActivity[] {
  return activities
    .filter((a) => activityOccursOnDate(a, key))
    .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
}

/** Every date `activity` occurred on in the `lookbackDays` before (and including) `todayKeyStr`, newest first. */
export function recentActivityOccurrences(
  activity: ScheduledActivity,
  todayKeyStr: string = todayKey(),
  lookbackDays: number = 60
): string[] {
  const today = parseDateKey(todayKeyStr);
  const dates: string[] = [];
  for (let i = 0; i <= lookbackDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    if (activityOccursOnDate(activity, key)) dates.push(key);
  }
  return dates;
}

export function nextActivityOccurrenceDate(activity: ScheduledActivity, fromKey: string = todayKey()): string | null {
  if (activity.recurring === 'none') return activity.date >= fromKey ? activity.date : null;

  const anchor = parseDateKey(activity.date);
  const from = parseDateKey(fromKey);
  if (from <= anchor) return activity.date;

  if (activity.recurring === 'weekly' || activity.recurring === 'biweekly') {
    const intervalDays = activity.recurring === 'weekly' ? 7 : 14;
    const diffDays = Math.round((from.getTime() - anchor.getTime()) / 86_400_000);
    const intervals = Math.ceil(diffDays / intervalDays);
    const next = new Date(anchor);
    next.setDate(next.getDate() + intervals * intervalDays);
    return dateKey(next);
  }

  const dayOfMonth = anchor.getDate();
  const firstMonthOffset = new Date(from.getFullYear(), from.getMonth(), dayOfMonth) < from ? 1 : 0;

  for (let i = 0; i < 240; i += 1) {
    const candidate = new Date(from.getFullYear(), from.getMonth() + firstMonthOffset + i, dayOfMonth);
    if (candidate.getDate() === dayOfMonth) return dateKey(candidate);
  }

  return null;
}

/**
 * Activities linked to `contactId` that are still relevant to look at: either
 * recurring (so they keep happening regardless of their original anchor
 * date) or anchored today or later.
 */
export function upcomingActivitiesForContact(
  activities: ScheduledActivity[],
  contactId: string
): ScheduledActivityOccurrence[] {
  const today = todayKey();
  return activities
    .filter((a) => a.contactId === contactId)
    .map((a) => {
      const occurrenceDate = nextActivityOccurrenceDate(a, today);
      return occurrenceDate ? { ...a, occurrenceDate } : null;
    })
    .filter((a): a is ScheduledActivityOccurrence => Boolean(a))
    .sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate));
}

/**
 * The next `limit` activities from today onward (today included), across all
 * activities regardless of contact — for a compact "what's coming up" list.
 * Sorted by occurrence date, then by (best-effort parsed) time within a date.
 */
export function upcomingActivities(activities: ScheduledActivity[], limit: number): ScheduledActivityOccurrence[] {
  const today = todayKey();
  return activities
    .map((a) => {
      const occurrenceDate = nextActivityOccurrenceDate(a, today);
      return occurrenceDate ? { ...a, occurrenceDate } : null;
    })
    .filter((a): a is ScheduledActivityOccurrence => Boolean(a))
    .sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate) || parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time))
    .slice(0, limit);
}
