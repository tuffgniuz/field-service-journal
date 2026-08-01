import { useTranslation } from 'react-i18next';
import type { ContactStatus } from '../store/types';

export function useStatusMeta(): Record<ContactStatus, string> {
  const { t } = useTranslation();
  return {
    return_visit: t('status.returnVisit'),
    bible_study: t('status.bibleStudy'),
  };
}
