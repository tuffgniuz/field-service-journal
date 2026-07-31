import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import { themeFor } from '../../theme/theme';
import { useStatusMeta } from '../../i18n/labels';
import { lastVisitOf, sortedContacts } from '../../store/selectors';
import { daysSince, formatShortDate } from '../../utils/dates';
import { statusColor } from '../../utils/statusColor';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import type { TabScreenNavProp } from '../../navigation/types';

export function StudiesListScreen({ navigation }: { navigation: TabScreenNavProp<'Studies'> }) {
  const { state } = useApp();
  const { t } = useTranslation();
  const statusMeta = useStatusMeta();
  const theme = themeFor(state.darkMode);
  const locale = INTL_LOCALE_TAGS[state.language];
  const insets = useSafeAreaInsets();
  const contacts = useMemo(() => sortedContacts(state.contacts), [state.contacts]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <View style={[styles.headerRow, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t('studies.title')}</Text>
        <Pressable
          onPress={() => navigation.navigate('AddContact')}
          style={[styles.addBtn, { borderColor: theme.border }]}
        >
          <Text style={{ color: theme.text, fontSize: 18, lineHeight: 20 }}>+</Text>
        </Pressable>
      </View>

      {contacts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>{t('studies.noContacts')}</Text>
          <Pressable onPress={() => navigation.navigate('AddContact')}>
            <Text style={[styles.emptyAction, { color: theme.accent }]}>{t('studies.addContact')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          renderItem={({ item: c }) => {
            const lv = lastVisitOf(c);
            const dotColor = statusColor(theme, c.status);
            return (
              <Pressable
                onPress={() => navigation.navigate('ContactDetail', { contactId: c.id })}
                style={[styles.row, { borderBottomColor: theme.border }]}
              >
                <View style={styles.rowTop}>
                  <View style={[styles.dot, { backgroundColor: dotColor }]} />
                  <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Text style={[styles.statusLabel, { color: dotColor }]}>{statusMeta[c.status]}</Text>
                </View>
                <Text style={[styles.since, { color: theme.secondaryText }]}>
                  {lv
                    ? t('studies.daysSinceLastVisit', { count: daysSince(lv.date), date: formatShortDate(lv.date, locale) })
                    : t('studies.noVisitsYet')}
                </Text>
                <Text style={[styles.snippet, { color: theme.text }]} numberOfLines={2}>
                  {lv ? lv.standout : t('studies.addVisitToStart')}
                </Text>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.4 },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, marginBottom: 14 },
  emptyAction: { fontWeight: '600', fontSize: 14 },
  row: { paddingVertical: 16, borderBottomWidth: 1, gap: 6 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { fontSize: 15.5, fontWeight: '600', flex: 1 },
  statusLabel: { fontSize: 12, fontWeight: '600' },
  since: { fontSize: 12.5, paddingLeft: 18 },
  snippet: { fontSize: 13, paddingLeft: 18, lineHeight: 18 },
});
