const DEFAULT_HOUR = 9;

function timeParts(time: string): { hours: number; minutes: number } | null {
  const match = time.trim().match(/^(\d{1,2})(?:(:|\.)(\d{2}))?\s*(AM|PM|am|pm)?$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = match[3] ? Number(match[3]) : 0;
  const meridiem = match[4]?.toUpperCase();

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (minutes < 0 || minutes > 59) return null;

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  if (hours < 0 || hours > 23) return null;
  return { hours, minutes };
}

export function timeStringToDate(time: string): Date {
  const parsed = timeParts(time);
  const date = new Date(1970, 0, 1, DEFAULT_HOUR, 0, 0, 0);
  if (parsed) date.setHours(parsed.hours, parsed.minutes, 0, 0);
  return date;
}

export function timeDateToStorage(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatTimeLabel(
  time: string,
  locale: string,
  fallback = '',
  uses24HourClock: boolean | null = null
): string {
  if (!time.trim()) return fallback;
  return timeStringToDate(time).toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    ...(uses24HourClock === null ? {} : { hour12: !uses24HourClock }),
  });
}
