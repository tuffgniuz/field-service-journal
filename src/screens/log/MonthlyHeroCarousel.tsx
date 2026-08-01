import React, { useEffect, useMemo, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../theme/theme';
import type { RuntimeState } from '../../store/types';
import { EditIcon } from '../../components/icons';
import { liveTodayHours, monthHoursFor, studiesForMonth } from '../../store/selectors';
import {
  currentServiceYearLabel,
  monthByOffset,
  monthKeyOf,
  monthLabel,
  serviceYearRange,
} from '../../utils/dates';
import { fmtHours } from '../../utils/format';

const QUICK_STEP = 0.5;

interface MonthPage {
  monthKey: string;
  label: string;
  hours: number;
  studies: number;
}

/**
 * One page per month, swipeable horizontally. Bounded to the current service
 * year: the rightmost (default, initially-scrolled-to) page is the current
 * month, and it can't go forward past that; the leftmost is September of the
 * service year's start, and it can't go back further than that — both bounds
 * fall out for free from the page list's own start/end, no extra clamping
 * needed since FlatList can't scroll past its own content.
 */
export function MonthlyHeroCarousel({
  theme,
  locale,
  state,
  now,
  canSubtract,
  onAddManually,
  onAddHours,
}: {
  theme: Theme;
  locale: string;
  state: RuntimeState;
  now: number;
  canSubtract: boolean;
  onAddManually: () => void;
  onAddHours: (delta: number) => void;
}) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<MonthPage>>(null);

  const pages = useMemo<MonthPage[]>(() => {
    const nowDate = new Date(now);
    const { start } = serviceYearRange(currentServiceYearLabel());
    const monthsBack =
      (nowDate.getFullYear() - start.getFullYear()) * 12 + (nowDate.getMonth() - start.getMonth());
    const out: MonthPage[] = [];
    for (let offset = -monthsBack; offset <= 0; offset++) {
      const anchor = monthByOffset(offset);
      const monthKey = monthKeyOf(anchor);
      out.push({
        monthKey,
        label: monthLabel(anchor, locale),
        hours: monthHoursFor(state, monthKey, now),
        studies: studiesForMonth(state, monthKey),
      });
    }
    return out;
  }, [state, now, locale]);

  const todayHours = liveTodayHours(state, now);

  // `initialScrollIndex` isn't reliable everywhere (react-native-web in
  // particular just ignores it), so also scroll imperatively once mounted.
  // Deferred a tick since the list isn't guaranteed to have measured its
  // content yet during the synchronous mount/layout callbacks.
  const lastIndex = pages.length - 1;
  useEffect(() => {
    const id = setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: width * lastIndex, animated: false });
    }, 0);
    return () => clearTimeout(id);
  }, [width, lastIndex]);

  const scrollToCurrentMonth = () => listRef.current?.scrollToOffset({ offset: width * lastIndex, animated: false });

  return (
    <FlatList
      ref={listRef}
      data={pages}
      keyExtractor={(p) => p.monthKey}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      initialScrollIndex={pages.length - 1}
      getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      onContentSizeChange={scrollToCurrentMonth}
      onLayout={scrollToCurrentMonth}
      style={{ width }}
      renderItem={({ item }) => (
        <View style={{ width, paddingHorizontal: 24 }}>
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.headerRow}>
              <Text style={[styles.monthLabel, { color: theme.secondaryText }]}>{item.label}</Text>
              <Pressable onPress={onAddManually} style={styles.addManuallyBtn} hitSlop={8}>
                <EditIcon color={theme.accent} size={13} />
                <Text style={[styles.addManuallyLabel, { color: theme.accent }]}>
                  {t('log.addManually')}
                </Text>
              </Pressable>
            </View>

            <View style={styles.statsRow}>
              <Text style={[styles.totalsValue, { color: theme.text }]}>
                {fmtHours(item.hours)}
                <Text style={[styles.totalsUnit, { color: theme.secondaryText }]}>{'\u2009'}h</Text>
              </Text>
              <View style={styles.statsRight}>
                <Text style={[styles.todayHours, { color: theme.secondaryText }]}>
                  <Text style={{ color: theme.text }}>
                    {t('log.todayHoursValue', { hours: fmtHours(todayHours) })}
                  </Text>
                  {" "}{t('log.todayHoursSuffix')}
                </Text>
                <View style={styles.studiesRow}>
                  <Text style={[styles.studiesCount, { color: theme.secondaryText }]}>
                    <Text style={{ color: theme.text }}>{item.studies}</Text>
                    {" "}{t('log.studiesCountLabel', { count: item.studies })}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => onAddHours(-QUICK_STEP)}
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
                onPress={() => onAddHours(QUICK_STEP)}
                accessibilityLabel={t('log.increaseAccessibility', { value: QUICK_STEP })}
                style={[styles.stepBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}
              >
                <Text style={[styles.stepBtnLabel, { color: theme.accentText }]}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  statsRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 },
  monthLabel: { fontSize: 12, includeFontPadding: false },
  totalsValue: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 48,
    includeFontPadding: false,
    fontVariant: ['tabular-nums'],
  },
  totalsUnit: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0,
    marginLeft: 1,
  },
  statsRight: { alignItems: 'flex-end', gap: 10 },
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
