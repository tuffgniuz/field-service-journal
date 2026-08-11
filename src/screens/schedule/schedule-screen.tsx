import React, { useCallback, useMemo, useRef, useState, useTransition } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../store/app-context';
import { themeFor, type Theme } from '../../theme/theme';
import { ActivityTypeIcon, CheckIcon, MapIcon, MeetingScheduleIcon, PartnerIcon } from '../../components/data-display/icons';
import { Chip } from '../../components/data-display/chip';
import { dateKey, daysInMonth, monthByOffset, monthKeyOf, monthLabel, parseMonthKey, todayKey } from '../../utils/dates';
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
import { MonthCalendar } from '../log/month-calendar';
import type { ChartMonth } from '../../store/selectors';

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
  'field_service',
  'cart',
];

type MonthRow = { kind: 'month'; key: string; monthDate: Date; colorIndex: number };
type DayRow = { kind: 'day'; key: string; date: Date; meetingVisible: boolean; activities: ScheduledActivity[] };
type ScheduleRow = MonthRow | DayRow;
type CalendarPage = { key: string; month: Date; chart: ChartMonth };

const SCHEDULE_CALENDAR_VERTICAL_PADDING = 10;
const SCHEDULE_CALENDAR_WEEKDAY_ROW_HEIGHT = 22;
const SCHEDULE_CALENDAR_WEEK_ROW_HEIGHT = 44;

function rowDate(row: ScheduleRow): Date {
  return row.kind === 'month' ? row.monthDate : row.date;
}

function monthOffsetFromCurrent(month: Date): number {
  const now = new Date();
  return (month.getFullYear() - now.getFullYear()) * 12 + (month.getMonth() - now.getMonth());
}

function calendarWeekCount(month: Date): number {
  return Math.ceil((new Date(month.getFullYear(), month.getMonth(), 1).getDay() + daysInMonth(month.getFullYear(), month.getMonth())) / 7);
}

function scheduleCalendarHeight(month: Date): number {
  return SCHEDULE_CALENDAR_VERTICAL_PADDING + SCHEDULE_CALENDAR_WEEKDAY_ROW_HEIGHT + calendarWeekCount(month) * SCHEDULE_CALENDAR_WEEK_ROW_HEIGHT;
}

const MONTH_DIVIDER_GRADIENTS = [
  { light: ['rgba(176, 141, 87, 0)', 'rgba(176, 141, 87, 0.16)', 'rgba(176, 141, 87, 0)'], dark: ['rgba(199, 160, 107, 0)', 'rgba(199, 160, 107, 0.20)', 'rgba(199, 160, 107, 0)'] },
  { light: ['rgba(74, 107, 138, 0)', 'rgba(74, 107, 138, 0.14)', 'rgba(74, 107, 138, 0)'], dark: ['rgba(74, 107, 138, 0)', 'rgba(74, 107, 138, 0.24)', 'rgba(74, 107, 138, 0)'] },
  { light: ['rgba(84, 132, 103, 0)', 'rgba(84, 132, 103, 0.14)', 'rgba(84, 132, 103, 0)'], dark: ['rgba(102, 155, 124, 0)', 'rgba(102, 155, 124, 0.20)', 'rgba(102, 155, 124, 0)'] },
  { light: ['rgba(166, 92, 86, 0)', 'rgba(166, 92, 86, 0.12)', 'rgba(166, 92, 86, 0)'], dark: ['rgba(210, 118, 104, 0)', 'rgba(210, 118, 104, 0.18)', 'rgba(210, 118, 104, 0)'] },
] as const;

function buildScheduleCalendarMonth(
  state: { meetingSchedule: { dayOfWeek: number; enabled: boolean }[]; scheduledActivities: ScheduledActivity[] },
  month: Date,
  locale: string
): ChartMonth {
  const year = month.getFullYear();
  const month0 = month.getMonth();
  const monthKey = monthKeyOf(month);
  const today = todayKey();
  const totalDays = daysInMonth(year, month0);

  const days = Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const dayDate = new Date(year, month0, day);
    const key = dateKey(dayDate);
    const meetingDay = state.meetingSchedule[dayDate.getDay()];
    const hasMeeting = Boolean(meetingDay?.enabled);
    const scheduledCount = activitiesOnDate(state.scheduledActivities, key).length;

    return {
      day,
      hours: hasMeeting || scheduledCount > 0 ? 1 : 0,
      isToday: key === today,
      tickLabel: '',
    };
  });

  return {
    label: monthLabel(month, locale),
    monthKey,
    year,
    month0,
    days,
    avg: 0,
    isCurrent: monthKey === monthKeyOf(new Date()),
  };
}

function buildScheduleRows(
  state: { meetingSchedule: { dayOfWeek: number; enabled: boolean }[]; scheduledActivities: ScheduledActivity[] },
  activeFilters: Set<ActivityType | 'meeting'>,
  rangeStart: Date,
  rangeEndExclusive: Date
): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  let cursor = new Date(rangeStart);

  while (cursor < rangeEndExclusive) {
    for (const d of weekDates(cursor)) {
      const key = dateKey(d);
      if (d.getDate() === 1) {
        rows.push({ kind: 'month', key: `m-${key}`, monthDate: new Date(d), colorIndex: d.getMonth() % MONTH_DIVIDER_GRADIENTS.length });
      }
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

const MonthDividerRow = React.memo(function MonthDividerRow({
  monthDate,
  locale,
  theme,
  colorIndex,
}: {
  monthDate: Date;
  locale: string;
  theme: Theme;
  colorIndex: number;
}) {
  const gradient = MONTH_DIVIDER_GRADIENTS[colorIndex % MONTH_DIVIDER_GRADIENTS.length][theme.dark ? 'dark' : 'light'];
  return (
    <View style={styles.monthDivider}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.monthDividerGradient}>
        <Text style={[styles.monthDividerText, { color: theme.secondaryText }]}>{monthLabel(monthDate, locale)}</Text>
      </LinearGradient>
    </View>
  );
});

/**
 * Memoized because this is by far the heaviest cell (icons, colors, partner
 * pills per activity), and the agenda can have 150+ of them mounted.
 */
type DayRowItemProps = {
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
};

function sameActivities(a: ScheduledActivity[], b: ScheduledActivity[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i]?.id !== b[i]?.id ||
      a[i]?.updatedAt !== b[i]?.updatedAt ||
      a[i]?.contactId !== b[i]?.contactId ||
      a[i]?.location !== b[i]?.location ||
      a[i]?.time !== b[i]?.time ||
      a[i]?.endTime !== b[i]?.endTime ||
      a[i]?.partners !== b[i]?.partners ||
      a[i]?.color !== b[i]?.color
    ) {
      return false;
    }
  }
  return true;
}

function areDayRowsEqual(prev: DayRowItemProps, next: DayRowItemProps): boolean {
  return (
    prev.item.key === next.item.key &&
    prev.item.meetingVisible === next.item.meetingVisible &&
    sameActivities(prev.item.activities, next.item.activities) &&
    prev.theme === next.theme &&
    prev.locale === next.locale &&
    prev.t === next.t &&
    prev.meetingDay === next.meetingDay &&
    prev.meetingLocation === next.meetingLocation &&
    prev.meetingConductor === next.meetingConductor &&
    prev.attended === next.attended &&
    prev.meetingColor === next.meetingColor &&
    prev.uses24HourClock === next.uses24HourClock &&
    prev.contacts === next.contacts &&
    prev.isToday === next.isToday
  );
}

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
}: DayRowItemProps) {
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
}, areDayRowsEqual);

export function ScheduleScreen({ navigation }: { navigation: TabScreenNavProp<'Schedule'> }) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const theme = themeFor(state.darkMode);
  const locale = INTL_LOCALE_TAGS[state.language];
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<ScheduleRow>>(null);
  const calendarPagerRef = useRef<FlatList<CalendarPage>>(null);

  const [activeFilters, setActiveFilters] = useState<Set<ActivityType | 'meeting'>>(new Set());
  const initialMonthKey = useMemo(() => monthKeyOf(new Date()), []);
  const visibleMonthKeyRef = useRef(initialMonthKey);
  const [visibleMonthKey, setVisibleMonthKey] = useState(initialMonthKey);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const calendarAnim = useRef(new Animated.Value(0)).current;
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

  const visibleMonthDate = useMemo(() => parseMonthKey(visibleMonthKey), [visibleMonthKey]);
  const headerMonthDate = calendarOpen ? calendarMonth : visibleMonthDate;
  const visibleMonthLabel = monthLabel(headerMonthDate, locale);
  const calendarPages = useMemo(
    () =>
      Array.from({ length: RANGE_MONTHS_FORWARD + 1 }, (_, offset) => {
        const month = monthByOffset(offset);
        return {
          key: monthKeyOf(month),
          month,
          chart: buildScheduleCalendarMonth(state, month, locale),
        };
      }),
    [state.meetingSchedule, state.scheduledActivities, locale]
  );
  const calendarPageWidth = Math.max(1, width - 48);
  const calendarHeight = scheduleCalendarHeight(calendarMonth);

  // The list is anchored at the current week (index 0), so "back to today" is just the top —
  // no item-index measurement needed, which `scrollToIndex` can't do reliably without fixed row heights.
  const scrollToToday = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const openCalendar = () => {
    const month = new Date(visibleMonthDate.getFullYear(), visibleMonthDate.getMonth(), 1);
    const offset = monthOffsetFromCurrent(month);
    setCalendarMonth(month);
    setCalendarOpen(true);
    setTimeout(() => {
      calendarPagerRef.current?.scrollToIndex({ index: Math.max(0, Math.min(RANGE_MONTHS_FORWARD, offset)), animated: false });
    }, 0);
    Animated.timing(calendarAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const closeCalendar = () => {
    Animated.timing(calendarAnim, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setCalendarOpen(false);
    });
  };

  const toggleCalendar = () => {
    if (calendarOpen) closeCalendar();
    else openCalendar();
  };

  const selectCalendarDay = (year: number, month0: number, day: number) => {
    closeCalendar();
    navigation.navigate('AddActivity', { date: dateKey(new Date(year, month0, day)) });
  };

  const onCalendarMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / calendarPageWidth);
    const page = calendarPages[Math.max(0, Math.min(calendarPages.length - 1, index))];
    if (page) setCalendarMonth(page.month);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ item: ScheduleRow }> }) => {
    const first = viewableItems[0]?.item;
    if (!first) return;
    const nextMonthKey = monthKeyOf(rowDate(first));
    if (nextMonthKey === visibleMonthKeyRef.current) return;
    visibleMonthKeyRef.current = nextMonthKey;
    setVisibleMonthKey(nextMonthKey);
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
        return <MonthDividerRow monthDate={item.monthDate} locale={locale} theme={theme} colorIndex={item.colorIndex} />;
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
        <Pressable onPress={toggleCalendar} hitSlop={8} style={styles.titleButton}>
          <Text style={[styles.title, { color: theme.text }]}>{visibleMonthLabel}</Text>
          <Text style={[styles.titleChevron, { color: theme.secondaryText, transform: [{ rotate: calendarOpen ? '180deg' : '0deg' }] }]}>
            ▾
          </Text>
        </Pressable>
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
            <MeetingScheduleIcon color={theme.secondaryText} size={16} />
          </Pressable>
        </View>
      </View>

      <Animated.View
        style={[
          styles.calendarPanel,
          {
            height: calendarAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, calendarHeight],
            }),
            opacity: calendarAnim,
          },
        ]}
        pointerEvents={calendarOpen ? 'auto' : 'none'}
      >
        <View style={styles.calendarCard}>
          <FlatList
            ref={calendarPagerRef}
            horizontal
            pagingEnabled
            data={calendarPages}
            keyExtractor={(item) => item.key}
            showsHorizontalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
            getItemLayout={(_, index) => ({ length: calendarPageWidth, offset: calendarPageWidth * index, index })}
            onMomentumScrollEnd={onCalendarMomentumEnd}
            onScrollToIndexFailed={({ index }) => {
              setTimeout(() => {
                calendarPagerRef.current?.scrollToIndex({ index, animated: false });
              }, 0);
            }}
            renderItem={({ item }) => (
              <View style={{ width: calendarPageWidth }}>
                <MonthCalendar
                  theme={theme}
                  chart={item.chart}
                  locale={locale}
                  canGoPrev={false}
                  canGoNext={false}
                  showHeader={false}
                  onPrevMonth={() => {}}
                  onNextMonth={() => {}}
                  onSelectDay={(day) => selectCalendarDay(item.chart.year, item.chart.month0, day)}
                />
              </View>
            )}
          />
        </View>
      </Animated.View>

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
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={60}
          windowSize={9}
          removeClippedSubviews={Platform.OS !== 'web'}
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
  titleButton: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, minWidth: 0 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: 0, flexShrink: 1 },
  titleChevron: { fontSize: 14, fontWeight: '700', lineHeight: 16 },
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
  filterListWrap: { height: 40, marginBottom: 8 },
  filterList: { flex: 1 },
  filterListContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 6 },
  calendarPanel: { overflow: 'hidden', paddingHorizontal: 24 },
  calendarCard: { paddingTop: 4, paddingBottom: 6 },
  monthDivider: { paddingTop: 18, paddingBottom: 14, marginHorizontal: -24 },
  monthDividerGradient: {
    minHeight: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDividerText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },

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
  filterLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
