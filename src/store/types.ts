export type Role = 'publisher' | 'aux_pioneer' | 'regular_pioneer' | 'special_pioneer';

export type ContactStatus = 'return_visit' | 'bible_study' | 'family_study';

export type ReportTone = 'formal' | 'conversational';

export type ThemePreference = 'system' | 'light' | 'dark';

export type AppLanguage = 'en' | 'nl' | 'id';

export type LanguagePreference = 'system' | AppLanguage;

export interface Visit {
  id: string;
  /** ISO date string, e.g. "2026-07-07" */
  date: string;
  covered: string;
  standout: string;
  /** Days-from-visit reminder the user picked when saving, if any */
  reminderDays?: number | null;
}

export interface Contact {
  id: string;
  name: string;
  status: ContactStatus;
  notes: string;
  publication?: string;
  address?: string;
  visits: Visit[];
}

/** One entry per calendar day the user logged any hours, keyed by "YYYY-MM-DD" */
export type DailyLogs = Record<string, number>;

export interface AppState {
  name: string;
  /** file:// URI of the user's chosen avatar photo, or '' if none set. Optional and not part of onboarding. */
  avatarUri: string;
  role: Role;
  /** User's explicit choice, persisted. 'system' (the default) follows the OS appearance live. */
  themePreference: ThemePreference;
  /** User's explicit choice, persisted. 'system' (the default) follows the OS language, falling back to English if unsupported. */
  languagePreference: LanguagePreference;
  reportTone: ReportTone;
  reportRecipient: string;
  recipientPhone: string;
  recipientEmail: string;
  participated: boolean;
  contacts: Contact[];
  dailyLogs: DailyLogs;
  /** Epoch ms the running timer was started, or null if no timer is running. Persisted so an in-progress session survives an app restart. */
  timerStartedAt: number | null;
  /** "Shared in the ministry" (publisher-role checkbox) per month, keyed by "YYYY-MM". */
  monthlyParticipation: Record<string, boolean>;
  /** Whether the monthly "send your report" push reminder (1st of each month) is turned on. */
  reportReminderEnabled: boolean;
  /** Hours a regular pioneer had already put in this service year before starting to log via Fieldbook. */
  serviceYearStartingHours: number;
  /** The service-year label (see serviceYearLabel()) `serviceYearStartingHours` was entered for. Once a new service year begins this no longer matches, so the offset stops applying. */
  serviceYearStartingHoursYear: number | null;
  onboardingDone: boolean;
}

/** AppState plus the live-resolved theme and language, as exposed by useApp(). Neither is persisted itself — both are derived each render from the *Preference fields plus the OS setting. */
export type RuntimeState = AppState & { darkMode: boolean; language: AppLanguage };

export const STATUS_ORDER: ContactStatus[] = ['return_visit', 'bible_study', 'family_study'];
