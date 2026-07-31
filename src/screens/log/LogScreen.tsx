import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import { themeFor } from '../../theme/theme';
import { DarkModeIcon } from '../../components/icons';
import { Chip } from '../../components/Chip';
import { MonthChart } from './MonthChart';
import { ManualEntrySheet } from './ManualEntrySheet';
import { buildChartMonth, currentMonthHours, liveTodayHours, studiesForMonth } from '../../store/selectors';
import { currentMonthKey, dateKey, monthLabel, todayKey } from '../../utils/dates';
import { fmtHours } from '../../utils/format';
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
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [manualEntry, setManualEntry] = useState<{ open: boolean; targetDate: string }>({
    open: false,
    targetDate: todayKey(),
  });

  useEffect(() => {
    if (!state.timerStartedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.timerStartedAt]);

  useFocusEffect(
    React.useCallback(() => {
      if (state.timerStartedAt) navigation.navigate('Timer');
    }, [state.timerStartedAt, navigation])
  );

  const monthHours = useMemo(() => currentMonthHours(state, now), [state, now]);
  const todayHours = useMemo(() => liveTodayHours(state, now), [state, now]);
  const monthStudies = useMemo(() => studiesForMonth(state, currentMonthKey()), [state]);
  const chart = useMemo(() => buildChartMonth(state, chartOffset, locale, now), [state, chartOffset, locale, now]);

  const QUICK_STEP = 0.5;
  const canSubtract = todayHours > 0;

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      {/* Hero: header, totals, Start button, quick add/subtract, manual entry.
          Natural (non-flex) height — this never changes size, so it never moves
          the "This month" section below it, regardless of that section's state. */}
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.text }]}>{t('log.title')}</Text>
          <Pressable
            onPress={actions.toggleDark}
            style={[styles.darkToggle, { borderColor: theme.border }]}
          >
            <DarkModeIcon dark={state.darkMode} color={theme.secondaryText} size={18} />
          </Pressable>
        </View>
        <Text style={[styles.monthLabel, { color: theme.secondaryText }]}>{monthLabel(new Date(), locale)}</Text>

        <View style={styles.totals}>
          <Text style={[styles.totalsLabel, { color: theme.secondaryText }]}>{t('log.hoursThisMonth')}</Text>
          <Text style={[styles.totalsValue, { color: theme.text }]}>{fmtHours(monthHours)}</Text>
          <Text style={[styles.subLabel, { color: theme.secondaryText }]}>
            {t('log.todayStudies', { hours: fmtHours(todayHours), count: monthStudies })}
          </Text>
        </View>

        <View style={styles.startWrap}>
          <Pressable
            onPress={() => {
              actions.startTimer();
              navigation.navigate('Timer');
            }}
            style={[styles.startBtn, { backgroundColor: theme.accent, shadowColor: theme.accentShadow }]}
          >
            <Text style={[styles.startLabel, { color: theme.accentText }]}>{t('log.start')}</Text>
          </Pressable>
        </View>

        <View style={styles.chipsRow}>
          <Chip
            label={t('log.subtractChip', { value: QUICK_STEP })}
            onPress={() => actions.addHours(todayKey(), -QUICK_STEP)}
            borderColor={theme.border}
            color={theme.text}
            disabled={!canSubtract}
          />
          <Chip
            label={t('log.addChip', { value: QUICK_STEP })}
            onPress={() => actions.addHours(todayKey(), QUICK_STEP)}
            borderColor={theme.border}
            color={theme.text}
          />
        </View>

        <Pressable
          onPress={() => setManualEntry({ open: true, targetDate: todayKey() })}
          style={styles.manualLink}
        >
          <Text style={[styles.manualLabel, { color: theme.secondaryText }]}>
            <Text style={styles.plus}>+</Text> {t('log.manualEntry')}
          </Text>
        </Pressable>
      </View>

      {/* This month: fills all remaining space below the hero, so its top edge
          never moves regardless of screen size or content. Always visible,
          never collapsible. If the chart is ever taller than the room
          available here, it scrolls within this region alone, never
          disturbing the hero above or this section's own position. */}
      <View style={styles.chartRegion}>
        <View style={[styles.chartHeader, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
          <Text style={[styles.chartHeaderLabel, { color: theme.text }]}>{t('log.thisMonth')}</Text>
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
          <MonthChart
            theme={theme}
            chart={chart}
            locale={locale}
            canGoNext={chartOffset < 0}
            onPrevMonth={() => {
              setChartOffset((o) => Math.max(-24, o - 1));
              setSelectedDay(null);
            }}
            onNextMonth={() => {
              setChartOffset((o) => Math.min(0, o + 1));
              setSelectedDay(null);
            }}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onAddTimeForDay={(day) => {
              const target = dateKey(new Date(chart.year, chart.month0, day));
              setManualEntry({ open: true, targetDate: target });
            }}
          />
        </ScrollView>
      </View>

      <ManualEntrySheet
        visible={manualEntry.open}
        targetDate={manualEntry.targetDate}
        onClose={() => setManualEntry((m) => ({ ...m, open: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { paddingHorizontal: 24 },
  chartRegion: { flex: 1, paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.4 },
  darkToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: { fontSize: 13, marginBottom: 20 },
  totals: { alignItems: 'center', marginBottom: 6 },
  totalsLabel: { fontSize: 15, marginBottom: 6 },
  totalsValue: { fontSize: 64, fontWeight: '700', letterSpacing: -2, lineHeight: 68 },
  subLabel: { fontSize: 13, marginTop: 10 },
  startWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  startBtn: {
    width: 148,
    height: 148,
    borderRadius: 74,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  startLabel: { fontSize: 17, fontWeight: '600', letterSpacing: 0.3 },
  chipsRow: { flexDirection: 'row', gap: 14, justifyContent: 'center', marginBottom: 8 },
  manualLink: { alignItems: 'center', paddingVertical: 8 },
  manualLabel: { fontSize: 13.5 },
  plus: { fontSize: 16 },
  chartHeader: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  chartHeaderLabel: { fontSize: 14.5, fontWeight: '600' },
});
