import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { themeFor } from '../../theme/theme';
import { hexToRgba } from '../../utils/color';
import type { Note } from '../../store/types';
import type { TabScreenNavProp } from '../../navigation/types';

export function NotesListScreen({ navigation }: { navigation: TabScreenNavProp<'Notes'> }) {
  const { state } = useApp();
  const { t } = useTranslation();
  const theme = themeFor(state.darkMode);
  const insets = useSafeAreaInsets();

  const notes = useMemo(
    () => [...state.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [state.notes]
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <View style={[styles.headerRow, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => navigation.navigate('NoteEditor')}
          style={[styles.addNoteBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={[styles.addNoteBtnLabel, { color: theme.accentText }]}>{t('notes.addNote')}</Text>
        </Pressable>
      </View>

      {notes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>{t('notes.empty')}</Text>
          <Pressable onPress={() => navigation.navigate('NoteEditor')}>
            <Text style={[styles.emptyAction, { color: theme.accent }]}>{t('notes.emptyAction')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          renderItem={({ item: n }: { item: Note }) => (
            <Pressable
              onPress={() => navigation.navigate('NoteEditor', { noteId: n.id })}
              style={[styles.card, { backgroundColor: theme.card }]}
            >
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                {n.title || t('notes.untitled')}
              </Text>
              {n.tags.length > 0 ? (
                <View style={styles.tagsRow}>
                  {n.tags.map((tag) => (
                    <View key={tag} style={[styles.tagChip, { backgroundColor: hexToRgba(theme.accent, 0.12) }]}>
                      <Text style={[styles.tagLabel, { color: theme.accent }]} numberOfLines={1}>
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {n.body.trim() ? (
                <Text style={[styles.snippet, { color: theme.secondaryText }]} numberOfLines={2}>
                  {n.body.trim()}
                </Text>
              ) : null}
            </Pressable>
          )}
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
  addNoteBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18 },
  addNoteBtnLabel: { fontSize: 13.5, fontWeight: '600' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, marginBottom: 14 },
  emptyAction: { fontWeight: '600', fontSize: 14 },
  card: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
  },
  title: { fontSize: 15.5, fontWeight: '600', marginBottom: 6 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tagChip: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 8, maxWidth: 160 },
  tagLabel: { fontSize: 11, fontWeight: '600' },
  snippet: { fontSize: 13, lineHeight: 18 },
});
