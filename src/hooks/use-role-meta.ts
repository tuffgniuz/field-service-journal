import { useTranslation } from 'react-i18next';
import type { Role } from '../store/types';

export function useRoleMeta(): Record<Role, string> {
  const { t } = useTranslation();
  return {
    publisher: t('roles.publisher'),
    aux_pioneer: t('roles.auxPioneer'),
    regular_pioneer: t('roles.regularPioneer'),
    special_pioneer: t('roles.specialPioneer'),
  };
}
