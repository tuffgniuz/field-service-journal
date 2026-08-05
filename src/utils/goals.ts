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
  unit: 'months' | 'days' | 'today';
  value: number;
}

export interface ServiceYearProgress {
  neededPerMonth: number;
  countdown: ServiceYearCountdown;
}

/**
 * Regular-pioneer-only stats for the Profile screen: forward-looking hours
 * needed per month (from now through the end of the service year) to reach
 * the yearly goal, and a countdown to the service year's end (Aug 31) —
 * whole months left for as long as more than one full month remains; "1
 * month left" is never shown, since it switches straight to an exact day
 * count (no weeks tier) for that entire final stretch, down to a "Today"
 * state on the last day itself.
 */
export function serviceYearProgressFor(state: RuntimeState, nowMs: number = Date.now()): ServiceYearProgress | null {
  if (state.effectiveRole !== 'regular_pioneer') return null;
  const now = new Date(nowMs);
  const label = currentServiceYearLabel();
  const { end } = serviceYearRange(label);

  let completedHours = serviceYearHoursFor(state, label, nowMs);
  if (state.serviceYearStartingHoursYear === label) {
    completedHours = Math.round((completedHours + state.serviceYearStartingHours) * 100) / 100;
  }
  const remainingHours = Math.max(0, Math.round((REGULAR_PIONEER_YEARLY_GOAL - completedHours) * 100) / 100);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysLeft = Math.round((end.getTime() - startOfToday.getTime()) / 86_400_000);
  // A flat 30-day month approximation for "months remaining" — e.g. 2 months
  // and 15 days left becomes ~2.5 months — so the required monthly pace
  // stays accurate rather than jumping around whole-month boundaries. Floored
  // at 1 so that inside the final, sub-month stretch this never inflates
  // past the actual remaining hours (you can't need more per month than your
  // whole remaining requirement) — it just converges to "the rest, this month".
  const monthsRemaining = Math.max(daysLeft / 30, 1);
  const neededPerMonth = remainingHours <= 0 ? 0 : Math.round((remainingHours / monthsRemaining) * 10) / 10;

  // "1 month left" is never shown — once there'd be only one whole month
  // remaining, switch straight to an exact day count for the whole
  // remaining stretch instead (see the months > 1 check below).
  const monthsLeft = end.getFullYear() * 12 + end.getMonth() - (now.getFullYear() * 12 + now.getMonth()) - 1;
  if (monthsLeft > 1) {
    return { neededPerMonth, countdown: { unit: 'months', value: monthsLeft } };
  }
  const countdown: ServiceYearCountdown = daysLeft <= 1 ? { unit: 'today', value: 0 } : { unit: 'days', value: daysLeft };
  return { neededPerMonth, countdown };
}

export interface AuxPioneerProgress {
  neededPerWeek: number;
  countdown: ServiceYearCountdown;
}

/**
 * Auxiliary-pioneer-only stats for the Profile screen: forward-looking hours
 * needed per week (from now through the end of the month) to reach the
 * monthly goal, and an exact day count until the end of the assignment month
 * — an aux pioneer assignment is a single month, and months rarely divide
 * evenly into weeks, so this counts down in days rather than weeks.
 */
export function auxPioneerProgressFor(state: RuntimeState, nowMs: number = Date.now()): AuxPioneerProgress | null {
  if (state.effectiveRole !== 'aux_pioneer') return null;
  const now = new Date(nowMs);
  const completedHours = currentMonthHours(state, nowMs);
  const remainingHours = Math.max(0, Math.round((AUX_PIONEER_MONTHLY_GOAL - completedHours) * 100) / 100);

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysLeft = Math.round((endOfMonth.getTime() - startOfToday.getTime()) / 86_400_000);
  const countdown: ServiceYearCountdown = { unit: 'days', value: daysLeft };

  const weeksLeft = daysLeft / 7;
  const neededPerWeek = remainingHours <= 0 || weeksLeft <= 0 ? 0 : Math.round((remainingHours / weeksLeft) * 10) / 10;
  return { neededPerWeek, countdown };
}
