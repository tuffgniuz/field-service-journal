import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as Localization from 'expo-localization';
import i18next from '../i18n';
import type {
  AppState,
  BaseRole,
  Contact,
  ContactStatus,
  LanguagePreference,
  ReportTone,
  RuntimeState,
  ThemePreference,
  Visit,
} from './types';
import { defaultState } from './defaults';
import { loadState, saveState } from './storage';
import { currentMonthKey, currentServiceYearLabel, previousMonthKey, todayKey } from '../utils/dates';
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
  saveVisit: (contactId: string, visit: VisitDraft, editingVisitId?: string | null) => void;
  deleteVisit: (contactId: string, visitId: string) => void;
  addHours: (dateKey: string, deltaHours: number) => void;
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState());
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Subscribes to live OS appearance changes (e.g. scheduled dark mode kicking in
  // while the app is open), not just the value at first launch.
  const systemScheme = useColorScheme();
  // Subscribes to live OS locale changes, mirroring the appearance pattern above.
  const systemLocales = Localization.useLocales();

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
            },
          ],
        }));
        return id;
      },

      updateContact: (contactId, draft) =>
        setState((s) => ({
          ...s,
          contacts: s.contacts.map((c) =>
            c.id === contactId
              ? {
                  ...c,
                  name: draft.name.trim() || i18next.t('addContact.unnamedFallback'),
                  status: draft.status,
                  publication: draft.publication?.trim() || '',
                  address: draft.address?.trim() || '',
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
  const effectiveRole = resolveEffectiveRole(state.role, state.auxPioneerSchedule, currentMonthKey());
  const runtimeState: RuntimeState = useMemo(
    () => ({ ...state, darkMode: isDark, language, effectiveRole }),
    [state, isDark, language, effectiveRole]
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
