import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Contact } from '../../store/types';
import type { Theme } from '../../theme/theme';
import { formatShortDate } from '../../utils/dates';
import { fmtHours } from '../../utils/format';
import {
  ACTIVITY_TYPE_KEYS,
  activityColorOption,
  type MonthlyMinistryProjection,
} from '../../utils/schedule';
import { formatTimeLabel } from '../../utils/time';

function activityDateLabel(dateKey: string, locale: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  const weekday = date.toLocaleDateString(locale, { weekday: 'short' });
  return `${weekday}, ${formatShortDate(dateKey, locale, false)}`;
}

export function PlannedMinistryCard({
  theme,
  locale,
  monthName,
  projection,
  contacts,
  uses24HourClock,
  onViewSchedule,
}: {
  theme: Theme;
  locale: string;
  monthName: string;
  projection: MonthlyMinistryProjection;
  contacts: Contact[];
  uses24HourClock: boolean | null;
  onViewSchedule: () => void;
}) {
  const { t } = useTranslation();
  const hasUpcoming = projection.upcoming.length > 0;

  return (
    <View style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={[styles.label, { color: theme.secondaryText }]}>
            {t('profile.plannedMinistryTitle')}
          </Text>
          <Text style={[styles.month, { color: theme.text }]}>{monthName}</Text>
        </View>
        <Pressable onPress={onViewSchedule} hitSlop={8}>
          <Text style={[styles.scheduleLink, { color: theme.accent }]}>
            {t('profile.plannedMinistryScheduleLink')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.projectedBlock}>
          <Text style={[styles.projectedValue, { color: theme.text }]}>
            {t('profile.hoursValue', { hours: fmtHours(projection.projectedHours) })}
          </Text>
          <Text style={[styles.projectedLabel, { color: theme.secondaryText }]}>
            {t('profile.plannedMinistryProjected')}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {hasUpcoming ? (
        <ScrollView
          style={styles.activities}
          contentContainerStyle={styles.activitiesContent}
          nestedScrollEnabled
          showsVerticalScrollIndicator={projection.upcoming.length > 3}
        >
          {projection.upcoming.map((activity) => {
            const contactName = activity.contactId
              ? contacts.find((contact) => contact.id === activity.contactId)?.name
              : null;
            const typeLabel = t(ACTIVITY_TYPE_KEYS[activity.type]);
            const title = contactName || activity.location || typeLabel;
            const accent = activityColorOption(activity.color)?.swatch ?? theme.secondaryText;
            const startLabel = formatTimeLabel(activity.time, locale, '', uses24HourClock);
            const endLabel = activity.endTime ? formatTimeLabel(activity.endTime, locale, '', uses24HourClock) : '';

            return (
              <View key={`${activity.id}-${activity.occurrenceDate}`} style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: accent }]} />
                <View style={styles.activityBody}>
                  <Text style={[styles.activityTitle, { color: theme.text }]} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={[styles.activityMeta, { color: theme.secondaryText }]} numberOfLines={1}>
                    {typeLabel} · {activityDateLabel(activity.occurrenceDate, locale)}
                    {startLabel ? ` · ${startLabel}${endLabel ? `-${endLabel}` : ''}` : ''}
                  </Text>
                </View>
                <Text style={[styles.activityHours, { color: theme.text }]} numberOfLines={1}>
                  {activity.durationHours === null
                    ? t('profile.plannedMinistryNeedsTime')
                    : t('profile.hoursValue', { hours: fmtHours(activity.durationHours) })}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
          {t('profile.plannedMinistryEmpty', { month: monthName })}
        </Text>
      )}

      {projection.incompleteCount > 0 ? (
        <Text style={[styles.incompleteText, { color: theme.secondaryText }]}>
          {t('profile.plannedMinistryIncomplete', { count: projection.incompleteCount })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerText: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  month: { fontSize: 14.5, fontWeight: '700', marginTop: 3 },
  scheduleLink: { fontSize: 12.5, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 16 },
  projectedBlock: { minWidth: 92 },
  projectedValue: { fontSize: 24, fontWeight: '800', includeFontPadding: false },
  projectedLabel: { fontSize: 12, marginTop: 3 },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 16, marginBottom: 12 },
  activities: { maxHeight: 144 },
  activitiesContent: { gap: 12 },
  activityRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 10 },
  activityDot: { width: 7, height: 7, borderRadius: 3.5 },
  activityBody: { flex: 1, minWidth: 0 },
  activityTitle: { fontSize: 13.5, fontWeight: '700' },
  activityMeta: { fontSize: 11.5, marginTop: 2 },
  activityHours: { fontSize: 12.5, fontWeight: '700', marginLeft: 8, maxWidth: 78, textAlign: 'right' },
  emptyText: { fontSize: 13, lineHeight: 18 },
  incompleteText: { fontSize: 11.5, lineHeight: 16, marginTop: 12 },
});
