import type { Theme } from '../theme/theme';
import type { ContactStatus } from '../store/types';

export function statusColor(theme: Theme, status: ContactStatus): string {
  if (status === 'return_visit') return theme.secondaryText;
  if (status === 'bible_study') return theme.accent;
  return theme.gold;
}
