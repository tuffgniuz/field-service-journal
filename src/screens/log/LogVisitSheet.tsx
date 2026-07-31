import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../../theme/theme';
import type { Contact } from '../../store/types';
import { statusColor } from '../../utils/statusColor';
import type { TabScreenNavProp } from '../../navigation/types';

/**
 * Rendered as a plain in-screen overlay rather than a navigator modal, same
 * reasoning as the other sheets in this app (see ManualEntrySheet). Generic
 * "pick a contact to log a visit with" picker — reused for both the
 * Bible-study-only quick action and the general "Log visit" action, which
 * differ only in which contacts are offered and the copy shown.
 */
export function LogVisitSheet({
  visible,
  contacts,
  title,
  subtitle,
  emptyText,
  addContactLabel,
  onClose,
  navigation,
  theme,
}: {
  visible: boolean;
  contacts: Contact[];
  title: string;
  subtitle: string;
  emptyText: string;
  addContactLabel: string;
  onClose: () => void;
  navigation: TabScreenNavProp<'Log'>;
  theme: Theme;
}) {
  if (!visible) return null;

  const logWith = (contactId: string) => {
    onClose();
    navigation.navigate('AddEditVisit', { contactId });
  };

  const goAddContact = () => {
    onClose();
    navigation.navigate('AddContact');
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.bg }]} onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

          {contacts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: theme.secondaryText }]}>{emptyText}</Text>
              <Pressable onPress={goAddContact}>
                <Text style={[styles.emptyAction, { color: theme.accent }]}>{addContactLabel}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={[styles.subtitle, { color: theme.secondaryText }]}>{subtitle}</Text>
              <FlatList
                data={contacts}
                keyExtractor={(c) => c.id}
                style={styles.list}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => logWith(item.id)}
                    style={[styles.row, { borderBottomColor: theme.border }]}
                  >
                    <View style={[styles.dot, { backgroundColor: statusColor(theme, item.status) }]} />
                    <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </Pressable>
                )}
              />
            </>
          )}
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { width: '100%', height: '72%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 16 },
  list: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, borderBottomWidth: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { fontSize: 15, fontWeight: '600', flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, marginBottom: 14, textAlign: 'center' },
  emptyAction: { fontWeight: '600', fontSize: 14 },
});
