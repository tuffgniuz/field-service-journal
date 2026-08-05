import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../theme/theme';
import type { RecentActivityEntry } from '../../store/selectors';
import { ACTIVITY_TYPE_KEYS, activityColorOption } from '../../utils/schedule';
import { statusColor } from '../../utils/status-color';
import { daysSince, formatShortDate } from '../../utils/dates';

function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function RecentActivityCard({
  theme,
  locale,
  entries,
}: {
  theme: Theme;
  locale: string;
  entries: RecentActivityEntry[];
}) {
  const { t } = useTranslation();

  if (entries.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <Text style={[styles.title, { color: theme.secondaryText }]}>{t('profile.recentActivityTitle')}</Text>

      {entries.map((entry, i) => {
        const dotColor =
          entry.kind === 'bible_study' || entry.kind === 'return_visit'
            ? statusColor(theme, entry.kind)
            : entry.kind === 'meeting'
            ? activityColorOption(entry.color)?.swatch ?? theme.accent
            : entry.kind === 'hours'
            ? theme.gold
            : activityColorOption(entry.color)?.swatch ?? theme.secondaryText;

        const rowTitle =
          entry.kind === 'meeting'
            ? t('schedule.meetingForFieldService')
            : entry.kind === 'hours'
            ? t('report.fieldServiceHours')
            : entry.contactName
            ? t('schedule.activityWithContact', { type: t(ACTIVITY_TYPE_KEYS[entry.kind]), name: entry.contactName })
            : t(ACTIVITY_TYPE_KEYS[entry.kind]);

        const days = daysSince(entry.date);
        const dateLabel = days === 0 ? t('dates.today') : days === 1 ? t('dates.yesterday') : formatShortDate(entry.date, locale, false);
        const subtitle = entry.durationMinutes !== null ? `${dateLabel} · ${formatDurationMinutes(entry.durationMinutes)}` : dateLabel;

        return (
          <View
            key={entry.id}
            style={[styles.row, i > 0 ? { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth } : null]}
          >
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                {rowTitle}
              </Text>
              <Text style={[styles.rowSub, { color: theme.secondaryText }]} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 16, marginBottom: 28 },
  title: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  dot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 5 },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 14.5, fontWeight: '600' },
  rowSub: { fontSize: 12.5 },
});
