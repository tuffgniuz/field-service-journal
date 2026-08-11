import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { themeFor } from '../../theme/theme';
import { TrashIcon } from '../../components/data-display/icons';
import type { RootNavProp, RootStackParamList } from '../../navigation/types';

export function NoteEditorScreen({
  navigation,
  route,
}: {
  navigation: RootNavProp;
  route: RouteProp<RootStackParamList, 'NoteEditor'>;
}) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const theme = themeFor(state.darkMode);
  const insets = useSafeAreaInsets();
  const editingNoteId = route.params?.noteId;
  const editingNote = editingNoteId ? state.notes.find((n) => n.id === editingNoteId) : undefined;
  const [title, setTitle] = useState(editingNote?.title ?? '');
  const [tagsText, setTagsText] = useState(editingNote?.tags.join(', ') ?? '');
  const [body, setBody] = useState(editingNote?.body ?? '');

  const save = () => {
    if (editingNoteId) actions.updateNote(editingNoteId, { title, tags: tagsText, body });
    else actions.addNote({ title, tags: tagsText, body });
    navigation.goBack();
  };

  const onDelete = () => {
    if (!editingNoteId) return;
    Alert.alert(t('notes.deleteTitle'), t('notes.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('notes.deleteNote'),
        style: 'destructive',
        onPress: () => {
          actions.deleteNote(editingNoteId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.bg, paddingTop: insets.top + 12 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={[styles.cancel, { color: theme.secondaryText }]}>{t('notes.cancel')}</Text>
        </Pressable>
        <View style={styles.headerRight}>
          {editingNoteId ? (
            <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteIconBtn}>
              <TrashIcon color={theme.danger} size={16} />
            </Pressable>
          ) : null}
          <Pressable onPress={save} style={[styles.saveBtn, { backgroundColor: theme.accent }]}>
            <Text style={[styles.saveBtnLabel, { color: theme.accentText }]}>{t('notes.save')}</Text>
          </Pressable>
        </View>
      </View>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t('notes.titlePlaceholder')}
        placeholderTextColor={theme.secondaryText}
        style={[styles.titleInput, { color: theme.text }]}
        multiline
      />

      <TextInput
        value={tagsText}
        onChangeText={setTagsText}
        placeholder={t('notes.tagsPlaceholder')}
        placeholderTextColor={theme.secondaryText}
        style={[styles.tagsInput, { color: theme.text }]}
      />

      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder={t('notes.bodyPlaceholder')}
        placeholderTextColor={theme.secondaryText}
        multiline
        style={[styles.body, { color: theme.text, paddingBottom: insets.bottom + 24 }]}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  cancel: { fontSize: 14.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  deleteIconBtn: { padding: 4 },
  saveBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18 },
  saveBtnLabel: { fontSize: 13.5, fontWeight: '700' },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    padding: 0,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tagsInput: {
    fontSize: 13.5,
    padding: 0,
    paddingHorizontal: 20,
    marginBottom: 22,
  },
  body: {
    flex: 1,
    fontSize: 15.5,
    lineHeight: 23,
    padding: 0,
    paddingHorizontal: 20,
    textAlignVertical: 'top',
  },
});
