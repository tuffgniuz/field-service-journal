import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { Theme } from "../../theme/theme";
import type { ContributionWeek } from "../../store/selectors";
import { hexToRgba } from "../../utils/color";

/** Hours in a single day treated as "a full day" — reaches full color intensity at this point. */
const CAP_HOURS = 4;
const MIN_OPACITY = 0.22;
const LEGEND_STEPS = [0, 0.25, 0.5, 0.75, 1];

const CELL_SIZE = 12;
const CELL_GAP = 3;
/** Wide enough to fit the widest 3-letter month label (e.g. "May") without overflowing into the next column. */
const COLUMN_WIDTH = 21;

/**
 * A continuous, horizontally scrollable Mon-Sun contribution grid spanning
 * the whole service year, GitHub-style — one column per week rather than 12
 * separate per-month grids, so the visible window shows roughly three months
 * at a time and the rest scrolls into view. Month labels sit above the week
 * column that contains that month's 1st, left-aligned so they can spill into
 * the following (unlabeled) columns the same way GitHub's do.
 */
export function YearHeatmap({
  theme,
  weeks,
}: {
  theme: Theme;
  weeks: ContributionWeek[];
}) {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);

  // `onContentSizeChange` alone isn't reliable everywhere (react-native-web
  // in particular can miss it), so also scroll imperatively once mounted,
  // deferred a tick since the content isn't guaranteed to have measured yet
  // during the synchronous mount/layout callbacks.
  useEffect(() => {
    const id = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 0);
    return () => clearTimeout(id);
  }, [weeks.length]);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: theme.text }]}>{t("profile.heatmapTitle")}</Text>
      <View style={styles.gridRow}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          <View>
            <View style={styles.monthRow}>
              {weeks.map((week, wi) => (
                <View key={wi} style={styles.weekCol}>
                  {week.monthLabel ? (
                    <Text
                      style={[
                        styles.monthLabel,
                        { color: week.isCurrentMonth ? theme.accent : theme.secondaryText },
                      ]}
                    >
                      {week.monthLabel}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
            <View style={styles.weekRow}>
              {weeks.map((week, wi) => (
                <View key={wi} style={styles.weekCol}>
                  {week.days.map((day, di) => {
                    const intensity = Math.min(1, day.hours / CAP_HOURS);
                    const filled = day.inRange && day.hours > 0;
                    return (
                      <View
                        key={di}
                        style={[
                          styles.dayCell,
                          {
                            backgroundColor: filled
                              ? hexToRgba(theme.gold, MIN_OPACITY + intensity * (1 - MIN_OPACITY))
                              : "transparent",
                            borderColor: day.inRange && !filled ? theme.border : "transparent",
                            borderWidth: day.inRange && !filled ? 1 : 0,
                          },
                          day.isToday ? { borderWidth: 1.5, borderColor: theme.accent } : null,
                        ]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.legendRow}>
        <Text style={[styles.legendText, { color: theme.secondaryText }]}>{t("profile.heatmapLess")}</Text>
        {LEGEND_STEPS.map((step, i) => (
          <View
            key={i}
            style={[
              styles.legendCell,
              {
                backgroundColor:
                  step === 0 ? "transparent" : hexToRgba(theme.gold, MIN_OPACITY + step * (1 - MIN_OPACITY)),
                borderColor: theme.border,
                borderWidth: step === 0 ? 1 : 0,
              },
            ]}
          />
        ))}
        <Text style={[styles.legendText, { color: theme.secondaryText }]}>{t("profile.heatmapMore")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  title: { fontSize: 14.5, fontWeight: "600" },
  gridRow: { flexDirection: "row" },
  monthRow: { flexDirection: "row", height: 16 },
  weekRow: { flexDirection: "row" },
  weekCol: { width: COLUMN_WIDTH, position: "relative", alignItems: "center" },
  monthLabel: {
    position: "absolute",
    left: 0,
    top: 0,
    fontSize: 10,
    fontWeight: "700",
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    marginBottom: CELL_GAP,
    borderRadius: 2,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  legendText: { fontSize: 10.5 },
  legendCell: { width: 9, height: 9, borderRadius: 2 },
});
