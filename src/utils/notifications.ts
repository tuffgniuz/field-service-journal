import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'report-reminders';
const REMINDER_ID = 'monthly-report-reminder';
const LAST_DAY_REMINDER_ID = 'last-day-of-month-reminder';

let handlerConfigured = false;

/** Controls whether a notification is shown while the app is open. Safe to call multiple times. */
export function configureNotificationHandler() {
  if (handlerConfigured || Platform.OS === 'web') return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannelAsync(channelName: string) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: channelName,
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Requests notification permission if needed. Returns whether it's granted. */
export async function requestReportReminderPermissionAsync(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export interface ReminderContent {
  channelName: string;
  title: string;
  body: string;
}

/** (Re)schedules the recurring reminder for the 1st of every month at 9am, in the given language. Idempotent. */
export async function scheduleMonthlyReportReminder(content: ReminderContent): Promise<void> {
  if (Platform.OS === 'web') return;
  await ensureAndroidChannelAsync(content.channelName);
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: content.title,
      body: content.body,
      data: { type: 'monthly-report-reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
      day: 1,
      hour: 9,
      minute: 0,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelMonthlyReportReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
}

export function isReportReminderNotification(data: Record<string, unknown> | undefined): boolean {
  return !!data && data.type === 'monthly-report-reminder';
}

/**
 * 6am on the last day of the given month. Passing `new Date(year, month0 + 1, 0)`
 * (day 0 of next month) is the standard JS Date trick for "last day of this
 * month" — it also correctly rolls the year over when month0 is 11 (December).
 */
function lastDayOfMonthAt6am(year: number, month0: number): Date {
  return new Date(year, month0 + 1, 0, 6, 0, 0, 0);
}

/** The next upcoming last-day-of-month-at-6am instant — this month's if it hasn't passed yet, otherwise next month's. */
export function nextLastDayOfMonthReminderDate(nowMs: number = Date.now()): Date {
  const now = new Date(nowMs);
  const thisMonth = lastDayOfMonthAt6am(now.getFullYear(), now.getMonth());
  if (thisMonth.getTime() > nowMs) return thisMonth;
  return lastDayOfMonthAt6am(now.getFullYear(), now.getMonth() + 1);
}

/**
 * (Re)schedules a one-off reminder for 6am on the last day of the current
 * month. Unlike the 1st-of-month reminder, the last day isn't a fixed day
 * number the OS can repeat on its own (28–31 depending on the month), so this
 * schedules a single DATE trigger for the next occurrence rather than a
 * recurring one — callers re-invoke this on every app open (see AppContext's
 * language-sync effect) so it keeps rolling forward month to month. Idempotent.
 */
export async function scheduleLastDayOfMonthReminder(content: ReminderContent): Promise<void> {
  if (Platform.OS === 'web') return;
  await ensureAndroidChannelAsync(content.channelName);
  await Notifications.cancelScheduledNotificationAsync(LAST_DAY_REMINDER_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: LAST_DAY_REMINDER_ID,
    content: {
      title: content.title,
      body: content.body,
      data: { type: 'last-day-of-month-reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextLastDayOfMonthReminderDate(),
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelLastDayOfMonthReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(LAST_DAY_REMINDER_ID).catch(() => {});
}

export function isLastDayOfMonthReminderNotification(data: Record<string, unknown> | undefined): boolean {
  return !!data && data.type === 'last-day-of-month-reminder';
}
