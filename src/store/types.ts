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

/**
 * "Meeting for field service" is intentionally not a member of this union —
 * it's handled separately via `MeetingScheduleDay` (the recurring weekly
 * template) plus per-date attendance, not as a plannable activity type.
 */
export type ActivityType = 'field_service' | 'bible_study' | 'return_visit' | 'cart' | 'street' | 'other';

export type RecurringRule = 'none' | 'weekly' | 'biweekly' | 'monthly';

/**
 * A planned (not logged) field service activity. Purely for the Schedule
 * tab — never counts toward `dailyLogs` hours. `recurring` activities are
 * stored once at their first occurrence (`date`) and expanded on the fly for
 * later weeks (see `activityOccursOnDate` in utils/schedule.ts) rather than
 * being duplicated into one row per occurrence.
 */
export interface ScheduledActivity {
  id: string;
  type: ActivityType;
  /** "YYYY-MM-DD" — the first/anchor occurrence. */
  date: string;
  /** Free text, e.g. "9:00 AM" — deliberately not a structured time to keep entry fast. */
  time: string;
  /** Optional "HH:mm" end time selected via the native time picker. Empty/undefined means no end time. */
  endTime?: string;
  location: string;
  contactId: string | null;
  /** Key into `ACTIVITY_COLORS` (utils/schedule.ts), or null for the default uncolored card. */
  color: string | null;
  /** Free text, e.g. "David, Ahmad" — not a contact reference. */
  partners: string;
  recurring: RecurringRule;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * One entry per weekday (0=Sunday..6=Saturday) describing the congregation's
 * recurring "meeting for field service" — separate from `ScheduledActivity`
 * since it's a single recurring weekly template rather than something a user
 * plans per-instance.
 */
export interface MeetingScheduleDay {
  dayOfWeek: number;
  enabled: boolean;
  time: string;
  /** Empty string means the meeting place varies week to week. */
  location: string;
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
  /** Planned (not logged) field service activities — see `ScheduledActivity`. */
  scheduledActivities: ScheduledActivity[];
  /** Always exactly 7 entries, one per weekday (0=Sunday..6=Saturday). */
  meetingSchedule: MeetingScheduleDay[];
  /** One-off meeting-for-field-service location overrides, keyed by "YYYY-MM-DD". */
  meetingLocationOverrides: Record<string, string>;
  /** One-off meeting-for-field-service conductor names, keyed by "YYYY-MM-DD". Only set for dates with a location override. */
  meetingConductorOverrides: Record<string, string>;
  /** Personal attendance at the recurring meeting for field service, keyed by "YYYY-MM-DD". */
  meetingAttendance: Record<string, boolean>;
  /** Key into `ACTIVITY_COLORS` (utils/schedule.ts) for the meeting-for-field-service card, or null for the default uncolored card. */
  meetingColor: string | null;
}

/**
 * AppState plus fields derived each render rather than persisted directly, as
 * exposed by useApp(). `darkMode`/`language` are resolved from the
 * *Preference fields plus the OS setting; `effectiveRole` is resolved from
 * `role` + `auxPioneerSchedule` + the current calendar month (see
 * `resolveEffectiveRole`) and is what goal/report logic should key off of —
 * `role` alone is never 'aux_pioneer'.
 */
export type RuntimeState = AppState & {
  darkMode: boolean;
  language: AppLanguage;
  effectiveRole: Role;
  uses24HourClock: boolean | null;
};

export const STATUS_ORDER: ContactStatus[] = ['return_visit', 'bible_study'];
