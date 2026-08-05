import React, { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { themeFor } from '../../theme/theme';
import { ActivityTypeIcon, CalendarIcon, CheckIcon, PartnerIcon } from '../../components/data-display/icons';
import { Chip } from '../../components/data-display/chip';
import { dateKey, monthByOffset, monthKeyOf, monthLabel, todayKey } from '../../utils/dates';
import {
  ACTIVITY_TYPE_KEYS,
  activitiesOnDate,
  activityCardBg,
  activityCardSecondaryTextColor,
  activityCardTextColor,
  currentWeekStart,
  shiftWeek,
  weekDates,
  weekStartOf,
} from '../../utils/schedule';
import { formatTimeLabel } from '../../utils/time';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import type { ActivityType, ScheduledActivity } from '../../store/types';
import type { TabScreenNavProp } from '../../navigation/types';

/**
 * How far past today's week the agenda spans going forward — a wide-but-
 * bounded window that reads as "infinite" without unbounded rendering. The
 * list is anchored at the current week (no history before it); past activity
 * already lives on the Profile tab's Recent Activity feed.
 */
const RANGE_MONTHS_FORWARD = 6;

const FILTER_ORDER: Array<ActivityType | 'meeting'> = [
  'meeting',
  'bible_study',
  'return_visit',
  'field_service',
  'cart',
  'street',
  'other',
];

type MonthRow = { kind: 'month'; key: string; monthDate: Date };
type WeekRangeRow = { kind: 'weekRange'; key: string; weekStart: Date };
type DayRow = { kind: 'day'; key: string; date: Date; meetingVisible: boolean; activities: ScheduledActivity[] };
type ScheduleRow = MonthRow | WeekRangeRow | DayRow;

function rowDate(row: ScheduleRow): Date {
  return row.kind === 'month' ? row.monthDate : row.kind === 'weekRange' ? row.weekStart : row.date;
}

/** e.g. "Aug 2 – 8" (no year, matching the agenda's inline week dividers). */
function formatWeekRangeShort(weekStart: Date, locale: string): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  const startLabel = weekStart.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  const endLabel = sameMonth ? String(end.getDate()) : end.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  return `${startLabel} – ${endLabel}`;
}

function buildScheduleRows(
  state: { meetingSchedule: { dayOfWeek: number; enabled: boolean }[]; scheduledActivities: ScheduledActivity[] },
  activeFilters: Set<ActivityType | 'meeting'>,
  rangeStart: Date,
  rangeEndExclusive: Date
): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  let lastMonthKey = '';
  let cursor = new Date(rangeStart);

  while (cursor < rangeEndExclusive) {
    const mKey = monthKeyOf(cursor);
    if (mKey !== lastMonthKey) {
      lastMonthKey = mKey;
      rows.push({ kind: 'month', key: `m-${mKey}`, monthDate: new Date(cursor) });
    }

    const dayRows: DayRow[] = [];
    for (const d of weekDates(cursor)) {
      const key = dateKey(d);
      const meetingDay = state.meetingSchedule[d.getDay()];
      const meetingVisible = Boolean(meetingDay?.enabled) && (activeFilters.size === 0 || activeFilters.has('meeting'));
      const activities = activitiesOnDate(state.scheduledActivities, key).filter(
        (a) => activeFilters.size === 0 || activeFilters.has(a.type)
      );
      if (meetingVisible || activities.length > 0) {
        dayRows.push({ kind: 'day', key: `d-${key}`, date: d, meetingVisible, activities });
      }
    }

    if (dayRows.length === 0) {
      rows.push({ kind: 'weekRange', key: `w-${dateKey(cursor)}`, weekStart: new Date(cursor) });
    } else {
      rows.push(...dayRows);
    }
    cursor = shiftWeek(cursor, 1);
  }

  return rows;
}

export function ScheduleScreen({ navigation }: { navigation: TabScreenNavProp<'Schedule'> }) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const theme = themeFor(state.darkMode);
  const locale = INTL_LOCALE_TAGS[state.language];
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ScheduleRow>>(null);
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const [activeFilters, setActiveFilters] = useState<Set<ActivityType | 'meeting'>>(new Set());
  const [visibleMonthLabel, setVisibleMonthLabel] = useState(() => monthLabel(new Date(), locale));

  const { rangeStart, rangeEndExclusive } = useMemo(
    () => ({
      rangeStart: currentWeekStart(),
      rangeEndExclusive: weekStartOf(monthByOffset(RANGE_MONTHS_FORWARD + 1)),
    }),
    []
  );

  const rows = useMemo(
    () => buildScheduleRows(state, activeFilters, rangeStart, rangeEndExclusive),
    [state.meetingSchedule, state.scheduledActivities, activeFilters, rangeStart, rangeEndExclusive]
  );

  // The list is anchored at the current week (index 0), so "back to today" is just the top —
  // no item-index measurement needed, which `scrollToIndex` can't do reliably without fixed row heights.
  const scrollToToday = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ item: ScheduleRow }> }) => {
    const first = viewableItems[0]?.item;
    if (!first) return;
    setVisibleMonthLabel(monthLabel(rowDate(first), localeRef.current));
  }).current;

  const toggleFilter = (key: ActivityType | 'meeting') => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filterLabel = (key: ActivityType | 'meeting') => (key === 'meeting' ? t('schedule.filterMeeting') : t(ACTIVITY_TYPE_KEYS[key]));

  const renderRow = ({ item }: { item: ScheduleRow }) => {
    if (item.kind === 'month') {
      return (
        <View style={styles.monthDivider}>
          <Text style={[styles.monthDividerText, { color: theme.text }]}>{monthLabel(item.monthDate, locale)}</Text>
        </View>
      );
    }

    if (item.kind === 'weekRange') {
      return (
        <Text style={[styles.weekRangeText, { color: theme.secondaryText }]}>
          {formatWeekRangeShort(item.weekStart, locale)}
        </Text>
      );
    }

    const date = item.date;
    const key = dateKey(date);
    const dow = date.getDay();
    const meetingDay = state.meetingSchedule[dow];
    const meetingLocationOverride = state.meetingLocationOverrides[key];
    const meetingLocation = meetingLocationOverride ?? meetingDay?.location ?? '';
    const meetingConductor = state.meetingConductorOverrides[key] ?? '';
    const attended = Boolean(state.meetingAttendance[key]);
    const isToday = key === todayKey();

    return (
      <View style={styles.dayRow}>
        <View style={styles.dateCol}>
          <Text style={[styles.dateDow, { color: theme.secondaryText }]}>
            {date.toLocaleDateString(locale, { weekday: 'short' })}
          </Text>
          <View style={[styles.dateBadge, isToday ? { backgroundColor: theme.accent } : null]}>
            <Text style={[styles.dateBadgeNumber, { color: isToday ? theme.accentText : theme.text }]}>{date.getDate()}</Text>
          </View>
        </View>

        <View style={styles.cardsCol}>
          <Pressable onPress={() => navigation.navigate('AddActivity', { date: key })} hitSlop={8} style={styles.addLinkRow}>
            <Text style={[styles.addLink, { color: theme.accent }]}>{t('schedule.addLink')}</Text>
          </Pressable>

          {item.meetingVisible ? (
            <Pressable
              onPress={() => actions.toggleMeetingAttendance(key)}
              accessibilityLabel={t('schedule.attendedAccessibility')}
              style={[
                styles.card,
                {
                  backgroundColor: activityCardBg(state.meetingColor, theme.card),
                  opacity: attended ? 1 : 0.7,
                },
              ]}
            >
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, { color: theme.accentText }]}>{t('schedule.meetingForFieldService')}</Text>
                  {attended ? <CheckIcon color={activityCardTextColor(state.meetingColor, theme.accent)} size={13} /> : null}
                </View>
                <Text style={[styles.cardSub, { color: activityCardSecondaryTextColor(state.meetingColor, theme.secondaryText) }]}>
                  {formatTimeLabel(meetingDay.time, locale, '', state.uses24HourClock)}
                  {meetingLocation ? ` · ${meetingLocation}` : ''}
                </Text>
                {meetingConductor ? (
                  <Text style={[styles.cardSub, { color: activityCardSecondaryTextColor(state.meetingColor, theme.secondaryText) }]}>
                    {t('schedule.conductedBy', { name: meetingConductor })}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ) : null}

          {item.activities.map((activity) => {
          const contact = activity.contactId ? state.contacts.find((c) => c.id === activity.contactId) : null;
          const typeLabel = t(ACTIVITY_TYPE_KEYS[activity.type]);
          const title = contact ? t('schedule.activityWithContact', { type: typeLabel, name: contact.name }) : typeLabel;
          const timeLabel = activity.endTime
            ? `${formatTimeLabel(activity.time, locale, '', state.uses24HourClock)}-${formatTimeLabel(
                activity.endTime,
                locale,
                '',
                state.uses24HourClock
              )}`
            : formatTimeLabel(activity.time, locale, '', state.uses24HourClock);
          const partners = activity.partners
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean);

          return (
            <Pressable
              key={activity.id}
              onPress={() => navigation.navigate('AddActivity', { activityId: activity.id })}
              style={[styles.card, { backgroundColor: activityCardBg(activity.color, theme.card) }]}
            >
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <ActivityTypeIcon
                    type={activity.type}
                    color={activityCardSecondaryTextColor(activity.color, theme.secondaryText)}
                    size={14}
                  />
                  <Text style={[styles.cardTitle, { color: theme.accentText }]} numberOfLines={1}>
                    {title}
                  </Text>
                </View>
                <Text
                  style={[styles.cardSub, { color: activityCardSecondaryTextColor(activity.color, theme.secondaryText) }]}
                  numberOfLines={1}
                >
                  {timeLabel}
                  {activity.location ? ` · ${activity.location}` : ''}
                </Text>
                {partners.length > 0 ? (
                  <View style={styles.partnerRow}>
                    {partners.map((p, pi) => (
                      <View
                        key={pi}
                        style={[styles.partnerPill, { borderColor: activityCardSecondaryTextColor(activity.color, theme.border) }]}
                      >
                        <PartnerIcon color={activityCardSecondaryTextColor(activity.color, theme.secondaryText)} size={12} />
                        <Text
                          style={[styles.partnerLabel, { color: activityCardSecondaryTextColor(activity.color, theme.secondaryText) }]}
                          numberOfLines={1}
                        >
                          {p}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <View style={[styles.headerRow, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: theme.text }]}>{visibleMonthLabel}</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={scrollToToday} style={[styles.todayPill, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.todayPillLabel, { color: theme.text }]}>{t('schedule.todayPill')}</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('MeetingSchedule')}
            hitSlop={8}
            accessibilityLabel={t('schedule.editMeetingLink', { meeting: t('schedule.meetingForFieldService') })}
            style={[styles.iconBtn, { borderColor: theme.border }]}
          >
            <CalendarIcon color={theme.secondaryText} size={16} />
          </Pressable>
        </View>
      </View>

      <View style={styles.filterListWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
          contentContainerStyle={styles.filterListContent}
        >
          {FILTER_ORDER.map((item) => {
            const active = activeFilters.has(item);
            return (
              <Chip
                key={item}
                label={filterLabel(item)}
                onPress={() => toggleFilter(item)}
                borderColor={active ? theme.accent : theme.border}
                color={active ? theme.accent : theme.secondaryText}
                fontSize={12}
              />
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        ref={listRef}
        data={rows}
        keyExtractor={(r) => r.key}
        renderItem={renderRow}
        initialNumToRender={20}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 0 }}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}
      />

      <Pressable
        onPress={() => navigation.navigate('AddActivity')}
        accessibilityLabel={t('schedule.addActivityAccessibility')}
        style={[
          styles.fab,
          { backgroundColor: theme.accent, shadowColor: theme.accentShadow, bottom: insets.bottom + 20 },
        ]}
      >
        <Text style={[styles.fabLabel, { color: theme.accentText }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { paddingHorizontal: 24 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, flexShrink: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  todayPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  todayPillLabel: { fontSize: 12.5, fontWeight: '600' },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterListWrap: { height: 44, marginBottom: 12 },
  filterList: { flex: 1 },
  filterListContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 8 },
  monthDivider: { paddingVertical: 10 },
  monthDividerText: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  weekRangeText: { fontSize: 12.5, paddingVertical: 10 },
  dayRow: { flexDirection: 'row', gap: 12, paddingTop: 10, paddingBottom: 4 },
  dateCol: { width: 44, alignItems: 'center', gap: 4, paddingTop: 2 },
  dateDow: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  dateBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadgeNumber: { fontSize: 15, fontWeight: '700' },
  cardsCol: { flex: 1, minWidth: 0 },
  addLinkRow: { alignItems: 'flex-end', marginBottom: 8 },
  addLink: { fontSize: 13, fontWeight: '600' },
  card: { borderRadius: 12, padding: 12, marginBottom: 10 },
  cardBody: { flex: 1, gap: 3 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  cardSub: { fontSize: 12.5 },
  partnerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
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
  fab: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  fabLabel: { fontSize: 26, fontWeight: '400', lineHeight: 28 },
});
