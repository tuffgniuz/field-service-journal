import type { RuntimeState } from '../store/types';
import { currentMonthHours, serviceYearHoursFor } from '../store/selectors';
import { currentServiceYearLabel, serviceYearRange } from './dates';

const AUX_PIONEER_MONTHLY_GOAL = 30;
const REGULAR_PIONEER_YEARLY_GOAL = 600;

export interface PioneerGoal {
  kind: 'monthly' | 'yearly';
  targetHours: number;
  completedHours: number;
  remainingHours: number;
  /** The calendar month (monthly) or service-year label (yearly) this goal covers. */
  serviceYearLabel?: number;
}

/** Returns the active hour goal for the user's *effective* role this month, or null for roles with no defined goal (publisher, special pioneer). */
export function pioneerGoalFor(state: RuntimeState, nowMs: number = Date.now()): PioneerGoal | null {
  if (state.effectiveRole === 'aux_pioneer') {
    const completedHours = currentMonthHours(state, nowMs);
    return {
      kind: 'monthly',
      targetHours: AUX_PIONEER_MONTHLY_GOAL,
      completedHours,
      remainingHours: Math.max(0, Math.round((AUX_PIONEER_MONTHLY_GOAL - completedHours) * 100) / 100),
    };
  }
  if (state.effectiveRole === 'regular_pioneer') {
    const label = currentServiceYearLabel();
    let completedHours = serviceYearHoursFor(state, label, nowMs);
    if (state.serviceYearStartingHoursYear === label) {
      completedHours = Math.round((completedHours + state.serviceYearStartingHours) * 100) / 100;
    }
    return {
      kind: 'yearly',
      targetHours: REGULAR_PIONEER_YEARLY_GOAL,
      completedHours,
      remainingHours: Math.max(0, Math.round((REGULAR_PIONEER_YEARLY_GOAL - completedHours) * 100) / 100),
      serviceYearLabel: label,
    };
  }
  return null;
}

export interface ServiceYearCountdown {
  unit: 'months' | 'weeks' | 'days';
  value: number;
}

export interface ServiceYearProgress {
  avgMonthlyHours: number;
  countdown: ServiceYearCountdown;
}

/**
 * Regular-pioneer-only stats for the Profile screen: the average hours logged
 * per month so far this service year, and a countdown to the service year's
 * end (Aug 31) that gets more granular as it closes in — whole months until
 * the final month (August) begins, then weeks, then days once inside the
 * final week (the last 7 days of August).
 */
export function serviceYearProgressFor(state: RuntimeState, nowMs: number = Date.now()): ServiceYearProgress | null {
  if (state.effectiveRole !== 'regular_pioneer') return null;
  const now = new Date(nowMs);
  const label = currentServiceYearLabel();
  const { start, end } = serviceYearRange(label);

  let completedHours = serviceYearHoursFor(state, label, nowMs);
  if (state.serviceYearStartingHoursYear === label) {
    completedHours = Math.round((completedHours + state.serviceYearStartingHours) * 100) / 100;
  }
  const monthsElapsed = now.getFullYear() * 12 + now.getMonth() - (start.getFullYear() * 12 + start.getMonth()) + 1;
  const avgMonthlyHours = Math.round((completedHours / monthsElapsed) * 10) / 10;

  const monthsLeft = end.getFullYear() * 12 + end.getMonth() - (now.getFullYear() * 12 + now.getMonth()) - 1;
  if (monthsLeft > 0) {
    return { avgMonthlyHours, countdown: { unit: 'months', value: monthsLeft } };
  }
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysLeft = Math.round((end.getTime() - startOfToday.getTime()) / 86_400_000);
  const countdown: ServiceYearCountdown =
    daysLeft <= 7 ? { unit: 'days', value: daysLeft } : { unit: 'weeks', value: Math.ceil(daysLeft / 7) };
  return { avgMonthlyHours, countdown };
}

export interface AuxPioneerProgress {
  avgWeeklyHours: number;
  countdown: ServiceYearCountdown;
}

/**
 * Auxiliary-pioneer-only stats for the Profile screen: the average hours
 * logged per week so far this calendar month, and a countdown to the end of
 * the month that counts down in weeks until the final week, then switches to
 * counting down by day (the last 7 days of the month).
 */
export function auxPioneerProgressFor(state: RuntimeState, nowMs: number = Date.now()): AuxPioneerProgress | null {
  if (state.effectiveRole !== 'aux_pioneer') return null;
  const now = new Date(nowMs);
  const completedHours = currentMonthHours(state, nowMs);
  const weeksElapsed = Math.ceil(now.getDate() / 7);
  const avgWeeklyHours = Math.round((completedHours / weeksElapsed) * 10) / 10;

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysLeft = Math.round((endOfMonth.getTime() - startOfToday.getTime()) / 86_400_000);
  const countdown: ServiceYearCountdown =
    daysLeft <= 7 ? { unit: 'days', value: daysLeft } : { unit: 'weeks', value: Math.ceil(daysLeft / 7) };
  return { avgWeeklyHours, countdown };
}
