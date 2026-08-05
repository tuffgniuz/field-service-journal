import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../../theme/theme';
import { dateKey, monthKeyOf, weekdayLabels } from '../../utils/dates';

interface DayCell {
  day: number;
  date: Date;
  disabled: boolean;
  isToday: boolean;
  isSelected: boolean;
}

/**
 * A small calendar card anchored below the date pill on the Add/Edit Visit
 * screen — a quiet popover rather than a full-screen picker. Future dates
 * (after today) are disabled since a visit can't be logged ahead of time.
 */
export function VisitDatePopover({
  theme,
  locale,
  value,
  onSelect,
}: {
  theme: Theme;
  locale: string;
  value: Date;
  onSelect: (date: Date) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth0, setViewMonth0] = useState(value.getMonth());

  const canGoNext = monthKeyOf(new Date(viewYear, viewMonth0, 1)) < monthKeyOf(today);
  const monthLabel = new Date(viewYear, viewMonth0, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
  const labels = useMemo(() => weekdayLabels(locale), [locale]);

  const weeks = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth0 + 1, 0).getDate();
    const firstWeekday = new Date(viewYear, viewMonth0, 1).getDay();
    const todayKeyStr = dateKey(today);
    const selectedKeyStr = dateKey(value);
    const cells: (DayCell | null)[] = Array(firstWeekday).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(viewYear, viewMonth0, day);
      cells.push({
        day,
        date: cellDate,
        disabled: cellDate > today,
        isToday: dateKey(cellDate) === todayKeyStr,
        isSelected: dateKey(cellDate) === selectedKeyStr,
      });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (DayCell | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [viewYear, viewMonth0, value, today]);

  const goPrevMonth = () => {
    if (viewMonth0 === 0) {
      setViewYear((y) => y - 1);
      setViewMonth0(11);
    } else {
      setViewMonth0((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth0 === 11) {
      setViewYear((y) => y + 1);
      setViewMonth0(0);
    } else {
      setViewMonth0((m) => m + 1);
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.dark ? '#000' : theme.text },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={goPrevMonth} hitSlop={8} style={styles.navBtn}>
          <Text style={[styles.navArrow, { color: theme.secondaryText }]}>‹</Text>
        </Pressable>
        <Text style={[styles.monthLabel, { color: theme.text }]}>{monthLabel}</Text>
        <Pressable onPress={canGoNext ? goNextMonth : undefined} hitSlop={8} style={styles.navBtn}>
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
              <Pressable
                key={ci}
                style={styles.cellSlot}
                disabled={cell.disabled}
                onPress={() => onSelect(cell.date)}
              >
                <View
                  style={[
                    styles.dayBox,
                    cell.isSelected ? { backgroundColor: theme.accent } : null,
                    cell.isToday && !cell.isSelected ? { borderColor: theme.gold } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: cell.disabled ? theme.border : cell.isSelected ? theme.accentText : theme.text },
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
  card: {
    position: 'absolute',
    top: 44,
    left: '50%',
    transform: [{ translateX: -130 }],
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    width: 260,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  navArrow: { fontSize: 16 },
  monthLabel: { fontSize: 13.5, fontWeight: '600' },
  weekRow: { flexDirection: 'row' },
  cellSlot: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  weekdayLabel: { fontSize: 10.5, fontWeight: '600' },
  dayBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: { fontSize: 12.5 },
});
