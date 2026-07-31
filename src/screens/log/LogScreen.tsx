import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import { themeFor } from '../../theme/theme';
import { EditIcon } from '../../components/icons';
import { MonthCalendar } from './MonthCalendar';
import { ManualEntrySheet } from './ManualEntrySheet';
import { LogVisitSheet } from './LogVisitSheet';
import { RecentVisitsCard } from './RecentVisitsCard';
import {
  buildChartMonth,
  currentMonthHours,
  liveTodayHours,
  recentVisits,
  sortedContacts,
  studiesForMonth,
  studyContacts,
} from '../../store/selectors';
import { currentMonthKey, dateKey, monthLabel, todayKey } from '../../utils/dates';
import { fmtHours } from '../../utils/format';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import type { TabScreenNavProp } from '../../navigation/types';

const QUICK_STEP = 0.5;

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

  const monthHours = useMemo(() => currentMonthHours(state, now), [state, now]);
  const todayHours = useMemo(() => liveTodayHours(state, now), [state, now]);
  const monthStudies = useMemo(() => studiesForMonth(state, currentMonthKey()), [state]);
  const chart = useMemo(() => buildChartMonth(state, chartOffset, locale, now), [state, chartOffset, locale, now]);
  const recent = useMemo(() => recentVisits(state.contacts, 8), [state.contacts]);

  const canSubtract = todayHours > 0;

  const openManualEntry = (targetDate: string) => setManualEntry({ open: true, targetDate });

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <ScrollView style={styles.flex} contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t('log.title')}</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.monthLabel, { color: theme.secondaryText }]}>{monthLabel(new Date(), locale)}</Text>
            <Pressable onPress={() => openManualEntry(todayKey())} style={styles.addManuallyBtn} hitSlop={8}>
              <EditIcon color={theme.secondaryText} size={13} />
              <Text style={[styles.addManuallyLabel, { color: theme.secondaryText }]}>{t('log.addManually')}</Text>
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <Text style={[styles.totalsValue, { color: theme.text }]}>{fmtHours(monthHours)}</Text>
            <View style={styles.statsRight}>
              <Text style={[styles.todayHours, { color: theme.text }]}>
                {t('log.todayHours', { hours: fmtHours(todayHours) })}
              </Text>
              <View style={styles.studiesRow}>
                <Text style={[styles.studiesCount, { color: theme.secondaryText }]}>
                  {t('log.studiesCount', { count: monthStudies })}
                </Text>
                <Pressable
                  onPress={() => setStudySheetVisible(true)}
                  accessibilityLabel={t('log.addStudyAccessibility')}
                  hitSlop={8}
                  style={[styles.addStudyBtn, { borderColor: theme.border }]}
                >
                  <Text style={[styles.addStudyPlus, { color: theme.secondaryText }]}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.stepperRow}>
            <Pressable
              onPress={() => actions.addHours(todayKey(), -QUICK_STEP)}
              disabled={!canSubtract}
              accessibilityLabel={t('log.decreaseAccessibility', { value: QUICK_STEP })}
              style={[styles.stepBtn, { borderColor: theme.border, opacity: canSubtract ? 1 : 0.4 }]}
            >
              <Text style={[styles.stepBtnLabel, { color: theme.text }]}>−</Text>
            </Pressable>
            <Text style={[styles.stepValue, { color: theme.secondaryText }]}>
              {t('log.quickStepLabel', { value: QUICK_STEP })}
            </Text>
            <Pressable
              onPress={() => actions.addHours(todayKey(), QUICK_STEP)}
              accessibilityLabel={t('log.increaseAccessibility', { value: QUICK_STEP })}
              style={[styles.stepBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}
            >
              <Text style={[styles.stepBtnLabel, { color: theme.accentText }]}>+</Text>
            </Pressable>
          </View>
        </View>

        <RecentVisitsCard
          theme={theme}
          locale={locale}
          visits={recent}
          onLogVisit={() => setLogVisitSheetVisible(true)}
          onOpenVisit={(v) => navigation.navigate('AddEditVisit', { contactId: v.contactId, visitId: v.visitId })}
        />

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <MonthCalendar
            theme={theme}
            chart={chart}
            locale={locale}
            canGoNext={chartOffset < 0}
            onPrevMonth={() => setChartOffset((o) => Math.max(-24, o - 1))}
            onNextMonth={() => setChartOffset((o) => Math.min(0, o + 1))}
            onSelectDay={(day) => openManualEntry(dateKey(new Date(chart.year, chart.month0, day)))}
          />
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
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 24, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.4, marginBottom: 20 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  monthLabel: { fontSize: 12, includeFontPadding: false },
  totalsValue: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 48,
    includeFontPadding: false,
    fontVariant: ['tabular-nums'],
  },
  statsRight: { alignItems: 'flex-end', gap: 6 },
  addManuallyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  addManuallyLabel: { fontSize: 12, includeFontPadding: false },
  todayHours: {
    fontSize: 13,
    fontWeight: '600',
    includeFontPadding: false,
    fontVariant: ['tabular-nums'],
  },
  studiesRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  studiesCount: { fontSize: 12.5, includeFontPadding: false },
  addStudyBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStudyPlus: { fontSize: 11, lineHeight: 12, includeFontPadding: false },
  divider: { height: StyleSheet.hairlineWidth, marginBottom: 10 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnLabel: { fontSize: 20, fontWeight: '600' },
  stepValue: { fontSize: 13, fontWeight: '600', letterSpacing: 0.4 },
});
