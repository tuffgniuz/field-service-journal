import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../theme/theme';
import type { RecentVisit } from '../../store/selectors';
import { statusColor } from '../../utils/statusColor';
import { formatShortDate } from '../../utils/dates';
import { ContactAvatar } from '../../components/ContactAvatar';

export function RecentVisitsCard({
  theme,
  locale,
  visits,
  onLogVisit,
  onOpenVisit,
}: {
  theme: Theme;
  locale: string;
  visits: RecentVisit[];
  onLogVisit: () => void;
  onOpenVisit: (visit: RecentVisit) => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.secondaryText }]}>{t('log.recentVisits')}</Text>
        <Pressable onPress={onLogVisit} hitSlop={8}>
          <Text style={[styles.logVisitLink, { color: theme.accent }]}>{t('log.logVisit')}</Text>
        </Pressable>
      </View>

      {visits.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>{t('log.noRecentVisits')}</Text>
        </View>
      ) : (
        <FlatList
          horizontal
          data={visits}
          keyExtractor={(v) => v.visitId}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onOpenVisit(item)}
              style={[styles.visitCard, { backgroundColor: theme.card }]}
            >
              <View style={styles.nameRow}>
                <ContactAvatar
                  name={item.contactName}
                  color={statusColor(theme, item.status)}
                  size={22}
                  fontSize={9}
                />
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                  {item.contactName}
                </Text>
              </View>
              <Text style={[styles.date, { color: theme.secondaryText }]}>{formatShortDate(item.date, locale)}</Text>
              <Text style={[styles.snippet, { color: theme.text }]} numberOfLines={2}>
                {item.covered}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  logVisitLink: { fontSize: 12.5, fontWeight: '600' },
  emptyCard: {
    width: 160,
    minHeight: 96,
    borderWidth: 1,
    borderStyle: 'dotted',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontSize: 13, textAlign: 'center' },
  list: { gap: 10 },
  visitCard: { width: 160, borderRadius: 12, padding: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  name: { fontSize: 13.5, fontWeight: '600', flex: 1 },
  date: { fontSize: 10, marginBottom: 6 },
  snippet: { fontSize: 12, lineHeight: 16 },
});
