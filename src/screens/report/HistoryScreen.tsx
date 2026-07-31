import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import { themeFor } from '../../theme/theme';
import { historyMonths } from '../../store/selectors';
import { isPioneerRole } from '../../utils/report';
import { fmtHours } from '../../utils/format';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import type { RootNavProp } from '../../navigation/types';

export function HistoryScreen({ navigation }: { navigation: RootNavProp }) {
  const { state } = useApp();
  const { t } = useTranslation();
  const theme = themeFor(state.darkMode);
  const locale = INTL_LOCALE_TAGS[state.language];
  const insets = useSafeAreaInsets();
  const isPioneer = isPioneerRole(state);
  const rows = useMemo(() => historyMonths(state, locale), [state, locale]);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityLabel={t('common.back')} testID="back-btn">
          <Text style={[styles.back, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>{t('history.title')}</Text>
      </View>

      {rows.length === 0 ? (
        <Text style={{ color: theme.secondaryText, fontSize: 14, paddingVertical: 20 }}>{t('history.noPastMonths')}</Text>
      ) : (
        rows.map((h) => {
          const isExpanded = expanded === h.monthKey;
          const summary = isPioneer
            ? t('history.hoursSummary', { value: fmtHours(h.hours) })
            : h.participated
              ? t('history.shared')
              : t('history.notShared');
          return (
            <View key={h.monthKey} style={[styles.rowWrap, { borderBottomColor: theme.border }]}>
              <Pressable
                onPress={() => setExpanded(isExpanded ? null : h.monthKey)}
                style={styles.row}
              >
                <Text style={[styles.rowLabel, { color: theme.text }]}>{h.label}</Text>
                <View style={styles.rowRight}>
                  <Text style={[styles.summary, { color: theme.secondaryText }]}>{summary}</Text>
                  <Text
                    style={[
                      styles.chevron,
                      { color: theme.secondaryText, transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] },
                    ]}
                  >
                    ›
                  </Text>
                </View>
              </Pressable>
              {isExpanded ? (
                <View style={styles.detail}>
                  {!isPioneer ? (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>{t('report.sharedInMinistry')}</Text>
                      <Text style={{ color: theme.text, fontSize: 13.5 }}>{h.participated ? t('common.yes') : t('common.no')}</Text>
                    </View>
                  ) : (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>{t('report.fieldServiceHours')}</Text>
                      <Text style={{ color: theme.text, fontSize: 13.5 }}>{fmtHours(h.hours)}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>{t('report.bibleStudies')}</Text>
                    <Text style={{ color: theme.text, fontSize: 13.5 }}>{h.studies}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  back: { fontSize: 22, lineHeight: 22 },
  title: { fontSize: 20, fontWeight: '700' },
  rowWrap: { borderBottomWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summary: { fontSize: 14 },
  chevron: { fontSize: 13 },
  detail: { paddingBottom: 18 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  detailLabel: { fontSize: 13.5 },
});
