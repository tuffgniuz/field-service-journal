import React, { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../theme/theme';
import { TRANSLATE_LANGUAGES, type TranslateLanguage } from '../../utils/translate-languages';

/**
 * Rendered as a plain in-screen overlay rather than a navigator modal, same
 * reasoning as ManualEntrySheet: it contains a text input (the search box),
 * and a stacked native modal route doesn't reliably get keyboard-resize
 * events on Android.
 */
export function TranslateLanguageSheet({
  visible,
  onClose,
  onSelect,
  theme,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (language: TranslateLanguage) => void;
  theme: Theme;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TRANSLATE_LANGUAGES;
    return TRANSLATE_LANGUAGES.filter((l: TranslateLanguage) => l.name.toLowerCase().includes(q));
  }, [query]);

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      style={StyleSheet.absoluteFill}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.bg }]} onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.title, { color: theme.text }]}>{t('report.pickLanguage')}</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('report.searchLanguage')}
            placeholderTextColor={theme.secondaryText}
            style={[styles.search, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]}
            autoCorrect={false}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                style={[styles.row, { borderBottomColor: theme.border }]}
              >
                <Text style={{ color: theme.text, fontSize: 14.5 }}>{item.name}</Text>
              </Pressable>
            )}
          />
        </Pressable>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { width: '100%', height: '72%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 14 },
  search: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14.5,
    marginBottom: 12,
  },
  list: { flex: 1 },
  row: { paddingVertical: 14, borderBottomWidth: 1 },
});
