import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import { themeFor } from '../../theme/theme';
import { KeyboardAvoidingScrollView } from '../../components/KeyboardAvoidingScrollView';
import { LabeledInput } from '../../components/Field';
import { Chip } from '../../components/Chip';
import { PillButton } from '../../components/PillButton';
import { STATUS_ORDER, type ContactStatus } from '../../store/types';
import { useStatusMeta } from '../../i18n/labels';
import { statusColor } from '../../utils/statusColor';
import type { RootNavProp } from '../../navigation/types';

export function AddContactScreen({ navigation }: { navigation: RootNavProp }) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const statusMeta = useStatusMeta();
  const theme = themeFor(state.darkMode);
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [status, setStatus] = useState<ContactStatus>('bible_study');
  const [publication, setPublication] = useState('');
  const [address, setAddress] = useState('');

  const save = () => {
    actions.addContact({ name, status, publication, address });
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={[styles.cancel, { color: theme.secondaryText }]}>{t('addContact.cancel')}</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>{t('addContact.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <LabeledInput
        label={t('addContact.name')}
        value={name}
        onChangeText={setName}
        placeholder={t('addContact.namePlaceholder')}
        theme={theme}
        style={{ marginBottom: 22 }}
      />

      <Text style={[styles.label, { color: theme.secondaryText }]}>{t('addContact.status')}</Text>
      <View style={styles.chipsRow}>
        {STATUS_ORDER.map((key) => {
          const active = status === key;
          const col = statusColor(theme, key);
          return (
            <Chip
              key={key}
              label={statusMeta[key]}
              onPress={() => setStatus(key)}
              borderColor={active ? col : theme.border}
              color={active ? col : theme.secondaryText}
            />
          );
        })}
      </View>

      <LabeledInput
        label={t('addContact.publication')}
        value={publication}
        onChangeText={setPublication}
        placeholder={t('addContact.publicationPlaceholder')}
        theme={theme}
        fontSize={14.5}
        style={{ marginBottom: 22 }}
      />

      <LabeledInput
        label={t('addContact.address')}
        value={address}
        onChangeText={setAddress}
        placeholder={t('addContact.addressPlaceholder')}
        theme={theme}
        fontSize={14.5}
        style={{ marginBottom: 30 }}
      />

      <PillButton label={t('addContact.save')} onPress={save} theme={theme} />
    </KeyboardAvoidingScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  cancel: { fontSize: 14.5 },
  title: { fontSize: 15.5, fontWeight: '700' },
  label: { fontSize: 12, marginBottom: 8 },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 22, flexWrap: 'wrap' },
});
