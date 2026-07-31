import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'report-reminders';
const REMINDER_ID = 'monthly-report-reminder';

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
