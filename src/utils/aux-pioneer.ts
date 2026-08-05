import type { AuxPioneerSchedule, BaseRole, Role } from '../store/types';
import { currentServiceYearLabel, monthByOffset, monthKeyOf, serviceYearRange } from './dates';

/** How many months ahead (including the current one) can be picked in the specific-months list. */
export const AUX_PIONEER_MONTH_WINDOW = 12;

export function isAuxPioneerActive(schedule: AuxPioneerSchedule, monthKey: string): boolean {
  return schedule.ongoing || schedule.months.includes(monthKey);
}

/** The role to actually treat the user as for the given month — 'aux_pioneer' overrides 'publisher' while the schedule is active, and is never applied to any other base role. */
export function resolveEffectiveRole(role: BaseRole, schedule: AuxPioneerSchedule, monthKey: string): Role {
  return role === 'publisher' && isAuxPioneerActive(schedule, monthKey) ? 'aux_pioneer' : role;
}

/** "YYYY-MM" keys for the current calendar month plus the next `AUX_PIONEER_MONTH_WINDOW - 1`, in order. */
export function auxPioneerMonthOptions(): string[] {
  const months: string[] = [];
  for (let i = 0; i < AUX_PIONEER_MONTH_WINDOW; i++) {
    months.push(monthKeyOf(monthByOffset(i)));
  }
  return months;
}

/** "YYYY-MM" keys for all 12 months of the given service year (Sep through Aug), in that order. */
export function serviceYearMonthOptions(label: number = currentServiceYearLabel()): string[] {
  const { start } = serviceYearRange(label);
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    months.push(monthKeyOf(new Date(start.getFullYear(), start.getMonth() + i, 1)));
  }
  return months;
}
