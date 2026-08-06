import type { BaseRole, Contact, DailyLogs, Visit } from '../store/types';
import { dateKey, daysInMonth } from './dates';

/**
 * A repeating 7-slot rhythm (not tied to actual weekdays, just cycling by
 * day-of-month) with two rest days built in. Weekly sum is 13.5, which clears
 * 50 hours for every month length in the seeded range once multiplied out —
 * even the shortest, a 28-day February, lands at exactly 54.
 */
const DAY_PATTERN = [2.5, 0, 2, 3, 0, 3.5, 2.5];

function monthlyLogs(year: number, month0: number, throughDay?: number): DailyLogs {
  const lastDay = throughDay ?? daysInMonth(year, month0);
  const logs: DailyLogs = {};
  for (let day = 1; day <= lastDay; day++) {
    const hours = DAY_PATTERN[(day - 1) % DAY_PATTERN.length];
    if (hours > 0) logs[dateKey(new Date(year, month0, day))] = hours;
  }
  return logs;
}

function visit(id: string, date: string, covered: string): Visit {
  return { id, date, covered };
}

/** Prefix used to identify (and safely re-seed without duplicating) dummy contacts. */
export const DUMMY_CONTACT_PREFIX = 'dummy-';

export interface DummySeed {
  name: string;
  role: BaseRole;
  dailyLogs: DailyLogs;
  contacts: Contact[];
}

/**
 * Dev-only sample data: "Paul", a regular pioneer, with a full service-year
 * history from September 1 2025 (at least 50 logged hours every month — 50/mo
 * is exactly the regular-pioneer yearly goal of 600 divided over 12 months)
 * through last month, plus a partial current month through yesterday. Four
 * contacts — three recurring Bible studies, one return visit — each with a
 * handful of visits spread across the period.
 */
export function buildDummySeed(): DummySeed {
  const now = new Date();
  const dailyLogs: DailyLogs = {};

  let year = 2025;
  let month0 = 8; // September
  while (year < now.getFullYear() || (year === now.getFullYear() && month0 < now.getMonth())) {
    Object.assign(dailyLogs, monthlyLogs(year, month0));
    month0 += 1;
    if (month0 > 11) {
      month0 = 0;
      year += 1;
    }
  }
  Object.assign(dailyLogs, monthlyLogs(now.getFullYear(), now.getMonth(), Math.max(0, now.getDate() - 1)));

  const contacts: Contact[] = [
    {
      id: `${DUMMY_CONTACT_PREFIX}maria`,
      name: 'Maria Chen',
      status: 'bible_study',
      publication: 'lff',
      address: '',
      studyProgress: ['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4', 'lesson-5', 'lesson-6', 'lesson-7', 'lesson-8', 'lesson-9', 'lesson-10', 'lesson-11'],
      visits: [
        visit('dv-maria-1', '2025-10-04', 'Introduced the study, set expectations'),
        visit('dv-maria-2', '2025-11-15', 'Chapter 2 — why does God allow suffering'),
        visit('dv-maria-3', '2026-01-10', 'Chapter 4 — what is the Kingdom of God'),
        visit('dv-maria-4', '2026-03-07', 'Chapter 6 — the ransom'),
        visit('dv-maria-5', '2026-05-16', 'Chapter 7 — where are the dead'),
        visit('dv-maria-6', '2026-07-04', 'Chapter 8 — the Bible as a guide'),
        visit('dv-maria-7', '2026-07-25', 'Reviewed chapter 8, asked great questions'),
      ],
    },
    {
      id: `${DUMMY_CONTACT_PREFIX}david`,
      name: 'David Okafor',
      status: 'bible_study',
      publication: 'lff',
      address: '',
      studyProgress: ['lesson-1', 'lesson-2', 'lesson-3'],
      visits: [
        visit('dv-david-1', '2025-11-02', "Left a tract on the Bible's view of the future"),
        visit('dv-david-2', '2025-12-20', 'Started the study using the brochure'),
        visit('dv-david-3', '2026-02-14', 'Chapter 3 — who is Jesus Christ'),
        visit('dv-david-4', '2026-04-11', 'Chapter 5 — real hope for the dead'),
        visit('dv-david-5', '2026-06-13', 'Chapter 9 — draw close to God'),
        visit('dv-david-6', '2026-07-18', 'Reviewed material, engaged and asking questions'),
      ],
    },
    {
      id: `${DUMMY_CONTACT_PREFIX}alvarez`,
      name: 'The Alvarez Family',
      status: 'bible_study',
      publication: '',
      address: 'Apt 3C',
      studyProgress: [],
      visits: [
        visit('dv-alvarez-1', '2026-01-24', 'Kids asked to keep the picture book'),
        visit('dv-alvarez-2', '2026-03-21', "Talked through the family's questions on prayer"),
        visit('dv-alvarez-3', '2026-05-23', 'Watched a video together'),
        visit('dv-alvarez-4', '2026-07-11', 'Kids asked to keep the picture book again'),
      ],
    },
    {
      id: `${DUMMY_CONTACT_PREFIX}priya`,
      name: 'Priya Sharma',
      status: 'return_visit',
      publication: '',
      address: '',
      studyProgress: [],
      visits: [
        visit('dv-priya-1', '2025-12-06', 'Neighbor mentioned they work night shifts'),
        visit('dv-priya-2', '2026-04-18', "Said she'd be open to a follow-up"),
        visit('dv-priya-3', '2026-07-21', 'Has more questions, eager to continue'),
      ],
    },
  ];

  return { name: 'Paul', role: 'regular_pioneer', dailyLogs, contacts };
}
