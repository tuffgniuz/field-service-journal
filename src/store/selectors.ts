import type { AppState, Contact, ContactStatus } from './types';
import {
  currentMonthKey,
  currentServiceYearLabel,
  daysInMonth,
  daysSince,
  monthByOffset,
  monthKeyOf,
  parseDateKey,
  serviceYearRange,
  todayKey,
} from '../utils/dates';

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

const STUDY_STATUSES: ContactStatus[] = ['bible_study', 'family_study'];

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
    const hours = monthHoursFor(state, monthKey);
    const studies = studiesForMonth(state, monthKey);
    const hasParticipationRecord = monthKey in state.monthlyParticipation;
    if (hours === 0 && studies === 0 && !hasParticipationRecord) continue;
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
