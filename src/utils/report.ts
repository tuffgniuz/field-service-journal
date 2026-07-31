import i18next from '../i18n';
import { INTL_LOCALE_TAGS } from '../i18n/language';
import type { AppState, RuntimeState } from '../store/types';
import { currentMonthHours, studiesForMonth } from '../store/selectors';
import { currentMonthKey, monthLabel } from './dates';
import { fmtHours } from './format';

export function isPioneerRole(state: AppState): boolean {
  return state.role !== 'publisher';
}

export function recipientFirstName(state: AppState): string {
  const stripped = state.reportRecipient.replace(/^(Br\.|Sis\.)\s*/, '').trim();
  return stripped ? stripped.split(' ')[0] : '';
}

export function buildReportText(state: RuntimeState): string {
  const locale = INTL_LOCALE_TAGS[state.language];
  const hours = currentMonthHours(state);
  const studies = studiesForMonth(state, currentMonthKey());
  const isPioneer = isPioneerRole(state);
  const monthName = monthLabel(new Date(), locale);
  const monthShort = new Date().toLocaleDateString(locale, { month: 'long' });
  const name = recipientFirstName(state) || i18next.t('report.recipientFallbackName');

  if (state.reportTone === 'formal') {
    return isPioneer
      ? i18next.t('report.formalPioneer', { month: monthName, hours: fmtHours(hours), studies })
      : i18next.t('report.formalPublisher', {
          month: monthName,
          shared: state.participated ? i18next.t('common.yes') : i18next.t('common.no'),
          studies,
        });
  }
  return isPioneer
    ? i18next.t('report.conversationalPioneer', { name, month: monthShort, hours: fmtHours(hours), count: studies })
    : i18next.t('report.conversationalPublisher', { name, count: studies });
}
