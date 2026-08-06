import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../theme/theme';
import type { Contact } from '../../store/types';
import { ACTIVITY_TYPE_KEYS, activityColorOption, type ScheduledActivityOccurrence } from '../../utils/schedule';
import { formatShortDate, todayKey } from '../../utils/dates';
import { formatTimeLabel } from '../../utils/time';
import { CheckIcon, ChevronRightIcon, PartnerIcon } from '../../components/data-display/icons';

/** Splits a localized time label (e.g. "9:00 AM") into a zero-padded clock part and its meridiem, for the stacked time display on the activity row. Falls back to a single line for 24-hour locales/settings, which have no meridiem to split off. */
function splitTimeLabel(label: string): { primary: string; meridiem: string | null } {
  const parts = label.trim().split(' ');
  if (parts.length === 2) {
    const [hm, meridiem] = parts;
    const [h, m] = hm.split(':');
    if (h && m) return { primary: `${h.padStart(2, '0')}:${m}`, meridiem };
  }
  return { primary: label, meridiem: null };
}

export function UpcomingActivitiesCard({
  theme,
  locale,
  activities,
  contacts,
  uses24HourClock,
  scheduledActivityHours,
  onViewSchedule,
  onCheckActivity,
  onUncheckActivity,
}: {
  theme: Theme;
  locale: string;
  activities: ScheduledActivityOccurrence[];
  contacts: Contact[];
  uses24HourClock: boolean | null;
  scheduledActivityHours: Record<string, number>;
  onViewSchedule: () => void;
  onCheckActivity: (activity: ScheduledActivityOccurrence, title: string) => void;
  onUncheckActivity: (activity: ScheduledActivityOccurrence) => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.secondaryText }]}>{t('log.upcomingActivities')}</Text>
        <Pressable onPress={onViewSchedule} hitSlop={8} style={styles.viewScheduleBtn}>
          <Text style={[styles.viewScheduleLabel, { color: theme.accent }]}>{t('log.viewSchedule')}</Text>
          <ChevronRightIcon color={theme.accent} size={13} />
        </Pressable>
      </View>

      {activities.length === 0 ? (
        <View style={[styles.emptyCard, { borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
            {t('log.noUpcomingActivities')}
          </Text>
        </View>
      ) : null}

      {activities.map((activity) => {
        const contactName = activity.contactId ? contacts.find((c) => c.id === activity.contactId)?.name : null;
        const typeLabel = t(ACTIVITY_TYPE_KEYS[activity.type]);
        const title = contactName || activity.location || typeLabel;
        const accent = activityColorOption(activity.color)?.swatch ?? theme.secondaryText;
        const timeLabel = formatTimeLabel(activity.time, locale, '', uses24HourClock);
        const { primary, meridiem } = splitTimeLabel(timeLabel);
        const endLabel = activity.endTime ? formatTimeLabel(activity.endTime, locale, '', uses24HourClock) : '';
        const isToday = activity.occurrenceDate === todayKey();
        const dateLabel = isToday ? t('log.today') : formatShortDate(activity.occurrenceDate, locale, false);
        const partners = activity.partners
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);
        const checked = `${activity.id}_${activity.occurrenceDate}` in scheduledActivityHours;

        return (
          <View key={activity.id} style={[styles.row, { backgroundColor: theme.card }]}>
            <View style={[styles.bar, { backgroundColor: accent }]} />
            <View style={styles.contentCol}>
              <View style={styles.mainRow}>
                <View style={[styles.body, isToday && styles.bodyWithCheckbox]}>
                  <Text style={[styles.type, { color: accent }]} numberOfLines={1}>
                    {typeLabel}
                  </Text>
                  <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                    {title}
                  </Text>
                  {partners.length > 0 ? (
                    <View style={styles.partnerRow}>
                      {partners.map((p, pi) => (
                        <View key={pi} style={[styles.partnerPill, { borderColor: theme.border }]}>
                          <PartnerIcon color={theme.secondaryText} size={11} />
                          <Text style={[styles.partnerLabel, { color: theme.secondaryText }]} numberOfLines={1}>
                            {p}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
                <View style={styles.timeCol}>
                  <Text style={[styles.date, { color: theme.secondaryText }]} numberOfLines={1}>
                    {dateLabel}
                  </Text>
                  {endLabel ? (
                    <Text style={[styles.timeRange, { color: theme.text }]} numberOfLines={1}>
                      {timeLabel} – {endLabel}
                    </Text>
                  ) : (
                    <>
                      {primary ? <Text style={[styles.time, { color: theme.text }]}>{primary}</Text> : null}
                      {meridiem ? <Text style={[styles.meridiem, { color: theme.secondaryText }]}>{meridiem}</Text> : null}
                    </>
                  )}
                </View>
              </View>

              {isToday ? (
                <View style={styles.checkboxRow}>
                  <Pressable
                    onPress={() => (checked ? onUncheckActivity(activity) : onCheckActivity(activity, title))}
                    hitSlop={8}
                    accessibilityLabel={t('log.markActivityDoneAccessibility')}
                    style={[
                      styles.checkbox,
                      { borderColor: checked ? theme.accent : theme.border, backgroundColor: checked ? theme.accent : 'transparent' },
                    ]}
                  >
                    {checked ? <CheckIcon color={theme.accentText} size={12} /> : null}
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  viewScheduleBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewScheduleLabel: { fontSize: 12.5, fontWeight: '600' },
  emptyCard: {
    borderWidth: 1,
    borderStyle: 'dotted',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontSize: 13, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'stretch', borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  bar: { width: 3.5 },
  contentCol: { flex: 1 },
  mainRow: { flexDirection: 'row', alignItems: 'stretch' },
  body: { flex: 1, paddingTop: 12, paddingBottom: 12, paddingHorizontal: 14, justifyContent: 'flex-start' },
  bodyWithCheckbox: { paddingBottom: 2 },
  checkboxRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 14, paddingBottom: 10, paddingTop: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  type: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
  name: { fontSize: 14.5, fontWeight: '700' },
  partnerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  partnerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  partnerLabel: { fontSize: 11, fontWeight: '600', flexShrink: 1 },
  timeCol: { alignItems: 'flex-end', justifyContent: 'flex-start', paddingTop: 12, paddingLeft: 8, paddingRight: 14 },
  date: { fontSize: 10.5, fontWeight: '600', marginBottom: 2 },
  time: { fontSize: 13.5, fontWeight: '700' },
  meridiem: { fontSize: 10.5, fontWeight: '600', marginTop: 1 },
  timeRange: { fontSize: 12, fontWeight: '700' },
});
