import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../theme/theme';
import type { ChartMonth } from '../../store/selectors';

const BAR_AREA_HEIGHT = 100;

export function MonthChart({
  theme,
  chart,
  locale,
  canGoNext,
  onPrevMonth,
  onNextMonth,
  selectedDay,
  onSelectDay,
  onAddTimeForDay,
}: {
  theme: Theme;
  chart: ChartMonth;
  locale: string;
  canGoNext: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
  onAddTimeForDay: (day: number) => void;
}) {
  const { t } = useTranslation();
  const maxHours = Math.max(1, ...chart.days.map((d) => d.hours), 0.01);
  const selected = selectedDay != null ? chart.days.find((d) => d.day === selectedDay) : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable onPress={onPrevMonth} hitSlop={8} style={styles.navBtn}>
          <Text style={[styles.navArrow, { color: theme.secondaryText }]}>‹</Text>
        </Pressable>
        <Text style={[styles.monthLabel, { color: theme.text }]}>{chart.label}</Text>
        <Pressable onPress={canGoNext ? onNextMonth : undefined} hitSlop={8} style={styles.navBtn}>
          <Text style={[styles.navArrow, { color: canGoNext ? theme.secondaryText : theme.border }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.barRow}>
        {chart.days.map((d) => (
          <Pressable key={d.day} style={styles.barSlot} onPress={() => onSelectDay(selectedDay === d.day ? null : d.day)}>
            {d.hours === 0 ? (
              <View style={[styles.zeroLine, { backgroundColor: theme.border }]} />
            ) : (
              <View
                style={[
                  styles.bar,
                  {
                    height: `${Math.max(10, (d.hours / maxHours) * 100)}%`,
                    backgroundColor: d.isToday ? theme.gold : theme.accent,
                  },
                ]}
              />
            )}
          </Pressable>
        ))}
      </View>

      <View style={styles.tickRow}>
        {chart.days.map((d) => (
          <Text key={d.day} style={[styles.tick, { color: theme.secondaryText }]}>
            {d.tickLabel}
          </Text>
        ))}
      </View>

      {selected ? (
        <View style={[styles.popover, { borderColor: theme.border }]}>
          <View>
            <Text style={[styles.popoverDate, { color: theme.text }]}>
              {new Date(chart.year, chart.month0, selected.day).toLocaleDateString(locale, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <Text style={[styles.popoverHours, { color: theme.secondaryText }]}>
              {selected.hours > 0 ? t('monthChart.hoursLogged', { count: selected.hours }) : t('monthChart.noTimeLogged')}
            </Text>
          </View>
          <Pressable onPress={() => onAddTimeForDay(selected.day)}>
            <Text style={[styles.addTime, { color: theme.accent }]}>{t('monthChart.addTime')}</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={[styles.avg, { color: theme.secondaryText }]}>
        {t('monthChart.avgPerDay', { value: chart.avg.toFixed(1) })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  navBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  navArrow: { fontSize: 16 },
  monthLabel: { fontSize: 13.5, fontWeight: '600' },
  barRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: BAR_AREA_HEIGHT, marginBottom: 6 },
  barSlot: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  zeroLine: { width: '100%', height: 2, borderRadius: 1 },
  tickRow: { flexDirection: 'row', gap: 2, marginBottom: 14 },
  tick: { flex: 1, textAlign: 'center', fontSize: 9.5 },
  popover: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  popoverDate: { fontSize: 13.5, fontWeight: '600' },
  popoverHours: { fontSize: 12.5, marginTop: 2 },
  addTime: { fontSize: 12.5, fontWeight: '600' },
  avg: { fontSize: 12 },
});
