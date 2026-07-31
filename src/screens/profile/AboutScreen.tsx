import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import { themeFor } from '../../theme/theme';
import type { RootNavProp } from '../../navigation/types';

const APP_VERSION = '1.0.0';

export function AboutScreen({ navigation }: { navigation: RootNavProp }) {
  const { state } = useApp();
  const { t } = useTranslation();
  const theme = themeFor(state.darkMode);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityLabel={t('common.back')} testID="back-btn">
          <Text style={[styles.back, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>{t('about.title')}</Text>
      </View>

      <Text style={[styles.appName, { color: theme.text }]}>{t('about.appName')}</Text>
      <Text style={[styles.tagline, { color: theme.secondaryText }]}>{t('about.tagline')}</Text>
      <Text style={[styles.version, { color: theme.secondaryText }]}>{t('about.version', { value: APP_VERSION })}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 32 },
  back: { fontSize: 22, lineHeight: 22 },
  title: { fontSize: 20, fontWeight: '700' },
  appName: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  tagline: { fontSize: 14.5, lineHeight: 21, marginBottom: 20 },
  version: { fontSize: 13 },
});
