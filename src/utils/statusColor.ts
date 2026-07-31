import type { Theme } from '../theme/theme';
import type { ContactStatus } from '../store/types';

export function statusColor(theme: Theme, status: ContactStatus): string {
  return status === 'return_visit' ? theme.secondaryText : theme.accent;
}
