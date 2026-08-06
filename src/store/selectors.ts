import type { ActivityType, AppState, Contact, ContactStatus } from './types';
import {
  currentMonthKey,
  currentServiceYearLabel,
  dateKey,
  daysInMonth,
  daysSince,
  monthAbbrevLabel,
  monthByOffset,
  monthKeyOf,
  nextMonthKey,
  parseDateKey,
  parseMonthKey,
  serviceYearRange,
  todayKey,
} from '../utils/dates';
import { parseTimeToMinutes, recentActivityOccurrences } from '../utils/schedule';

/**
 * The month the Report screen should show and report on. Normally the current
 * calendar month, but it stays pinned to the month right after
 * `lastReportedMonth` until the user explicitly confirms that one was sent —
 * so a report that falls behind doesn't silently get skipped by the calendar
 * moving on.
 */
export function pendingReportMonth(state: AppState, nowMs: number = Date.now()): string {
  const current = monthKeyOf(new Date(nowMs));
  if (!state.lastReportedMonth) return current;
  const next = nextMonthKey(state.lastReportedMonth);
  return next > current ? current : next;
}

/** Whether the report screen is stuck on a past month awaiting confirmation, rather than the current one. */
export function isReportOverdue(state: AppState, nowMs: number = Date.now()): boolean {
  return pendingReportMonth(state, nowMs) !== monthKeyOf(new Date(nowMs));
}

/** "Shared in the ministry" for a given month, defaulting to true until explicitly toggled off. */
export function participatedFor(state: AppState, monthKey: string): boolean {
  return state.monthlyParticipation[monthKey] ?? true;
}

/** Hours credited per month for an enabled family Bible study (1 hour/week). */
export const FAMILY_BIBLE_STUDY_MONTHLY_HOURS = 4;

/** Upper bound on `creditHoursAmount`. */
export const MAX_CREDIT_HOURS = 55;

/**
 * Family-study + custom credit hours, as configured right now. There's no
 * per-month history for these settings (unlike `dailyLogs`), so this is
 * intentionally only ever added to the *current* calendar month/service
 * year — never retroactively to past months a user might review in History.
 */
export function creditHoursForCurrentMonth(state: AppState): number {
  let total = 0;
  if (state.familyBibleStudy.enabled) total += FAMILY_BIBLE_STUDY_MONTHLY_HOURS;
  if (state.creditHoursEnabled) total += Math.min(Math.max(0, state.creditHoursAmount), MAX_CREDIT_HOURS);
  return Math.round(total * 100) / 100;
}

export function liveTodayHours(state: AppState, nowMs: number = Date.now()): number {
  const base = state.dailyLogs[todayKey()] || 0;
  if (!state.timerStartedAt) return base;
  const elapsedH = Math.max(0, (nowMs - state.timerStartedAt) / 3_600_000);
  return Math.round((base + elapsedH) * 100) / 100;
}

export function monthHoursFor(state: AppState, monthKey: string, nowMs: number = Date.now()): number {
  let sum = 0;
  for (const [key, hours] of Object.entries(state.dailyLogs)) {
    if (key.slice(0, 7) === monthKey) sum += hours;
  }
  if (monthKey === currentMonthKey() && state.timerStartedAt) {
    sum += Math.max(0, (nowMs - state.timerStartedAt) / 3_600_000);
  }
  if (monthKey === currentMonthKey()) {
    sum += creditHoursForCurrentMonth(state);
  }
  return Math.round(sum * 100) / 100;
}

export interface ReportHoursCalculation {
  loggedHours: number;      // raw hours logged in this month (including active timer)
  rolloverFromPrev: number; // hours rolled over from the previous month
  totalAccumulated: number; // loggedHours + rolloverFromPrev
  reportHours: number;      // Math.floor(totalAccumulated)
  remainder: number;        // totalAccumulated - reportHours
}

export function calculateReportHours(
  state: AppState,
  targetMonthKey: string,
  nowMs: number = Date.now()
): ReportHoursCalculation {
  // Find all date keys from dailyLogs
  const dates = Object.keys(state.dailyLogs).filter((k) => k.slice(0, 7) <= targetMonthKey).sort();

  // If no logs, but target is current month, we might have active timer
  if (dates.length === 0) {
    let logged = 0;
    if (targetMonthKey === currentMonthKey() && state.timerStartedAt) {
      logged = Math.max(0, (nowMs - state.timerStartedAt) / 3_600_000);
    }
    if (targetMonthKey === currentMonthKey()) {
      logged += creditHoursForCurrentMonth(state);
    }
    const totalAccumulated = Math.round(logged * 100) / 100;
    const reportHours = Math.floor(totalAccumulated);
    const remainder = Math.round((totalAccumulated - reportHours) * 100) / 100;
    return {
      loggedHours: totalAccumulated,
      rolloverFromPrev: 0,
      totalAccumulated,
      reportHours,
      remainder,
    };
  }

  const firstMonthKey = dates[0].slice(0, 7);

  // Generate chronological list of month keys from firstMonthKey to targetMonthKey
  const monthKeys: string[] = [];
  let current = parseMonthKey(firstMonthKey);
  const target = parseMonthKey(targetMonthKey);

  while (current <= target) {
    monthKeys.push(monthKeyOf(current));
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  let rollover = 0;
  let loggedHours = 0;
  let totalAccumulated = 0;
  let reportHours = 0;
  let remainder = 0;

  for (const mk of monthKeys) {
    // Calculate raw logged hours for this month
    let rawSum = 0;
    for (const [key, hours] of Object.entries(state.dailyLogs)) {
      if (key.slice(0, 7) === mk) rawSum += hours;
    }
    if (mk === currentMonthKey() && state.timerStartedAt) {
      rawSum += Math.max(0, (nowMs - state.timerStartedAt) / 3_600_000);
    }
    if (mk === currentMonthKey()) {
      rawSum += creditHoursForCurrentMonth(state);
    }
    rawSum = Math.round(rawSum * 100) / 100;

    loggedHours = rawSum;
    totalAccumulated = Math.round((rawSum + rollover) * 100) / 100;
    reportHours = Math.floor(totalAccumulated);
    remainder = Math.round((totalAccumulated - reportHours) * 100) / 100;

    // The remainder carries to the next month
    rollover = remainder;
  }

  return {
    loggedHours,
    rolloverFromPrev: Math.round((totalAccumulated - loggedHours) * 100) / 100,
    totalAccumulated,
    reportHours,
    remainder,
  };
}

export function currentMonthHours(state: AppState, nowMs: number = Date.now()): number {
  return monthHoursFor(state, currentMonthKey(), nowMs);
}

/** Sum of logged hours within the given service year (label = the year it ends in), including the live timer if it's running today and this is the current service year. */
export function serviceYearHoursFor(state: AppState, label: number, nowMs: number = Date.now()): number {
  const { start, end } = serviceYearRange(label);
  let sum = 0;
  for (const [key, hours] of Object.entries(state.dailyLogs)) {
    const d = parseDateKey(key);
    if (d >= start && d < end) sum += hours;
  }
  if (label === currentServiceYearLabel() && state.timerStartedAt) {
    sum += Math.max(0, (nowMs - state.timerStartedAt) / 3_600_000);
  }
  if (label === currentServiceYearLabel()) {
    sum += creditHoursForCurrentMonth(state);
  }
  return Math.round(sum * 100) / 100;
}

export const STUDY_STATUSES: ContactStatus[] = ['bible_study'];

export function studiesForMonth(state: AppState, monthKey: string): number {
  return state.contacts.filter(
    (c) => STUDY_STATUSES.includes(c.status) && c.visits.some((v) => v.date.slice(0, 7) === monthKey)
  ).length;
}

export function lastVisitOf(c: Contact) {
  return c.visits.length ? c.visits[c.visits.length - 1] : null;
}

export function sortedContacts(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => {
    const la = lastVisitOf(a);
    const lb = lastVisitOf(b);
    const da = la ? daysSince(la.date) : Infinity;
    const db = lb ? daysSince(lb.date) : Infinity;
    return db - da;
  });
}

/** Contacts eligible to "log a Bible study" against — bible_study status — most recently visited first. */
export function studyContacts(contacts: Contact[]): Contact[] {
  return sortedContacts(contacts.filter((c) => STUDY_STATUSES.includes(c.status)));
}

export interface RecentVisit {
  contactId: string;
  contactName: string;
  status: ContactStatus;
  visitId: string;
  date: string;
  covered: string;
}

/** The most recent visits across every contact, newest first. */
export function recentVisits(contacts: Contact[], limit: number): RecentVisit[] {
  const all: RecentVisit[] = [];
  for (const c of contacts) {
    for (const v of c.visits) {
      all.push({ contactId: c.id, contactName: c.name, status: c.status, visitId: v.id, date: v.date, covered: v.covered });
    }
  }
  all.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return all.slice(0, limit);
}

export type RecentActivityKind = ActivityType | 'meeting' | 'hours';

export interface RecentActivityEntry {
  id: string;
  kind: RecentActivityKind;
  /** Set for visits and contact-linked scheduled activities (Bible study / return visit), null otherwise. */
  contactName: string | null;
  /** "YYYY-MM-DD", or an ISO timestamp for a visit logged today. */
  date: string;
  durationMinutes: number | null;
  /** Key into `ACTIVITY_COLORS` (utils/schedule.ts), or null for no color. */
  color: string | null;
}

/**
 * A merged, most-recent-first feed of things the user actually did — as
 * opposed to the Schedule tab, which only shows planned/upcoming activity.
 * Pulled from logged visits, meeting-for-field-service attendance marks, and
 * past occurrences of every scheduled activity (Bible study, return visit,
 * field service, cart/street witnessing, other) — every type, since a
 * scheduled activity is proof of what happened regardless of whether it also
 * has a matching Visit record.
 *
 * Plain logged hours (the Log tab's +/- stepper and timer) fill in as a
 * generic "Field service hours" entry only on days that have no
 * visit/meeting/activity of their own — once a specific activity explains a
 * day's hours, the generic entry would just be a redundant duplicate of it.
 */
export function recentActivityEntries(state: AppState, limit: number, nowMs: number = Date.now()): RecentActivityEntry[] {
  const entries: RecentActivityEntry[] = [];
  const explainedDates = new Set<string>();
  const todayKeyStr = dateKey(new Date(nowMs));
  const markExplained = (date: string) => explainedDates.add(dateKey(parseDateKey(date)));

  for (const c of state.contacts) {
    for (const v of c.visits) {
      entries.push({
        id: `visit-${v.id}`,
        kind: c.status,
        contactName: c.name,
        date: v.date,
        durationMinutes: null,
        color: null,
      });
      markExplained(v.date);
    }
  }

  for (const [dk, attended] of Object.entries(state.meetingAttendance)) {
    if (!attended || dk > todayKeyStr) continue;
    entries.push({
      id: `meeting-${dk}`,
      kind: 'meeting',
      contactName: null,
      date: dk,
      durationMinutes: null,
      color: state.meetingColor,
    });
    markExplained(dk);
  }

  for (const activity of state.scheduledActivities) {
    const durationMinutes =
      activity.endTime && activity.time
        ? Math.max(0, parseTimeToMinutes(activity.endTime) - parseTimeToMinutes(activity.time))
        : null;
    const contactName = activity.contactId ? state.contacts.find((c) => c.id === activity.contactId)?.name ?? null : null;
    for (const occurrenceDate of recentActivityOccurrences(activity, todayKeyStr)) {
      entries.push({
        id: `activity-${activity.id}-${occurrenceDate}`,
        kind: activity.type,
        contactName,
        date: occurrenceDate,
        durationMinutes,
        color: activity.color,
      });
      markExplained(occurrenceDate);
    }
  }

  for (const [dk, hours] of Object.entries(state.dailyLogs)) {
    if (!hours || hours <= 0 || explainedDates.has(dk)) continue;
    entries.push({
      id: `hours-${dk}`,
      kind: 'hours',
      contactName: null,
      date: dk,
      durationMinutes: Math.round(hours * 60),
      color: null,
    });
  }

  entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return entries.slice(0, limit);
}

export interface ChartDay {
  day: number;
  hours: number;
  isToday: boolean;
  tickLabel: string;
}

export interface ChartMonth {
  label: string;
  monthKey: string;
  year: number;
  month0: number;
  days: ChartDay[];
  avg: number;
  isCurrent: boolean;
}

export function buildChartMonth(
  state: AppState,
  offset: number,
  locale: string = 'en-US',
  nowMs: number = Date.now()
): ChartMonth {
  const anchor = monthByOffset(offset);
  const year = anchor.getFullYear();
  const month0 = anchor.getMonth();
  const monthKey = monthKeyOf(anchor);
  const isCurrent = monthKey === currentMonthKey();
  const totalDays = daysInMonth(year, month0);
  const now = new Date(nowMs);
  const todayDate = isCurrent ? now.getDate() : -1;

  const days: ChartDay[] = [];
  for (let day = 1; day <= totalDays; day++) {
    const key = `${year}-${String(month0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    let hours = state.dailyLogs[key] || 0;
    const isToday = day === todayDate;
    if (isToday && state.timerStartedAt) {
      hours += Math.max(0, (nowMs - state.timerStartedAt) / 3_600_000);
    }
    days.push({
      day,
      hours: Math.round(hours * 100) / 100,
      isToday,
      tickLabel: day === 1 || day === 10 || day === 20 || day === totalDays ? String(day) : '',
    });
  }

  const daysElapsed = isCurrent ? now.getDate() : totalDays;
  let sum = 0;
  for (let i = 0; i < daysElapsed; i++) sum += days[i]?.hours || 0;
  const avg = daysElapsed ? sum / daysElapsed : 0;

  return {
    label: anchor.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
    monthKey,
    year,
    month0,
    days,
    avg,
    isCurrent,
  };
}

export interface HistoryMonth {
  monthKey: string;
  label: string;
  hours: number;
  studies: number;
  participated: boolean;
}

export function historyMonths(state: AppState, locale: string = 'en-US', maxMonths: number = 24): HistoryMonth[] {
  const out: HistoryMonth[] = [];
  for (let offset = -1; offset >= -maxMonths; offset--) {
    const anchor = monthByOffset(offset);
    const monthKey = monthKeyOf(anchor);
    const calc = calculateReportHours(state, monthKey);
    const hours = calc.reportHours;
    const studies = studiesForMonth(state, monthKey);
    const hasParticipationRecord = monthKey in state.monthlyParticipation;
    const rawHours = monthHoursFor(state, monthKey);
    if (rawHours === 0 && studies === 0 && !hasParticipationRecord) continue;
    out.push({
      monthKey,
      label: anchor.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
      hours,
      studies,
      participated: hasParticipationRecord ? state.monthlyParticipation[monthKey] : false,
    });
  }
  return out;
}

export interface ContributionDay {
  dateKey: string;
  hours: number;
  isToday: boolean;
  /** False for the padding days before Sep 1 / after Aug 31 needed to complete the first/last week column. */
  inRange: boolean;
}

export interface ContributionWeek {
  /** Always 7 entries, Monday through Sunday. */
  days: ContributionDay[];
  /** Set on the week column containing the 1st of a month, so the label can be drawn above that column — null otherwise. */
  monthLabel: string | null;
  isCurrentMonth: boolean;
}

/**
 * A continuous Monday-Sunday week grid spanning the given service year
 * (Sep 1 - Aug 31), GitHub-contributions-style — used by the Profile
 * screen's horizontally scrollable heat map instead of 12 separate
 * per-month grids. Padded at both ends to whole weeks.
 */
export function serviceYearContributionWeeks(
  state: AppState,
  label: number,
  locale: string = 'en-US',
  nowMs: number = Date.now()
): ContributionWeek[] {
  const { start, end } = serviceYearRange(label);
  const today = todayKey();
  const thisMonthKey = currentMonthKey();

  const gridStart = new Date(start);
  gridStart.setDate(gridStart.getDate() - ((gridStart.getDay() + 6) % 7));

  const lastDay = new Date(end);
  lastDay.setDate(lastDay.getDate() - 1);
  const gridEnd = new Date(lastDay);
  gridEnd.setDate(gridEnd.getDate() + (6 - ((gridEnd.getDay() + 6) % 7)));

  const weeks: ContributionWeek[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    const days: ContributionDay[] = [];
    let monthLabel: string | null = null;
    let isCurrentMonth = false;
    for (let i = 0; i < 7; i++) {
      const inRange = cursor >= start && cursor < end;
      const key = dateKey(cursor);
      let hours = inRange ? state.dailyLogs[key] || 0 : 0;
      const isToday = inRange && key === today;
      if (isToday && state.timerStartedAt) {
        hours += Math.max(0, (nowMs - state.timerStartedAt) / 3_600_000);
      }
      if (inRange && cursor.getDate() === 1) {
        monthLabel = monthAbbrevLabel(cursor, locale);
        isCurrentMonth = monthKeyOf(cursor) === thisMonthKey;
      }
      days.push({ dateKey: key, hours: Math.round(hours * 100) / 100, isToday, inRange });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push({ days, monthLabel, isCurrentMonth });
  }
  return weeks;
}
