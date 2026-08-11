import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as Localization from 'expo-localization';
import i18next from '../i18n';
import type {
  ActivityType,
  AppState,
  BaseRole,
  Contact,
  ContactStatus,
  FamilyBibleStudySettings,
  // GoogleSyncAccount, // Google Drive sync is currently disabled — see src/screens/profile/settings-screen.tsx.
  LanguagePreference,
  MeetingScheduleDay,
  Note,
  RecurringRule,
  ReportTone,
  RuntimeState,
  ScheduledActivity,
  ServiceAreaFile,
  ThemePreference,
  Visit,
} from './types';
import { defaultState } from './defaults';
import { loadState, saveState } from './storage';
import { MAX_CREDIT_HOURS } from './selectors';
import { currentMonthKey, currentServiceYearLabel, dateKey, parseDateKey, previousMonthKey, todayKey } from '../utils/dates';
import { resolveEffectiveRole } from '../utils/aux-pioneer';
import { buildDummySeed, DUMMY_CONTACT_PREFIX } from '../utils/dev-seed';
import { pickSupportedLanguage } from '../i18n/language';
import {
  cancelLastDayOfMonthReminder,
  cancelMonthlyReportReminder,
  configureNotificationHandler,
  requestReportReminderPermissionAsync,
  scheduleLastDayOfMonthReminder,
  scheduleMonthlyReportReminder,
  type ReminderContent,
} from '../utils/notifications';

function reminderContent(): ReminderContent {
  return {
    channelName: i18next.t('notifications.channelName'),
    title: i18next.t('notifications.reminderTitle'),
    body: i18next.t('notifications.reminderBody'),
  };
}

function lastDayReminderContent(): ReminderContent {
  return {
    channelName: i18next.t('notifications.channelName'),
    title: i18next.t('notifications.lastDayReminderTitle'),
    body: i18next.t('notifications.lastDayReminderBody'),
  };
}

interface VisitDraft {
  date: string;
  covered: string;
}

interface ContactDraft {
  name: string;
  status: ContactStatus;
  publication?: string;
  address?: string;
}

interface NoteDraft {
  title: string;
  /** Raw comma-separated input from the Tags field — split/trimmed/deduped on save. */
  tags: string;
  body: string;
}

function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of raw.split(',')) {
    const tag = part.trim();
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
  }
  return tags;
}

interface ActivityDraft {
  type: ActivityType;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  contactId: string | null;
  color: string | null;
  partners: string;
  recurring: RecurringRule;
  notes: string;
}

interface AppActions {
  setName: (name: string) => void;
  setAvatarUri: (uri: string) => void;
  setRole: (r: BaseRole) => void;
  /** Whether auxiliary pioneering is indefinite ('ongoing') vs. limited to `auxPioneerSchedule.months`. No-op unless `role` is 'publisher'. */
  setAuxPioneerOngoing: (ongoing: boolean) => void;
  /** Toggles a single "YYYY-MM" month on/off the auxiliary-pioneer schedule. */
  toggleAuxPioneerMonth: (monthKey: string) => void;
  /** Clears the auxiliary-pioneer schedule entirely (both `ongoing` and any picked months). */
  stopAuxPioneering: () => void;
  toggleDark: () => void;
  setLight: () => void;
  setDark: () => void;
  setSystemTheme: () => void;
  setLanguagePreference: (pref: LanguagePreference) => void;
  setToneFormal: () => void;
  setToneConversational: () => void;
  setReportRecipient: (name: string) => void;
  setRecipientPhone: (phone: string) => void;
  setRecipientEmail: (email: string) => void;
  /** Toggles "shared in the ministry" for the given "YYYY-MM" month. */
  toggleParticipated: (monthKey: string) => void;
  /** Confirms the given month's report was sent, letting the Report screen advance past it. */
  markReportSent: (monthKey: string) => void;
  /** Requests permission (if needed) and schedules/cancels the monthly reminder. Resolves false if permission was denied. */
  setReportReminderEnabled: (enabled: boolean) => Promise<boolean>;
  /** Tags the hours to the current service year, so they stop applying once a new one begins. */
  setServiceYearStartingHours: (hours: number) => void;
  addContact: (draft: ContactDraft) => string;
  updateContact: (contactId: string, draft: ContactDraft) => void;
  deleteContact: (contactId: string) => void;
  cycleContactStatus: (contactId: string) => void;
  /** Toggles one study-item id (see `StudyItem` in utils/publications.ts) on/off a contact's `studyProgress`. */
  toggleStudyItem: (contactId: string, itemId: string) => void;
  saveVisit: (contactId: string, visit: VisitDraft, editingVisitId?: string | null) => void;
  deleteVisit: (contactId: string, visitId: string) => void;
  addHours: (dateKey: string, deltaHours: number) => void;
  addActivity: (draft: ActivityDraft) => string;
  updateActivity: (activityId: string, draft: ActivityDraft) => void;
  deleteActivity: (activityId: string) => void;
  /** Checks off a scheduled-activity occurrence, adding `hours` to that date's log (replacing any hours previously confirmed for the same occurrence). */
  confirmActivityHours: (activityId: string, occurrenceDate: string, hours: number) => void;
  /** Un-checks a previously confirmed activity occurrence, subtracting its logged hours back out. */
  unconfirmActivityHours: (activityId: string, occurrenceDate: string) => void;
  /** Replaces the full 7-day recurring meeting-for-field-service template. */
  setMeetingSchedule: (days: MeetingScheduleDay[]) => void;
  /** Sets or clears the one-off meeting-for-field-service location for a specific "YYYY-MM-DD". */
  setMeetingLocationOverride: (dateKey: string, location: string) => void;
  /** Replaces all one-off meeting-for-field-service location overrides. */
  setMeetingLocationOverrides: (overrides: Record<string, string>) => void;
  /** Replaces all one-off meeting-for-field-service conductor names. */
  setMeetingConductorOverrides: (overrides: Record<string, string>) => void;
  /** Toggles personal attendance at the meeting for field service on the given "YYYY-MM-DD". */
  toggleMeetingAttendance: (dateKey: string) => void;
  /** Sets the meeting-for-field-service card's color — a key into `ACTIVITY_COLORS`, or null for the default uncolored card. */
  setMeetingColor: (color: string | null) => void;
  /** Toggles the family Bible study credit on/off, syncing its recurring weekly Schedule entries. */
  setFamilyBibleStudyEnabled: (enabled: boolean) => void;
  /** Sets which contact the family Bible study is with, updating any existing recurring Schedule entries. */
  setFamilyBibleStudyContact: (contactId: string | null) => void;
  /** Toggles a single weekday (0=Sunday..6=Saturday) on/off the family Bible study schedule. */
  toggleFamilyBibleStudyDay: (dayOfWeek: number) => void;
  /** Toggles whether additional field-service credit hours are reported each month. */
  setCreditHoursEnabled: (enabled: boolean) => void;
  /** Sets the additional credit hours reported each month, clamped to [0, 55]. */
  setCreditHoursAmount: (hours: number) => void;
  /** Sets the free-text explanation of where the credit hours come from. */
  setCreditHoursSource: (source: string) => void;
  /** Sets or clears the user's uploaded service (territory) area file. */
  setServiceAreaFile: (file: ServiceAreaFile | null) => void;
  addNote: (draft: NoteDraft) => string;
  updateNote: (noteId: string, draft: NoteDraft) => void;
  deleteNote: (noteId: string) => void;
  // Google Drive sync is currently disabled — see src/screens/profile/settings-screen.tsx.
  // /** Sets or clears the connected Google Drive sync account. Clearing does not itself revoke tokens — see useGoogleDriveSync's disconnect. */
  // setGoogleAccount: (account: GoogleSyncAccount | null) => void;
  // /** Records when a Google Drive sync last completed successfully. */
  // setLastGoogleSyncAt: (isoTimestamp: string | null) => void;
  // /** Replaces local state with a backup downloaded from Google Drive, filling in any missing fields from defaults (same merge as loading persisted state on launch). */
  // restoreFromGoogleBackup: (data: unknown) => void;
  startTimer: () => void;
  stopTimer: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  restartOnboarding: () => void;
  resetAllData: () => void;
  /** Dev-only: fills in the "Paul" sample profile, service history, and contacts. No-op outside __DEV__. */
  seedDummyData: () => void;
}

interface AppContextValue {
  state: RuntimeState;
  ready: boolean;
  actions: AppActions;
}

const AppContext = createContext<AppContextValue | null>(null);

function vibrate(ms: number) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Vibration } = require('react-native');
    Vibration.vibrate(ms);
  } catch {
    // no-op on platforms without haptics
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const FAMILY_STUDY_ACTIVITY_PREFIX = 'family-study-';

/** The most recent occurrence (today included) of `dayOfWeek` — a valid `recurring: 'weekly'` anchor that never lands in the future. */
function familyBibleStudyAnchorDate(dayOfWeek: number): string {
  const today = parseDateKey(todayKey());
  const diff = (today.getDay() - dayOfWeek + 7) % 7;
  const d = new Date(today);
  d.setDate(d.getDate() - diff);
  return dateKey(d);
}

/**
 * Rebuilds the family-Bible-study-derived `ScheduledActivity` entries
 * (id-prefixed `family-study-<dayOfWeek>`) to match `settings`, preserving
 * each day's existing time/location/color/notes/partners if it was already
 * scheduled. Leaves every other activity untouched.
 */
function syncFamilyBibleStudyActivities(
  activities: ScheduledActivity[],
  settings: FamilyBibleStudySettings
): ScheduledActivity[] {
  const others = activities.filter((a) => !a.id.startsWith(FAMILY_STUDY_ACTIVITY_PREFIX));
  if (!settings.enabled) return others;

  const now = new Date().toISOString();
  const familyActivities: ScheduledActivity[] = settings.days.map((dayOfWeek) => {
    const id = `${FAMILY_STUDY_ACTIVITY_PREFIX}${dayOfWeek}`;
    const existing = activities.find((a) => a.id === id);
    return {
      id,
      type: 'bible_study',
      date: existing?.date ?? familyBibleStudyAnchorDate(dayOfWeek),
      time: existing?.time ?? '',
      endTime: existing?.endTime,
      location: existing?.location ?? '',
      contactId: settings.contactId,
      color: existing?.color ?? null,
      partners: existing?.partners ?? '',
      recurring: 'weekly',
      notes: existing?.notes ?? '',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
  });

  return [...others, ...familyActivities];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState());
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Subscribes to live OS appearance changes (e.g. scheduled dark mode kicking in
  // while the app is open), not just the value at first launch.
  const systemScheme = useColorScheme();
  // Subscribes to live OS locale changes, mirroring the appearance pattern above.
  const systemLocales = Localization.useLocales();
  const systemCalendars = Localization.useCalendars();

  useEffect(() => {
    configureNotificationHandler();
    let cancelled = false;
    (async () => {
      const persisted = await loadState();
      if (cancelled) return;
      if (persisted) {
        const merged = { ...defaultState(), ...persisted };
        // Migration: persisted data from before the `name` field existed has
        // no `name` key at all (as opposed to a user explicitly leaving it
        // blank, which persists as ''). Treat that as an incomplete profile
        // and show onboarding again so the new field gets collected — this is
        // what makes upgrading to a build with new required onboarding fields
        // re-prompt existing users instead of silently showing blank values.
        if (persisted.name === undefined) {
          merged.onboardingDone = false;
        }
        // Migration: 'aux_pioneer' used to be a permanent, directly-selectable
        // role. It's now a schedule layered on top of 'publisher' (see
        // `AuxPioneerSchedule`), so a legacy persisted role of 'aux_pioneer'
        // is remapped to 'publisher' + an 'ongoing' schedule, preserving the
        // same effective behavior for anyone who had it set.
        if ((persisted.role as string) === 'aux_pioneer') {
          merged.role = 'publisher';
          merged.auxPioneerSchedule = { ongoing: true, months: merged.auxPioneerSchedule.months };
        }
        // Migration: the 'family_study' contact status was removed. Fold any
        // existing contacts marked with it into 'bible_study' — they still
        // count toward the monthly studies total either way.
        if (merged.contacts.some((c) => (c.status as string) === 'family_study')) {
          merged.contacts = merged.contacts.map((c) =>
            (c.status as string) === 'family_study' ? { ...c, status: 'bible_study' } : c
          );
        }
        // Migration: `lastReportedMonth` didn't exist before the "don't
        // advance until sent" reminder feature. Anchor already-onboarded
        // users as caught-up through last month so they aren't retroactively
        // flagged overdue for months predating the feature — the reminder
        // will correctly kick in as soon as the next month goes unconfirmed.
        if (persisted.lastReportedMonth === undefined && merged.onboardingDone) {
          merged.lastReportedMonth = previousMonthKey(currentMonthKey());
        }
        // Migration: `studyProgress` didn't exist on contacts before the
        // study-progress-tracking feature — backfill it so array methods
        // elsewhere don't have to guard against it being missing.
        if (merged.contacts.some((c) => c.studyProgress === undefined)) {
          merged.contacts = merged.contacts.map((c) => (c.studyProgress ? c : { ...c, studyProgress: [] }));
        }
        setState(merged);
      }
      // Re-arming the OS-level schedule (in case it was cleared by a reinstall
      // or OS cleanup) is handled by the language-sync effect below, which runs
      // once `ready` flips true and correctly waits for the language to resolve
      // before building the translated notification content.
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveState(state);
    }, 250);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, ready]);

  const actions: AppActions = useMemo(
    () => ({
      setName: (name) => setState((s) => ({ ...s, name })),
      setAvatarUri: (uri) => setState((s) => ({ ...s, avatarUri: uri })),
      setRole: (r) => setState((s) => ({ ...s, role: r })),
      setAuxPioneerOngoing: (ongoing) =>
        setState((s) => ({ ...s, auxPioneerSchedule: { ...s.auxPioneerSchedule, ongoing } })),
      toggleAuxPioneerMonth: (monthKey) =>
        setState((s) => {
          const months = s.auxPioneerSchedule.months.includes(monthKey)
            ? s.auxPioneerSchedule.months.filter((m) => m !== monthKey)
            : [...s.auxPioneerSchedule.months, monthKey];
          return { ...s, auxPioneerSchedule: { ...s.auxPioneerSchedule, months } };
        }),
      stopAuxPioneering: () => setState((s) => ({ ...s, auxPioneerSchedule: { ongoing: false, months: [] } })),
      toggleDark: () =>
        setState((s) => {
          const currentlyDark =
            s.themePreference === 'system' ? systemScheme === 'dark' : s.themePreference === 'dark';
          return { ...s, themePreference: (currentlyDark ? 'light' : 'dark') as ThemePreference };
        }),
      setLight: () => setState((s) => ({ ...s, themePreference: 'light' as ThemePreference })),
      setDark: () => setState((s) => ({ ...s, themePreference: 'dark' as ThemePreference })),
      setSystemTheme: () => setState((s) => ({ ...s, themePreference: 'system' as ThemePreference })),
      setLanguagePreference: (pref) => setState((s) => ({ ...s, languagePreference: pref })),
      setToneFormal: () => setState((s) => ({ ...s, reportTone: 'formal' as ReportTone })),
      setToneConversational: () => setState((s) => ({ ...s, reportTone: 'conversational' as ReportTone })),
      setReportRecipient: (name) => setState((s) => ({ ...s, reportRecipient: name })),
      setRecipientPhone: (phone) => setState((s) => ({ ...s, recipientPhone: phone })),
      setRecipientEmail: (email) => setState((s) => ({ ...s, recipientEmail: email })),
      toggleParticipated: (monthKey) =>
        setState((s) => {
          const current = s.monthlyParticipation[monthKey] ?? true;
          return { ...s, monthlyParticipation: { ...s.monthlyParticipation, [monthKey]: !current } };
        }),

      markReportSent: (monthKey) => setState((s) => ({ ...s, lastReportedMonth: monthKey })),
      setServiceYearStartingHours: (hours) =>
        setState((s) => ({
          ...s,
          serviceYearStartingHours: Math.max(0, hours),
          serviceYearStartingHoursYear: currentServiceYearLabel(),
        })),

      addContact: (draft) => {
        const id = 'c' + Date.now();
        vibrate(20);
        setState((s) => ({
          ...s,
          contacts: [
            ...s.contacts,
            {
              id,
              name: draft.name.trim() || i18next.t('addContact.unnamedFallback'),
              status: draft.status,
              publication: draft.publication?.trim() || '',
              address: draft.address?.trim() || '',
              visits: [],
              studyProgress: [],
            },
          ],
        }));
        return id;
      },

      updateContact: (contactId, draft) =>
        setState((s) => ({
          ...s,
          contacts: s.contacts.map((c) => {
            if (c.id !== contactId) return c;
            const publication = draft.publication?.trim() || '';
            return {
              ...c,
              name: draft.name.trim() || i18next.t('addContact.unnamedFallback'),
              status: draft.status,
              publication,
              address: draft.address?.trim() || '',
              // Switching to a different (or no) publication invalidates progress against the old one.
              studyProgress: publication === c.publication ? c.studyProgress : [],
            };
          }),
        })),

      toggleStudyItem: (contactId, itemId) =>
        setState((s) => ({
          ...s,
          contacts: s.contacts.map((c) =>
            c.id === contactId
              ? {
                  ...c,
                  studyProgress: c.studyProgress.includes(itemId)
                    ? c.studyProgress.filter((id) => id !== itemId)
                    : [...c.studyProgress, itemId],
                }
              : c
          ),
        })),

      deleteContact: (contactId) => {
        vibrate(20);
        setState((s) => ({
          ...s,
          contacts: s.contacts.filter((c) => c.id !== contactId),
        }));
      },

      cycleContactStatus: (contactId) =>
        setState((s) => {
          const order: ContactStatus[] = ['return_visit', 'bible_study'];
          return {
            ...s,
            contacts: s.contacts.map((c) => {
              if (c.id !== contactId) return c;
              const idx = order.indexOf(c.status);
              return { ...c, status: order[(idx + 1) % order.length] };
            }),
          };
        }),

      saveVisit: (contactId, visit, editingVisitId) => {
        vibrate(20);
        setState((s) => ({
          ...s,
          contacts: s.contacts.map((c) => {
            if (c.id !== contactId) return c;
            const entry: Visit = {
              id: editingVisitId || 'v' + Date.now(),
              date: visit.date,
              covered: visit.covered,
            };
            const visits = editingVisitId
              ? c.visits.map((v) => (v.id === editingVisitId ? entry : v))
              : [...c.visits, entry];
            return { ...c, visits };
          }),
        }));
      },

      deleteVisit: (contactId, visitId) =>
        setState((s) => ({
          ...s,
          contacts: s.contacts.map((c) =>
            c.id === contactId ? { ...c, visits: c.visits.filter((v) => v.id !== visitId) } : c
          ),
        })),

      addHours: (dateKey, deltaHours) =>
        setState((s) => {
          const current = s.dailyLogs[dateKey] || 0;
          const next = Math.max(0, round2(current + deltaHours));
          return { ...s, dailyLogs: { ...s.dailyLogs, [dateKey]: next } };
        }),

      confirmActivityHours: (activityId, occurrenceDate, hours) =>
        setState((s) => {
          const key = `${activityId}_${occurrenceDate}`;
          const previous = s.scheduledActivityHours[key] ?? 0;
          const current = s.dailyLogs[occurrenceDate] || 0;
          const next = Math.max(0, round2(current - previous + hours));
          return {
            ...s,
            dailyLogs: { ...s.dailyLogs, [occurrenceDate]: next },
            scheduledActivityHours: { ...s.scheduledActivityHours, [key]: hours },
          };
        }),

      unconfirmActivityHours: (activityId, occurrenceDate) =>
        setState((s) => {
          const key = `${activityId}_${occurrenceDate}`;
          const previous = s.scheduledActivityHours[key];
          if (previous === undefined) return s;
          const current = s.dailyLogs[occurrenceDate] || 0;
          const next = Math.max(0, round2(current - previous));
          const scheduledActivityHours = { ...s.scheduledActivityHours };
          delete scheduledActivityHours[key];
          return { ...s, dailyLogs: { ...s.dailyLogs, [occurrenceDate]: next }, scheduledActivityHours };
        }),

      addActivity: (draft) => {
        const id = 'a' + Date.now();
        const now = new Date().toISOString();
        vibrate(20);
        setState((s) => ({
          ...s,
          scheduledActivities: [
            ...s.scheduledActivities,
            { id, ...draft, createdAt: now, updatedAt: now },
          ],
        }));
        return id;
      },

      updateActivity: (activityId, draft) =>
        setState((s) => ({
          ...s,
          scheduledActivities: s.scheduledActivities.map((a) =>
            a.id === activityId ? { ...a, ...draft, updatedAt: new Date().toISOString() } : a
          ),
        })),

      deleteActivity: (activityId) => {
        vibrate(20);
        setState((s) => ({
          ...s,
          scheduledActivities: s.scheduledActivities.filter((a) => a.id !== activityId),
        }));
      },

      setMeetingSchedule: (days) => setState((s) => ({ ...s, meetingSchedule: days })),

      setMeetingLocationOverride: (dateKey, location) =>
        setState((s) => {
          const next = { ...s.meetingLocationOverrides };
          const trimmed = location.trim();
          if (trimmed) next[dateKey] = trimmed;
          else delete next[dateKey];
          return { ...s, meetingLocationOverrides: next };
        }),

      setMeetingLocationOverrides: (overrides) =>
        setState((s) => ({
          ...s,
          meetingLocationOverrides: Object.fromEntries(
            Object.entries(overrides)
              .map(([key, value]) => [key, value.trim()])
              .filter((entry): entry is [string, string] => Boolean(entry[1]))
          ),
        })),

      setMeetingConductorOverrides: (overrides) =>
        setState((s) => ({
          ...s,
          meetingConductorOverrides: Object.fromEntries(
            Object.entries(overrides)
              .map(([key, value]) => [key, value.trim()])
              .filter((entry): entry is [string, string] => Boolean(entry[1]))
          ),
        })),

      toggleMeetingAttendance: (dateKey) =>
        setState((s) => ({
          ...s,
          meetingAttendance: { ...s.meetingAttendance, [dateKey]: !s.meetingAttendance[dateKey] },
        })),

      setMeetingColor: (color) => setState((s) => ({ ...s, meetingColor: color })),

      setFamilyBibleStudyEnabled: (enabled) =>
        setState((s) => {
          const familyBibleStudy = { ...s.familyBibleStudy, enabled };
          return {
            ...s,
            familyBibleStudy,
            scheduledActivities: syncFamilyBibleStudyActivities(s.scheduledActivities, familyBibleStudy),
          };
        }),

      setFamilyBibleStudyContact: (contactId) =>
        setState((s) => {
          const familyBibleStudy = { ...s.familyBibleStudy, contactId };
          return {
            ...s,
            familyBibleStudy,
            scheduledActivities: syncFamilyBibleStudyActivities(s.scheduledActivities, familyBibleStudy),
          };
        }),

      toggleFamilyBibleStudyDay: (dayOfWeek) =>
        setState((s) => {
          const days = s.familyBibleStudy.days.includes(dayOfWeek)
            ? s.familyBibleStudy.days.filter((d) => d !== dayOfWeek)
            : [...s.familyBibleStudy.days, dayOfWeek].sort((a, b) => a - b);
          const familyBibleStudy = { ...s.familyBibleStudy, days };
          return {
            ...s,
            familyBibleStudy,
            scheduledActivities: syncFamilyBibleStudyActivities(s.scheduledActivities, familyBibleStudy),
          };
        }),

      setCreditHoursEnabled: (enabled) => setState((s) => ({ ...s, creditHoursEnabled: enabled })),

      setCreditHoursAmount: (hours) =>
        setState((s) => ({ ...s, creditHoursAmount: Math.min(Math.max(0, hours), MAX_CREDIT_HOURS) })),

      setCreditHoursSource: (source) => setState((s) => ({ ...s, creditHoursSource: source })),

      setServiceAreaFile: (file) => setState((s) => ({ ...s, serviceAreaFile: file })),

      addNote: (draft) => {
        const id = 'note' + Date.now();
        const now = new Date().toISOString();
        vibrate(20);
        setState((s) => ({
          ...s,
          notes: [
            ...s.notes,
            { id, title: draft.title.trim(), tags: parseTags(draft.tags), body: draft.body, createdAt: now, updatedAt: now },
          ],
        }));
        return id;
      },

      updateNote: (noteId, draft) =>
        setState((s) => ({
          ...s,
          notes: s.notes.map((n) =>
            n.id === noteId
              ? { ...n, title: draft.title.trim(), tags: parseTags(draft.tags), body: draft.body, updatedAt: new Date().toISOString() }
              : n
          ),
        })),

      deleteNote: (noteId) => {
        vibrate(20);
        setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== noteId) }));
      },

      // Google Drive sync is currently disabled — see src/screens/profile/settings-screen.tsx.
      // setGoogleAccount: (account) => setState((s) => ({ ...s, googleAccount: account })),

      // setLastGoogleSyncAt: (isoTimestamp) => setState((s) => ({ ...s, lastGoogleSyncAt: isoTimestamp })),

      // restoreFromGoogleBackup: (data) => {
      //   const partial = data && typeof data === 'object' ? (data as Partial<AppState>) : {};
      //   setState((s) => ({ ...defaultState(), ...partial, googleAccount: s.googleAccount, lastGoogleSyncAt: s.lastGoogleSyncAt }));
      // },

      startTimer: () => {
        vibrate(20);
        setState((s) => ({ ...s, timerStartedAt: Date.now() }));
      },

      stopTimer: () => {
        vibrate(20);
        setState((s) => {
          if (!s.timerStartedAt) return s;
          const elapsedH = Math.max(0, (Date.now() - s.timerStartedAt) / 3_600_000);
          const key = todayKey();
          const current = s.dailyLogs[key] || 0;
          return {
            ...s,
            timerStartedAt: null,
            dailyLogs: { ...s.dailyLogs, [key]: round2(current + elapsedH) },
          };
        });
      },

      setReportReminderEnabled: async (enabled) => {
        if (enabled) {
          const granted = await requestReportReminderPermissionAsync();
          if (!granted) return false;
          try {
            await scheduleMonthlyReportReminder(reminderContent());
            await scheduleLastDayOfMonthReminder(lastDayReminderContent());
          } catch {
            return false;
          }
          setState((s) => ({ ...s, reportReminderEnabled: true }));
          return true;
        }
        await cancelMonthlyReportReminder();
        await cancelLastDayOfMonthReminder();
        setState((s) => ({ ...s, reportReminderEnabled: false }));
        return true;
      },

      completeOnboarding: () =>
        setState((s) => ({ ...s, onboardingDone: true, lastReportedMonth: previousMonthKey(currentMonthKey()) })),
      skipOnboarding: () =>
        setState((s) => ({ ...s, onboardingDone: true, lastReportedMonth: previousMonthKey(currentMonthKey()) })),
      restartOnboarding: () => setState((s) => ({ ...s, onboardingDone: false })),

      resetAllData: () => {
        cancelMonthlyReportReminder().catch(() => {});
        cancelLastDayOfMonthReminder().catch(() => {});
        setState(defaultState());
      },

      seedDummyData: () => {
        if (!__DEV__) return;
        const seed = buildDummySeed();
        setState((s) => ({
          ...s,
          name: seed.name,
          role: seed.role,
          onboardingDone: true,
          dailyLogs: { ...s.dailyLogs, ...seed.dailyLogs },
          // Re-seeding replaces only the previously-seeded contacts, so it stays
          // idempotent without touching any real contacts added since.
          contacts: [...s.contacts.filter((c) => !c.id.startsWith(DUMMY_CONTACT_PREFIX)), ...seed.contacts],
          // Simulates a realistic "haven't confirmed last month's report yet"
          // backlog, so the reminder card shows up right away for testing.
          lastReportedMonth: previousMonthKey(previousMonthKey(currentMonthKey())),
        }));
      },
    }),
    [systemScheme]
  );

  const isDark = state.themePreference === 'system' ? systemScheme === 'dark' : state.themePreference === 'dark';
  const language =
    state.languagePreference === 'system' ? pickSupportedLanguage(systemLocales) : state.languagePreference;
  const uses24HourClock = systemCalendars[0]?.uses24hourClock ?? null;
  const effectiveRole = resolveEffectiveRole(state.role, state.auxPioneerSchedule, currentMonthKey());
  const runtimeState: RuntimeState = useMemo(
    () => ({ ...state, darkMode: isDark, language, effectiveRole, uses24HourClock }),
    [state, isDark, language, effectiveRole, uses24HourClock]
  );
  const value = useMemo(() => ({ state: runtimeState, ready, actions }), [runtimeState, ready, actions]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      if (i18next.language !== language) {
        await i18next.changeLanguage(language);
      }
      if (cancelled) return;
      // A scheduled notification's text is baked in at schedule time, so a live
      // language switch needs to re-schedule it to pick up the new translation.
      // This also re-arms the last-day-of-month reminder's one-off DATE trigger
      // for the current month's actual last day, since — unlike the 1st-of-month
      // reminder — the OS can't repeat it on a fixed day number on its own.
      if (state.reportReminderEnabled) {
        scheduleMonthlyReportReminder(reminderContent()).catch(() => {});
        scheduleLastDayOfMonthReminder(lastDayReminderContent()).catch(() => {});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language, ready, state.reportReminderEnabled]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
