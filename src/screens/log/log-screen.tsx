import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { themeFor } from '../../theme/theme';
import { MonthCalendar } from './month-calendar';
import { ManualEntrySheet } from './manual-entry-sheet';
import { LogVisitSheet } from './log-visit-sheet';
import { RecentVisitsCard } from './recent-visits-card';
import { UpcomingActivitiesCard } from './upcoming-activities-card';
import { ActivityHoursSheet } from './activity-hours-sheet';
import { MonthlyHeroCarousel } from './monthly-hero-carousel';
import { ReportIcon, ChevronRightIcon } from '../../components/data-display/icons';
import {
  buildChartMonth,
  isReportOverdue,
  liveTodayHours,
  recentVisits,
  sortedContacts,
  studyContacts,
  type RecentVisit,
} from '../../store/selectors';
import { activitiesOnDate, type ScheduledActivityOccurrence } from '../../utils/schedule';
import { dateKey, monthKeyOf, monthLabel, parseMonthKey, previousMonthKey, todayKey } from '../../utils/dates';
import { hexToRgba } from '../../utils/color';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import type { TabScreenNavProp } from '../../navigation/types';

export function LogScreen({ navigation }: { navigation: TabScreenNavProp<'Log'> }) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const theme = themeFor(state.darkMode);
  const locale = INTL_LOCALE_TAGS[state.language];
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(() => Date.now());
  const [chartOffset, setChartOffset] = useState(0);
  const [manualEntry, setManualEntry] = useState<{ open: boolean; targetDate: string }>({
    open: false,
    targetDate: todayKey(),
  });
  const [studySheetVisible, setStudySheetVisible] = useState(false);
  const [logVisitSheetVisible, setLogVisitSheetVisible] = useState(false);
  const [activityHoursSheet, setActivityHoursSheet] = useState<{
    activity: ScheduledActivityOccurrence;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (!state.timerStartedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.timerStartedAt]);

  // In case a timer session is resumed from persisted state, still hand off to
  // the Timer screen — there's just no button on this screen to start one.
  useFocusEffect(
    React.useCallback(() => {
      if (state.timerStartedAt) navigation.navigate('Timer');
    }, [state.timerStartedAt, navigation])
  );

  const reportOverdue = useMemo(() => isReportOverdue(state, now), [state, now]);
  const dueReportMonth = useMemo(() => previousMonthKey(monthKeyOf(new Date(now))), [now]);
  const dueReportMonthLabel = useMemo(() => monthLabel(parseMonthKey(dueReportMonth), locale), [dueReportMonth, locale]);
  const isFirstOfMonth = useMemo(() => new Date(now).getDate() === 1, [now]);
  const showReportCard = useMemo(() => {
    return state.lastReportedMonth !== dueReportMonth;
  }, [dueReportMonth, state.lastReportedMonth]);
  const todayHours = useMemo(() => liveTodayHours(state, now), [state, now]);
  const chart = useMemo(() => buildChartMonth(state, chartOffset, locale, now), [state, chartOffset, locale, now]);
  const recent = useMemo(() => recentVisits(state.contacts, 8), [state.contacts]);
  const todayActivities = useMemo<ScheduledActivityOccurrence[]>(
    () => {
      const today = todayKey();
      return activitiesOnDate(state.scheduledActivities, today).map((activity) => ({ ...activity, occurrenceDate: today }));
    },
    [state.scheduledActivities]
  );

  const canSubtract = todayHours > 0;

  const openManualEntry = (targetDate: string) => setManualEntry({ open: true, targetDate });

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <ScrollView style={styles.flex} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 32 }}>
        <MonthlyHeroCarousel
          theme={theme}
          locale={locale}
          state={state}
          now={now}
          canSubtract={canSubtract}
          onAddManually={() => openManualEntry(todayKey())}
          onAddHours={(delta: number) => actions.addHours(todayKey(), delta)}
        />

        <View style={styles.container}>
          {showReportCard ? (
            <Pressable
              onPress={() => navigation.navigate('Report')}
              style={[
                styles.reportCard,
                reportOverdue
                  ? { backgroundColor: hexToRgba(theme.gold, 0.14), borderColor: hexToRgba(theme.gold, 0.35) }
                  : { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <ReportIcon color={reportOverdue ? theme.gold : theme.secondaryText} size={18} />
              <View style={styles.reportCardText}>
                <Text style={[styles.reportCardTitle, { color: theme.text }]}>{t('log.reportCardTitle')}</Text>
                <Text style={[styles.reportCardSubtitle, { color: theme.secondaryText }]}>
                  {t(isFirstOfMonth ? 'log.reportCardSubtitleFirstDay' : 'log.reportCardSubtitleUnsent', {
                    month: dueReportMonthLabel,
                  })}
                </Text>
              </View>
              <ChevronRightIcon color={theme.secondaryText} />
            </Pressable>
          ) : null}

          {todayActivities.length > 0 ? (
            <UpcomingActivitiesCard
              theme={theme}
              locale={locale}
              activities={todayActivities}
              contacts={state.contacts}
              uses24HourClock={state.uses24HourClock}
              scheduledActivityHours={state.scheduledActivityHours}
              onViewSchedule={() => navigation.navigate('Tabs', { screen: 'Schedule' })}
              onCheckActivity={(activity, title) => setActivityHoursSheet({ activity, title })}
              onUncheckActivity={(activity) => actions.unconfirmActivityHours(activity.id, activity.occurrenceDate)}
            />
          ) : null}

          <RecentVisitsCard
            theme={theme}
            locale={locale}
            visits={recent}
            onLogVisit={() => setLogVisitSheetVisible(true)}
            onOpenVisit={(v: RecentVisit) => navigation.navigate('AddEditVisit', { contactId: v.contactId, visitId: v.visitId })}
          />

          <View style={[styles.calendarWrap, { borderColor: theme.border }]}>
            <MonthCalendar
              theme={theme}
              chart={chart}
              locale={locale}
              canGoNext={chartOffset < 0}
              onPrevMonth={() => setChartOffset((o) => Math.max(-24, o - 1))}
              onNextMonth={() => setChartOffset((o) => Math.min(0, o + 1))}
              onSelectDay={(day: number) => openManualEntry(dateKey(new Date(chart.year, chart.month0, day)))}
            />
          </View>
        </View>
      </ScrollView>

      <ManualEntrySheet
        visible={manualEntry.open}
        targetDate={manualEntry.targetDate}
        onClose={() => setManualEntry((m) => ({ ...m, open: false }))}
      />

      <LogVisitSheet
        visible={studySheetVisible}
        contacts={studyContacts(state.contacts)}
        title={t('logStudy.title')}
        subtitle={t('logStudy.subtitle')}
        emptyText={t('logStudy.empty')}
        addContactLabel={t('logStudy.addContact')}
        onClose={() => setStudySheetVisible(false)}
        navigation={navigation}
        theme={theme}
      />

      <LogVisitSheet
        visible={logVisitSheetVisible}
        contacts={sortedContacts(state.contacts)}
        title={t('logVisit.title')}
        subtitle={t('logVisit.subtitle')}
        emptyText={t('logVisit.empty')}
        addContactLabel={t('logStudy.addContact')}
        onClose={() => setLogVisitSheetVisible(false)}
        navigation={navigation}
        theme={theme}
      />

      <ActivityHoursSheet
        visible={activityHoursSheet !== null}
        activity={activityHoursSheet?.activity ?? null}
        activityTitle={activityHoursSheet?.title ?? ''}
        onClose={() => setActivityHoursSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { paddingHorizontal: 24, marginTop: 20 },
  calendarWrap: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20 },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  reportCardText: { flex: 1, gap: 2 },
  reportCardTitle: { fontSize: 13.5, fontWeight: '600' },
  reportCardSubtitle: { fontSize: 12 },
});
