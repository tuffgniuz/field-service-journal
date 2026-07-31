import type { AppState } from '../store/types';
import { currentMonthHours, serviceYearHoursFor } from '../store/selectors';
import { currentServiceYearLabel } from './dates';

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

/** Returns the active hour goal for the user's role, or null for roles with no defined goal (publisher, special pioneer). */
export function pioneerGoalFor(state: AppState, nowMs: number = Date.now()): PioneerGoal | null {
  if (state.role === 'aux_pioneer') {
    const completedHours = currentMonthHours(state, nowMs);
    return {
      kind: 'monthly',
      targetHours: AUX_PIONEER_MONTHLY_GOAL,
      completedHours,
      remainingHours: Math.max(0, Math.round((AUX_PIONEER_MONTHLY_GOAL - completedHours) * 100) / 100),
    };
  }
  if (state.role === 'regular_pioneer') {
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
