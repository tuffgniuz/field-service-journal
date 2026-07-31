import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as Localization from 'expo-localization';
import i18next from '../i18n';
import type {
  AppState,
  Contact,
  ContactStatus,
  LanguagePreference,
  ReportTone,
  RuntimeState,
  Role,
  ThemePreference,
  Visit,
} from './types';
import { defaultState } from './defaults';
import { loadState, saveState } from './storage';
import { currentMonthKey, currentServiceYearLabel, todayKey } from '../utils/dates';
import { pickSupportedLanguage } from '../i18n/language';
import {
  cancelMonthlyReportReminder,
  configureNotificationHandler,
  requestReportReminderPermissionAsync,
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

interface VisitDraft {
  date: string;
  covered: string;
  standout: string;
  reminderDays?: number | null;
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
  setRole: (r: Role) => void;
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
  toggleParticipated: () => void;
  /** Requests permission (if needed) and schedules/cancels the monthly reminder. Resolves false if permission was denied. */
  setReportReminderEnabled: (enabled: boolean) => Promise<boolean>;
  /** Tags the hours to the current service year, so they stop applying once a new one begins. */
  setServiceYearStartingHours: (hours: number) => void;
  addContact: (draft: ContactDraft) => string;
  setContactNotes: (contactId: string, notes: string) => void;
  cycleContactStatus: (contactId: string) => void;
  saveVisit: (contactId: string, visit: VisitDraft, editingVisitId?: string | null) => void;
  addHours: (dateKey: string, deltaHours: number) => void;
  startTimer: () => void;
  stopTimer: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  restartOnboarding: () => void;
  resetAllData: () => void;
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
      toggleParticipated: () =>
        setState((s) => {
          const participated = !s.participated;
          return {
            ...s,
            participated,
            monthlyParticipation: { ...s.monthlyParticipation, [currentMonthKey()]: participated },
          };
        }),
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
              notes: '',
              publication: draft.publication?.trim() || '',
              address: draft.address?.trim() || '',
              visits: [],
            },
          ],
        }));
        return id;
      },

      setContactNotes: (contactId, notes) =>
        setState((s) => ({
          ...s,
          contacts: s.contacts.map((c) => (c.id === contactId ? { ...c, notes } : c)),
        })),

      cycleContactStatus: (contactId) =>
        setState((s) => {
          const order: ContactStatus[] = ['return_visit', 'bible_study', 'family_study'];
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
              standout: visit.standout,
              reminderDays: visit.reminderDays ?? null,
            };
            const visits = editingVisitId
              ? c.visits.map((v) => (v.id === editingVisitId ? entry : v))
              : [...c.visits, entry];
            return { ...c, visits };
          }),
        }));
      },

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
          } catch {
            return false;
          }
          setState((s) => ({ ...s, reportReminderEnabled: true }));
          return true;
        }
        await cancelMonthlyReportReminder();
        setState((s) => ({ ...s, reportReminderEnabled: false }));
        return true;
      },

      completeOnboarding: () => setState((s) => ({ ...s, onboardingDone: true })),
      skipOnboarding: () => setState((s) => ({ ...s, onboardingDone: true })),
      restartOnboarding: () => setState((s) => ({ ...s, onboardingDone: false })),

      resetAllData: () => {
        cancelMonthlyReportReminder().catch(() => {});
        setState(defaultState());
      },
    }),
    [systemScheme]
  );

  const isDark = state.themePreference === 'system' ? systemScheme === 'dark' : state.themePreference === 'dark';
  const language =
    state.languagePreference === 'system' ? pickSupportedLanguage(systemLocales) : state.languagePreference;
  const runtimeState: RuntimeState = useMemo(
    () => ({ ...state, darkMode: isDark, language }),
    [state, isDark, language]
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
      if (state.reportReminderEnabled) {
        scheduleMonthlyReportReminder(reminderContent()).catch(() => {});
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
