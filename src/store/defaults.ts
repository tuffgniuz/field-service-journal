import type { AppState, MeetingScheduleDay } from './types';

function defaultMeetingSchedule(): MeetingScheduleDay[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, enabled: false, time: '', location: '' }));
}

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
    contacts: [],
    dailyLogs: {},
    timerStartedAt: null,
    monthlyParticipation: {},
    reportReminderEnabled: false,
    lastReportedMonth: null,
    serviceYearStartingHours: 0,
    serviceYearStartingHoursYear: null,
    onboardingDone: false,
    scheduledActivities: [],
    meetingSchedule: defaultMeetingSchedule(),
    meetingLocationOverrides: {},
    meetingConductorOverrides: {},
    meetingAttendance: {},
    meetingColor: null,
    familyBibleStudy: { enabled: false, contactId: null, days: [] },
    creditHoursEnabled: false,
    creditHoursAmount: 0,
    creditHoursSource: '',
    scheduledActivityHours: {},
    serviceAreaFile: null,
    notes: [],
    // Google Drive sync is currently disabled — see src/screens/profile/settings-screen.tsx.
    // googleAccount: null,
    // lastGoogleSyncAt: null,
  };
}
