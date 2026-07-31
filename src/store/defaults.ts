import type { AppState } from './types';

export function defaultState(): AppState {
  return {
    name: '',
    avatarUri: '',
    role: 'publisher',
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
