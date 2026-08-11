import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { themeFor } from '../../theme/theme';
import { useStatusMeta } from '../../hooks/use-status-meta';
import { lastVisitOf, sortedContacts } from '../../store/selectors';
import { formatRelativeTime } from '../../utils/dates';
import { statusColor } from '../../utils/status-color';
import { ContactAvatar } from '../../components/data-display/contact-avatar';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import { publicationTitle, studyItemsForPublication, studyProgressSummary } from '../../utils/publications';
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
        <Pressable
          onPress={() => navigation.navigate('AddContact')}
          style={[styles.addContactBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={[styles.addContactBtnLabel, { color: theme.accentText }]}>{t('studies.addContactBtn')}</Text>
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
            const color = statusColor(theme, c.status);
            const studyItems = c.status === 'bible_study' && c.publication ? studyItemsForPublication(c.publication) : [];
            const studySummary = studyItems.length ? studyProgressSummary(studyItems, c.studyProgress) : null;
            return (
              <Pressable
                onPress={() => navigation.navigate('ContactDetail', { contactId: c.id })}
                style={[styles.card, { backgroundColor: theme.card }]}
              >
                <ContactAvatar name={c.name} color={color} />
                <View style={styles.content}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={[styles.statusLabel, { color }]} numberOfLines={1}>
                      {statusMeta[c.status]}
                    </Text>
                  </View>
                  <Text style={[styles.since, { color: theme.secondaryText }]}>
                    {lv
                      ? formatRelativeTime(lv.date, locale)
                      : t('studies.noVisitsYet')}
                  </Text>
                  {studySummary ? (
                    <View style={styles.studyWrap}>
                      <View style={styles.studyHeaderRow}>
                        <Text style={[styles.studyLabel, { color: theme.secondaryText }]}>
                          {publicationTitle(c.publication ?? '', state.language)}
                        </Text>
                        <Text style={[styles.studyPercent, { color: theme.secondaryText }]}>
                          {t('studies.studyProgressPercent', { percent: studySummary.percent })}
                        </Text>
                      </View>
                      <View style={[styles.studyTrack, { backgroundColor: theme.border }]}>
                        <View
                          style={[
                            styles.studyFill,
                            { backgroundColor: theme.accent, width: `${studySummary.percent}%` },
                          ]}
                        />
                      </View>
                    </View>
                  ) : null}
                </View>
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
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    marginBottom: 18,
  },
  addContactBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18 },
  addContactBtnLabel: { fontSize: 13.5, fontWeight: '600' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, marginBottom: 14 },
  emptyAction: { fontWeight: '600', fontSize: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
  },
  content: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 },
  name: { fontSize: 15.5, fontWeight: '600', flex: 1 },
  statusLabel: { fontSize: 12, fontWeight: '600', flexShrink: 0 },
  since: { fontSize: 12.5, marginBottom: 3 },
  studyWrap: { marginTop: 6, gap: 6 },
  studyHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  studyLabel: { fontSize: 11.5, fontWeight: '600', flex: 1 },
  studyPercent: { fontSize: 11.5, fontWeight: '600', flexShrink: 0 },
  studyTrack: { height: 6, borderRadius: 999, overflow: 'hidden' },
  studyFill: { height: '100%', borderRadius: 999 },
});
