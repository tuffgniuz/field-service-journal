import type { AuxPioneerSchedule, BaseRole, Role } from '../store/types';
import { monthByOffset, monthKeyOf } from './dates';

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
