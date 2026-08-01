import i18next from 'i18next';
import { formatRelativeTime, dateKey, todayKey } from './dates';

// Initialize i18next with English resources for test assertions
i18next.init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        dates: {
          now: 'now',
          minutesAgo_one: '1 minute ago',
          minutesAgo_other: '{{count}} minutes ago',
          hoursAgo_one: '1 hour ago',
          hoursAgo_other: '{{count}} hours ago',
          today: 'Today',
          yesterday: 'Yesterday',
          daysAgo_one: '1 day ago',
          daysAgo_other: '{{count}} days ago',
          weeksAgo_one: '1 week ago',
          weeksAgo_other: '{{count}} weeks ago',
          monthsAgo_one: '1 month ago',
          monthsAgo_other: '{{count}} months ago',
          yearsAgo_one: '1 year ago',
          yearsAgo_other: '{{count}} years ago',
        }
      }
    }
  }
});

function assertEqual(actual: string, expected: string, message: string) {
  if (actual !== expected) {
    throw new Error(`FAIL: ${message}\nExpected: "${expected}"\nActual:   "${actual}"`);
  }
  console.log(`PASS: ${message}`);
}

async function runTests() {
  console.log('Starting formatRelativeTime Unit Tests...\n');

  // Test "now"
  const nowISO = new Date().toISOString();
  assertEqual(formatRelativeTime(nowISO), 'now', 'Should format immediate ISO timestamp as "now"');

  // Test "minutesAgo"
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  assertEqual(formatRelativeTime(fiveMinsAgo), '5 minutes ago', 'Should format 5 minutes ago correctly');

  // Test "hoursAgo"
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  assertEqual(formatRelativeTime(threeHoursAgo), '3 hours ago', 'Should format 3 hours ago correctly');

  // Test "today" pure date
  const today = todayKey();
  assertEqual(formatRelativeTime(today), 'Today', 'Should format today date key as "Today"');

  // Test "yesterday" pure date
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = dateKey(yesterdayDate);
  assertEqual(formatRelativeTime(yesterday), 'Yesterday', 'Should format yesterday date key as "Yesterday"');

  // Test "daysAgo" (e.g. 4 days ago)
  const fourDaysDate = new Date();
  fourDaysDate.setDate(fourDaysDate.getDate() - 4);
  const fourDaysAgo = dateKey(fourDaysDate);
  assertEqual(formatRelativeTime(fourDaysAgo), '4 days ago', 'Should format 4 days ago correctly');

  // Test "weeksAgo" (e.g. 14 days ago -> 2 weeks ago)
  const fourteenDaysDate = new Date();
  fourteenDaysDate.setDate(fourteenDaysDate.getDate() - 14);
  const fourteenDaysAgo = dateKey(fourteenDaysDate);
  assertEqual(formatRelativeTime(fourteenDaysAgo), '2 weeks ago', 'Should format 14 days ago as "2 weeks ago"');

  // Test "monthsAgo" (e.g. 90 days ago -> 3 months ago)
  const ninetyDaysDate = new Date();
  ninetyDaysDate.setDate(ninetyDaysDate.getDate() - 90);
  const ninetyDaysAgo = dateKey(ninetyDaysDate);
  assertEqual(formatRelativeTime(ninetyDaysAgo), '3 months ago', 'Should format 90 days ago as "3 months ago"');

  // Test "yearsAgo" (e.g. 730 days ago -> 2 years ago)
  const twoYearsDate = new Date();
  twoYearsDate.setDate(twoYearsDate.getDate() - 730);
  const twoYearsAgo = dateKey(twoYearsDate);
  assertEqual(formatRelativeTime(twoYearsAgo), '2 years ago', 'Should format 730 days ago as "2 years ago"');

  console.log('\nAll formatRelativeTime Unit Tests Passed Successfully!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
