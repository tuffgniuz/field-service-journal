import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../../theme/theme';
import type { ChartMonth } from '../../store/selectors';
import { hexToRgba } from '../../utils/color';
import { weekdayLabels } from '../../utils/dates';

/** Hours in a single day treated as "a full day" — reaches full color intensity at this point. */
const CAP_HOURS = 4;
const MIN_OPACITY = 0.22;

interface DayCell {
  day: number;
  hours: number;
  isToday: boolean;
}

/**
 * Calendar-grid heat map (rows of weeks, Sun–Sat columns) for the current
 * month, shaded by hours logged that day — same idea as a GitHub commit
 * heat map, adapted to a single month's calendar layout instead of a
 * horizontal band of week-columns, since that reads far more naturally at
 * this width and for a one-month window.
 */
export function MonthHeatmap({ theme, chart, locale }: { theme: Theme; chart: ChartMonth; locale: string }) {
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
      <View style={styles.weekRow}>
        {labels.map((label, i) => (
          <View key={i} style={styles.weekdaySlot}>
            <Text style={[styles.weekdayLabel, { color: theme.secondaryText }]}>{label}</Text>
          </View>
        ))}
      </View>
      {weeks.map((row, ri) => (
        <View key={ri} style={styles.weekRow}>
          {row.map((cell, ci) => {
            if (!cell) return <View key={ci} style={styles.cellSlot} />;
            const intensity = Math.min(1, cell.hours / CAP_HOURS);
            const filled = cell.hours > 0;
            return (
              <View key={ci} style={styles.cellSlot}>
                <View
                  style={[
                    styles.cell,
                    {
                      backgroundColor: filled ? hexToRgba(theme.gold, MIN_OPACITY + intensity * (1 - MIN_OPACITY)) : 'transparent',
                      borderColor: filled ? 'transparent' : theme.border,
                      borderWidth: filled ? 0 : 1,
                    },
                    cell.isToday ? { borderWidth: 1.5, borderColor: theme.accent } : null,
                  ]}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  cellSlot: { flex: 1, aspectRatio: 1, padding: 2 },
  cell: { flex: 1, borderRadius: 6 },
  weekdaySlot: { flex: 1, paddingBottom: 4 },
  weekdayLabel: { textAlign: 'center', fontSize: 11, fontWeight: '600' },
});
