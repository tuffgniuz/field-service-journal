import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../../theme/theme';
import { dateKey, daysInMonth, monthByOffset, monthLabel, parseDateKey, todayKey, weekdayLabels } from '../../utils/dates';

interface DayCell {
  day: number;
  key: string;
  isFuture: boolean;
}

/**
 * Numbered month-calendar grid for picking a single visit date — same visual
 * language as the Log screen's MonthCalendar, but selection-based (highlights
 * `selectedDate`) rather than dot-per-logged-day, and blocks future dates
 * since a visit can't be in the future. Opens on the month containing
 * `selectedDate` (today's month for a new visit, since that's the default).
 */
export function VisitDateCalendar({
  theme,
  locale,
  selectedDate,
  onSelectDate,
}: {
  theme: Theme;
  locale: string;
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
}) {
  const [monthOffset, setMonthOffset] = useState(() => {
    const sel = parseDateKey(selectedDate);
    const now = new Date();
    return (sel.getFullYear() - now.getFullYear()) * 12 + (sel.getMonth() - now.getMonth());
  });
  const today = todayKey();
  const labels = useMemo(() => weekdayLabels(locale), [locale]);

  const { year, month0, label } = useMemo(() => {
    const anchor = monthByOffset(monthOffset);
    return { year: anchor.getFullYear(), month0: anchor.getMonth(), label: monthLabel(anchor, locale) };
  }, [monthOffset, locale]);

  const weeks = useMemo(() => {
    const total = daysInMonth(year, month0);
    const firstWeekday = new Date(year, month0, 1).getDay();
    const cells: (DayCell | null)[] = Array(firstWeekday).fill(null);
    for (let day = 1; day <= total; day++) {
      const key = dateKey(new Date(year, month0, day));
      cells.push({ day, key, isFuture: key > today });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (DayCell | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [year, month0, today]);

  const canGoNext = monthOffset < 0;

  return (
    <View>
      <View style={styles.header}>
        <Pressable onPress={() => setMonthOffset((o) => Math.max(-24, o - 1))} hitSlop={8} style={styles.navBtn}>
          <Text style={[styles.navArrow, { color: theme.secondaryText }]}>‹</Text>
        </Pressable>
        <Text style={[styles.monthLabel, { color: theme.text }]}>{label}</Text>
        <Pressable
          onPress={canGoNext ? () => setMonthOffset((o) => Math.min(0, o + 1)) : undefined}
          hitSlop={8}
          style={styles.navBtn}
        >
          <Text style={[styles.navArrow, { color: canGoNext ? theme.secondaryText : theme.border }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {labels.map((l, i) => (
          <View key={i} style={styles.cellSlot}>
            <Text style={[styles.weekdayLabel, { color: theme.secondaryText }]}>{l}</Text>
          </View>
        ))}
      </View>

      {weeks.map((row, ri) => (
        <View key={ri} style={styles.weekRow}>
          {row.map((cell, ci) => {
            if (!cell) return <View key={ci} style={styles.cellSlot} />;
            const isSelected = cell.key === selectedDate;
            const isToday = cell.key === today;
            return (
              <Pressable
                key={ci}
                style={styles.cellSlot}
                disabled={cell.isFuture}
                onPress={() => onSelectDate(cell.key)}
              >
                <View
                  style={[
                    styles.dayBox,
                    isToday && !isSelected ? { borderColor: theme.gold } : null,
                    isSelected ? { backgroundColor: theme.accent } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: isSelected ? theme.accentText : cell.isFuture ? theme.border : theme.text },
                    ]}
                  >
                    {cell.day}
                  </Text>
                </View>
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
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: { fontSize: 13.5 },
});
