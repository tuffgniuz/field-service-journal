import React, { useCallback, useMemo, useRef, useState, useTransition } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { themeFor, type Theme } from '../../theme/theme';
import { ActivityTypeIcon, CalendarIcon, CheckIcon, MapIcon, PartnerIcon } from '../../components/data-display/icons';
import { Chip } from '../../components/data-display/chip';
import { dateKey, monthByOffset, monthKeyOf, monthLabel, todayKey } from '../../utils/dates';
import {
  ACTIVITY_TYPE_KEYS,
  activitiesOnDate,
  activityColorOption,
  currentWeekStart,
  shiftWeek,
  weekDates,
  weekStartOf,
} from '../../utils/schedule';
import { formatTimeLabel } from '../../utils/time';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import type { ActivityType, Contact, MeetingScheduleDay, ScheduledActivity } from '../../store/types';
import type { TabScreenNavProp } from '../../navigation/types';

type TFn = ReturnType<typeof useTranslation>['t'];

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
type DayRow = { kind: 'day'; key: string; date: Date; meetingVisible: boolean; activities: ScheduledActivity[] };
type ScheduleRow = MonthRow | DayRow;

function rowDate(row: ScheduleRow): Date {
  return row.kind === 'month' ? row.monthDate : row.date;
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
    for (const d of weekDates(cursor)) {
      // Checked per-day (not per-week) so the divider lands exactly on the
      // 1st of the month even when that date falls mid-week, rather than at
      // the Monday of whichever week the 1st happens to be in.
      const mKey = monthKeyOf(d);
      if (mKey !== lastMonthKey) {
        lastMonthKey = mKey;
        rows.push({ kind: 'month', key: `m-${mKey}`, monthDate: new Date(d) });
      }

      const key = dateKey(d);
      const meetingDay = state.meetingSchedule[d.getDay()];
      const meetingVisible = Boolean(meetingDay?.enabled) && (activeFilters.size === 0 || activeFilters.has('meeting'));
      const activities = activitiesOnDate(state.scheduledActivities, key).filter(
        (a) => activeFilters.size === 0 || activeFilters.has(a.type)
      );
      rows.push({ kind: 'day', key: `d-${key}`, date: d, meetingVisible, activities });
    }
    cursor = shiftWeek(cursor, 1);
  }

  return rows;
}

/**
 * Memoized so scrolling (which re-renders ScheduleScreen on every visible-month
 * change) doesn't force every mounted month divider to redo its work — only
 * dividers whose props actually changed re-render.
 */
const MonthDividerRow = React.memo(function MonthDividerRow({
  monthDate,
  locale,
  color,
}: {
  monthDate: Date;
  locale: string;
  color: string;
}) {
  return (
    <View style={styles.monthDivider}>
      <Text style={[styles.monthDividerText, { color }]}>{monthLabel(monthDate, locale)}</Text>
    </View>
  );
});

/**
 * Memoized for the same reason as MonthDividerRow — this is by far the
 * heaviest cell (icons, colors, partner pills per activity), and the agenda
 * can have 150+ of them mounted, so skipping unchanged rows on unrelated
 * re-renders (e.g. scroll-driven header updates) matters a lot here.
 */
const DayRowItem = React.memo(function DayRowItem({
  item,
  theme,
  locale,
  t,
  meetingDay,
  meetingLocation,
  meetingConductor,
  attended,
  meetingColor,
  uses24HourClock,
  contacts,
  isToday,
  onToggleAttendance,
  onAddPress,
  onActivityPress,
}: {
  item: DayRow;
  theme: Theme;
  locale: string;
  t: TFn;
  meetingDay: MeetingScheduleDay | undefined;
  meetingLocation: string;
  meetingConductor: string;
  attended: boolean;
  meetingColor: string | null;
  uses24HourClock: boolean | null;
  contacts: Contact[];
  isToday: boolean;
  onToggleAttendance: () => void;
  onAddPress: () => void;
  onActivityPress: (activityId: string) => void;
}) {
  const date = item.date;

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
        {item.meetingVisible || item.activities.length > 0 ? (
          <Pressable onPress={onAddPress} hitSlop={8} style={styles.addLinkRow}>
            <Text style={[styles.addLink, { color: theme.accent }]}>{t('schedule.addLink')}</Text>
          </Pressable>
        ) : null}

        {item.meetingVisible && meetingDay ? (
          <Pressable
            onPress={onToggleAttendance}
            accessibilityLabel={t('schedule.attendedAccessibility')}
            style={[styles.card, { backgroundColor: theme.card, opacity: attended ? 1 : 0.7 }]}
          >
            <View style={[styles.cardBar, { backgroundColor: activityColorOption(meetingColor)?.swatch ?? theme.secondaryText }]} />
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text
                  style={[styles.cardType, { color: activityColorOption(meetingColor)?.swatch ?? theme.secondaryText, flex: 1 }]}
                  numberOfLines={1}
                >
                  {t('schedule.meetingForFieldService')}
                </Text>
                {attended ? <CheckIcon color={theme.accent} size={13} /> : null}
              </View>
              {meetingConductor ? (
                <Text style={[styles.cardSub, { color: theme.text }]}>
                  {t('schedule.conductedBy', { name: meetingConductor })}
                </Text>
              ) : null}
              <Text style={[styles.cardSub, { color: theme.secondaryText }]}>
                {formatTimeLabel(meetingDay.time, locale, '', uses24HourClock)}
                {meetingLocation ? ` · ${meetingLocation}` : ''}
              </Text>
            </View>
          </Pressable>
        ) : null}

        {item.activities.map((activity) => {
          const contact = activity.contactId ? contacts.find((c) => c.id === activity.contactId) : null;
          const typeLabel = t(ACTIVITY_TYPE_KEYS[activity.type]);
          const title = contact?.name || activity.location || typeLabel;
          const timeLabel = activity.endTime
            ? `${formatTimeLabel(activity.time, locale, '', uses24HourClock)}-${formatTimeLabel(
                activity.endTime,
                locale,
                '',
                uses24HourClock
              )}`
            : formatTimeLabel(activity.time, locale, '', uses24HourClock);
          const partners = activity.partners
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean);
          const accent = activityColorOption(activity.color)?.swatch ?? theme.secondaryText;

          return (
            <Pressable
              key={activity.id}
              onPress={() => onActivityPress(activity.id)}
              style={[styles.card, { backgroundColor: theme.card }]}
            >
              <View style={[styles.cardBar, { backgroundColor: accent }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <ActivityTypeIcon type={activity.type} color={accent} size={13} />
                  <Text style={[styles.cardType, { color: accent }]} numberOfLines={1}>
                    {typeLabel}
                  </Text>
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={[styles.cardSub, { color: theme.secondaryText }]} numberOfLines={1}>
                  {timeLabel}
                  {contact?.name && activity.location ? ` · ${activity.location}` : ''}
                </Text>
                {partners.length > 0 ? (
                  <View style={styles.partnerRow}>
                    {partners.map((p, pi) => (
                      <View key={pi} style={[styles.partnerPill, { borderColor: theme.border }]}>
                        <PartnerIcon color={theme.secondaryText} size={12} />
                        <Text style={[styles.partnerLabel, { color: theme.secondaryText }]} numberOfLines={1}>
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

        {!item.meetingVisible && item.activities.length === 0 ? (
          <Pressable onPress={onAddPress} hitSlop={4}>
            <Text style={[styles.emptyDayText, { color: theme.secondaryText }]}>
              {t('schedule.noActivities')} · {t('schedule.tapToAddActivity')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

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
  const [isFilterPending, startFilterTransition] = useTransition();

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
    startFilterTransition(() => {
      setActiveFilters((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    });
  };

  const filterLabel = (key: ActivityType | 'meeting') => (key === 'meeting' ? t('schedule.filterMeeting') : t(ACTIVITY_TYPE_KEYS[key]));

  const { meetingSchedule, meetingLocationOverrides, meetingConductorOverrides, meetingAttendance, meetingColor, contacts, uses24HourClock } =
    state;

  const renderRow = useCallback(
    ({ item }: { item: ScheduleRow }) => {
      if (item.kind === 'month') {
        return <MonthDividerRow monthDate={item.monthDate} locale={locale} color={theme.text} />;
      }

      const key = dateKey(item.date);
      const dow = item.date.getDay();
      const meetingDay = meetingSchedule[dow];
      const meetingLocation = meetingLocationOverrides[key] ?? meetingDay?.location ?? '';
      const meetingConductor = meetingConductorOverrides[key] ?? '';
      const attended = Boolean(meetingAttendance[key]);
      const isToday = key === todayKey();

      return (
        <DayRowItem
          item={item}
          theme={theme}
          locale={locale}
          t={t}
          meetingDay={meetingDay}
          meetingLocation={meetingLocation}
          meetingConductor={meetingConductor}
          attended={attended}
          meetingColor={meetingColor}
          uses24HourClock={uses24HourClock}
          contacts={contacts}
          isToday={isToday}
          onToggleAttendance={() => actions.toggleMeetingAttendance(key)}
          onAddPress={() => navigation.navigate('AddActivity', { date: key })}
          onActivityPress={(activityId) => navigation.navigate('AddActivity', { activityId })}
        />
      );
    },
    [
      theme,
      locale,
      t,
      meetingSchedule,
      meetingLocationOverrides,
      meetingConductorOverrides,
      meetingAttendance,
      meetingColor,
      uses24HourClock,
      contacts,
      actions,
      navigation,
    ]
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <View style={[styles.headerRow, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: theme.text }]}>{visibleMonthLabel}</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={scrollToToday} style={[styles.todayPill, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.todayPillLabel, { color: theme.text }]}>{t('schedule.todayPill')}</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('ServiceArea')}
            hitSlop={8}
            accessibilityLabel={t('schedule.serviceAreaAccessibility')}
            style={[styles.iconBtn, { borderColor: theme.border }]}
          >
            <MapIcon color={theme.secondaryText} size={16} />
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

      <View style={styles.flex}>
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
        {isFilterPending ? (
          <View style={styles.filterLoadingOverlay}>
            <ActivityIndicator size="small" color={theme.accent} />
          </View>
        ) : null}
      </View>

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
  monthDivider: { paddingVertical: 22, alignItems: 'center' },
  monthDividerText: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 0.2,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
  },

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
  card: { flexDirection: 'row', alignItems: 'stretch', borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  cardBar: { width: 3.5 },
  cardBody: { flex: 1, gap: 3, paddingVertical: 12, paddingHorizontal: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardType: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  cardTitle: { fontSize: 14.5, fontWeight: '700', flexShrink: 1 },
  cardSub: { fontSize: 12.5 },
  emptyDayText: { fontSize: 13, textAlign: 'left', marginTop: 29, marginBottom: 10 },
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
  filterLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
