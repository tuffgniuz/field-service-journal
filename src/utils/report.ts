import i18next from '../i18n';
import { INTL_LOCALE_TAGS } from '../i18n/language';
import type { AppState, RuntimeState } from '../store/types';
import { calculateReportHours, participatedFor, studiesForMonth } from '../store/selectors';
import { currentMonthKey, monthLabel, parseMonthKey } from './dates';
import { fmtHours } from './format';

export function isPioneerRole(state: RuntimeState): boolean {
  return state.effectiveRole !== 'publisher';
}

export function recipientFirstName(state: AppState): string {
  const stripped = state.reportRecipient.replace(/^(Br\.|Sis\.)\s*/, '').trim();
  return stripped ? stripped.split(' ')[0] : '';
}

export interface FormalReportParts {
  greeting: string;
  title: string;
  lines: string[];
  creditStatement: string | null;
}

export function buildFormalReportParts(state: RuntimeState, monthKey: string): FormalReportParts {
  const locale = INTL_LOCALE_TAGS[state.language];
  const calc = calculateReportHours(state, monthKey);
  const hours = calc.reportHours;
  const studies = studiesForMonth(state, monthKey);
  const isPioneer = isPioneerRole(state);
  const monthDate = parseMonthKey(monthKey);
  const monthName = monthLabel(monthDate, locale);
  const shared = participatedFor(state, monthKey) ? i18next.t('common.yes') : i18next.t('common.no');
  const name = recipientFirstName(state) || i18next.t('report.recipientFallbackName');

  const lines: string[] = [];
  if (isPioneer) lines.push(`${i18next.t('report.fieldServiceHours')}: ${fmtHours(hours)}`);
  else lines.push(`${i18next.t('report.sharedInMinistry')}: ${shared}`);
  if (studies > 0) lines.push(`${i18next.t('report.bibleStudies')}: ${studies}`);

  const creditStatement =
    isPioneer && state.creditHoursEnabled && state.creditHoursAmount > 0 && monthKey === currentMonthKey()
      ? i18next.t('report.creditHoursStatement', {
          hours: fmtHours(state.creditHoursAmount),
          source: state.creditHoursSource.trim() || i18next.t('report.creditHoursSourceFallback'),
        })
      : null;

  return {
    greeting: i18next.t('report.formalGreeting', { name }),
    title: i18next.t('report.formalTitle', { month: monthName }),
    lines,
    creditStatement,
  };
}

export function buildReportText(state: RuntimeState, monthKey: string): string {
  const locale = INTL_LOCALE_TAGS[state.language];
  const isPioneer = isPioneerRole(state);
  const calc = calculateReportHours(state, monthKey);
  const hours = calc.reportHours;
  const studies = studiesForMonth(state, monthKey);
  const monthDate = parseMonthKey(monthKey);
  const monthShort = monthDate.toLocaleDateString(locale, { month: 'long' });
  const name = recipientFirstName(state) || i18next.t('report.recipientFallbackName');
  const formal = buildFormalReportParts(state, monthKey);
  const hasStudies = studies > 0;

  if (state.reportTone === 'formal') {
    return [
      formal.greeting,
      '',
      formal.title,
      ...formal.lines,
      formal.creditStatement ?? null,
    ]
      .filter((line): line is string => line !== null)
      .join('\n');
  }

  if (isPioneer) {
    return (
      (hasStudies
        ? i18next.t('report.conversationalPioneer', {
            name,
            month: monthShort,
            hours: String(hours),
            count: studies,
          })
        : i18next.t('report.conversationalPioneerNoStudies', {
            name,
            month: monthShort,
            hours: String(hours),
          })) +
      (formal.creditStatement ? ` ${formal.creditStatement}` : '')
    );
  }
  return hasStudies
    ? i18next.t('report.conversationalPublisher', { name, count: studies })
    : i18next.t('report.conversationalPublisherNoStudies', { name });
}
