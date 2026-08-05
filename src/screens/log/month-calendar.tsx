import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../../theme/theme';
import type { ChartMonth } from '../../store/selectors';
import { weekdayLabels } from '../../utils/dates';

interface DayCell {
  day: number;
  hours: number;
  isToday: boolean;
}

/**
 * A traditional numbered month-calendar grid (as opposed to MonthChart's bar
 * chart or the Profile screen's year-heatmap dots): each day shows its number,
 * a small dot if any hours were logged that day, and today gets a rounded
 * outline. Tapping any day opens manual entry for that date directly — no
 * intermediate selection/popover step.
 */
export function MonthCalendar({
  theme,
  chart,
  locale,
  canGoNext,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
}: {
  theme: Theme;
  chart: ChartMonth;
  locale: string;
  canGoNext: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (day: number) => void;
}) {
  const labels = useMemo(() => weekdayLabels(locale), [locale]);
  const weeks = useMemo(() => {
    const firstWeekday = new Date(chart.year, chart.month0, 1).getDay();
    const cells: (DayCell | null)[] = Array(firstWeekday).fill(null);
    for (const d of chart.days) {
      cells.push({ day: d.day, hours: d.hours, isToday: d.isToday });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (DayCell | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [chart]);

  return (
    <View>
      <View style={styles.header}>
        <Pressable onPress={onPrevMonth} hitSlop={8} style={styles.navBtn}>
          <Text style={[styles.navArrow, { color: theme.secondaryText }]}>‹</Text>
        </Pressable>
        <Text style={[styles.monthLabel, { color: theme.text }]}>{chart.label}</Text>
        <Pressable onPress={canGoNext ? onNextMonth : undefined} hitSlop={8} style={styles.navBtn}>
          <Text style={[styles.navArrow, { color: canGoNext ? theme.secondaryText : theme.border }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {labels.map((label, i) => (
          <View key={i} style={styles.cellSlot}>
            <Text style={[styles.weekdayLabel, { color: theme.secondaryText }]}>{label}</Text>
          </View>
        ))}
      </View>

      {weeks.map((row, ri) => (
        <View key={ri} style={styles.weekRow}>
          {row.map((cell, ci) => {
            if (!cell) return <View key={ci} style={styles.cellSlot} />;
            return (
              <Pressable key={ci} style={styles.cellSlot} onPress={() => onSelectDay(cell.day)}>
                <View style={[styles.dayBox, cell.isToday ? { borderColor: theme.gold } : null]}>
                  <Text style={[styles.dayNumber, { color: theme.text }]}>{cell.day}</Text>
                </View>
                <View style={[styles.dot, { backgroundColor: cell.hours > 0 ? theme.accent : 'transparent' }]} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  navArrow: { fontSize: 16 },
  monthLabel: { fontSize: 14.5, fontWeight: '600' },
  weekRow: { flexDirection: 'row' },
  cellSlot: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  weekdayLabel: { fontSize: 11, fontWeight: '600' },
  dayBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: { fontSize: 13.5 },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
});
