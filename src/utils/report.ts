import i18next from '../i18n';
import { INTL_LOCALE_TAGS } from '../i18n/language';
import type { AppState, RuntimeState } from '../store/types';
import { calculateReportHours, monthHoursFor, participatedFor, studiesForMonth } from '../store/selectors';
import { monthLabel, parseMonthKey } from './dates';
import { fmtHours } from './format';

export function isPioneerRole(state: RuntimeState): boolean {
  return state.effectiveRole !== 'publisher';
}

export function recipientFirstName(state: AppState): string {
  const stripped = state.reportRecipient.replace(/^(Br\.|Sis\.)\s*/, '').trim();
  return stripped ? stripped.split(' ')[0] : '';
}

export function buildReportText(state: RuntimeState, monthKey: string): string {
  const locale = INTL_LOCALE_TAGS[state.language];
  const calc = calculateReportHours(state, monthKey);
  const hours = calc.reportHours;
  const studies = studiesForMonth(state, monthKey);
  const isPioneer = isPioneerRole(state);
  const monthDate = parseMonthKey(monthKey);
  const monthName = monthLabel(monthDate, locale);
  const monthShort = monthDate.toLocaleDateString(locale, { month: 'long' });
  const name = recipientFirstName(state) || i18next.t('report.recipientFallbackName');

  const hasStudies = studies > 0;

  if (state.reportTone === 'formal') {
    if (isPioneer) {
      return hasStudies
        ? i18next.t('report.formalPioneer', { month: monthName, hours: String(hours), studies })
        : i18next.t('report.formalPioneerNoStudies', { month: monthName, hours: String(hours) });
    }
    const shared = participatedFor(state, monthKey) ? i18next.t('common.yes') : i18next.t('common.no');
    return hasStudies
      ? i18next.t('report.formalPublisher', { month: monthName, shared, studies })
      : i18next.t('report.formalPublisherNoStudies', { month: monthName, shared });
  }

  if (isPioneer) {
    return hasStudies
      ? i18next.t('report.conversationalPioneer', { name, month: monthShort, hours: String(hours), count: studies })
      : i18next.t('report.conversationalPioneerNoStudies', { name, month: monthShort, hours: String(hours) });
  }
  return hasStudies
    ? i18next.t('report.conversationalPublisher', { name, count: studies })
    : i18next.t('report.conversationalPublisherNoStudies', { name });
}
