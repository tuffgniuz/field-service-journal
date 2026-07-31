import type { AppState } from './types';

export function defaultState(): AppState {
  return {
    name: '',
    avatarUri: '',
    role: 'publisher',
    auxPioneerSchedule: { ongoing: false, months: [] },
    themePreference: 'system',
    languagePreference: 'system',
    reportTone: 'formal',
    reportRecipient: '',
    recipientPhone: '',
    recipientEmail: '',
    participated: true,
    contacts: [],
    dailyLogs: {},
    timerStartedAt: null,
    monthlyParticipation: {},
    reportReminderEnabled: false,
    serviceYearStartingHours: 0,
    serviceYearStartingHoursYear: null,
    onboardingDone: false,
  };
}
