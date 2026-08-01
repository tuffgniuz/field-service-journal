import type { AppState, Contact, ContactStatus } from './types';
import {
  currentMonthKey,
  currentServiceYearLabel,
  daysInMonth,
  daysSince,
  monthByOffset,
  monthKeyOf,
  nextMonthKey,
  parseDateKey,
  parseMonthKey,
  serviceYearRange,
  todayKey,
} from '../utils/dates';

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
