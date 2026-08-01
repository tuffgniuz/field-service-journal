export type Role = 'publisher' | 'aux_pioneer' | 'regular_pioneer' | 'special_pioneer';

/**
 * The role a user actually picks and persists. 'aux_pioneer' is deliberately
 * excluded — auxiliary pioneering is a temporary, schedulable status a
 * publisher takes on (see `AuxPioneerSchedule`), not a permanent role, so it's
 * never stored directly in `AppState.role`. It only ever shows up as the
 * *derived* `RuntimeState.effectiveRole` for the months it's active.
 */
export type BaseRole = Exclude<Role, 'aux_pioneer'>;

export type ContactStatus = 'return_visit' | 'bible_study';

export type ReportTone = 'formal' | 'conversational';

export type ThemePreference = 'system' | 'light' | 'dark';

export type AppLanguage = 'en' | 'nl' | 'id';

export type LanguagePreference = 'system' | AppLanguage;

export interface Visit {
  id: string;
  /** ISO date string, e.g. "2026-07-07" */
  date: string;
  covered: string;
}

export interface Contact {
  id: string;
  name: string;
  status: ContactStatus;
  publication?: string;
  address?: string;
  visits: Visit[];
}

/** One entry per calendar day the user logged any hours, keyed by "YYYY-MM-DD" */
export type DailyLogs = Record<string, number>;

export interface AuxPioneerSchedule {
  /** True if the user is an auxiliary pioneer indefinitely, until turned off. Takes precedence over `months`. */
  ongoing: boolean;
  /** "YYYY-MM" months explicitly opted into auxiliary pioneering. Ignored while `ongoing` is true, but kept around so switching back to "specific months" restores the prior picks. */
  months: string[];
}

export interface AppState {
  name: string;
  /** file:// URI of the user's chosen avatar photo, or '' if none set. Optional and not part of onboarding. */
  avatarUri: string;
  role: BaseRole;
  /** Only meaningful while `role` is 'publisher' — see `AuxPioneerSchedule`. */
  auxPioneerSchedule: AuxPioneerSchedule;
  /** User's explicit choice, persisted. 'system' (the default) follows the OS appearance live. */
  themePreference: ThemePreference;
  /** User's explicit choice, persisted. 'system' (the default) follows the OS language, falling back to English if unsupported. */
  languagePreference: LanguagePreference;
  reportTone: ReportTone;
  reportRecipient: string;
  recipientPhone: string;
  recipientEmail: string;
  contacts: Contact[];
  dailyLogs: DailyLogs;
  /** Epoch ms the running timer was started, or null if no timer is running. Persisted so an in-progress session survives an app restart. */
  timerStartedAt: number | null;
  /** "Shared in the ministry" (publisher-role checkbox) per month, keyed by "YYYY-MM". */
  monthlyParticipation: Record<string, boolean>;
  /** Whether the monthly "send your report" push reminder (1st of each month) is turned on. */
  reportReminderEnabled: boolean;
  /** "YYYY-MM" of the last month the user explicitly confirmed their report was sent, or null before the first confirmation. The Report screen stays on the month after this (see `pendingReportMonth`) instead of always following the calendar. */
  lastReportedMonth: string | null;
  /** Hours a regular pioneer had already put in this service year before starting to log via Field Service Journal. */
  serviceYearStartingHours: number;
  /** The service-year label (see serviceYearLabel()) `serviceYearStartingHours` was entered for. Once a new service year begins this no longer matches, so the offset stops applying. */
  serviceYearStartingHoursYear: number | null;
  onboardingDone: boolean;
}

/**
 * AppState plus fields derived each render rather than persisted directly, as
 * exposed by useApp(). `darkMode`/`language` are resolved from the
 * *Preference fields plus the OS setting; `effectiveRole` is resolved from
 * `role` + `auxPioneerSchedule` + the current calendar month (see
 * `resolveEffectiveRole`) and is what goal/report logic should key off of —
 * `role` alone is never 'aux_pioneer'.
 */
export type RuntimeState = AppState & { darkMode: boolean; language: AppLanguage; effectiveRole: Role };

export const STATUS_ORDER: ContactStatus[] = ['return_visit', 'bible_study'];
