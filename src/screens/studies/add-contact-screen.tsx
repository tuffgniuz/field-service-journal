import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { useUi } from '../../store/ui-context';
import { themeFor } from '../../theme/theme';
import { KeyboardAvoidingScrollView } from '../../components/layout/keyboard-avoiding-scroll-view';
import { LabeledInput } from '../../components/inputs/field';
import { PublicationPickerField } from '../../components/inputs/publication-picker-field';
import { Chip } from '../../components/data-display/chip';
import { TrashIcon } from '../../components/data-display/icons';
import { STATUS_ORDER, type ContactStatus, type Contact } from '../../store/types';
import { useStatusMeta } from '../../hooks/use-status-meta';
import { useCurrentLocation } from '../../hooks/use-current-location';
import { statusColor } from '../../utils/status-color';
import type { RootNavProp, RootStackParamList } from '../../navigation/types';

export function AddContactScreen({
  navigation,
  route,
}: {
  navigation: RootNavProp;
  route: RouteProp<RootStackParamList, 'AddContact'>;
}) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const { showToast } = useUi();
  const statusMeta = useStatusMeta();
  const theme = themeFor(state.darkMode);
  const insets = useSafeAreaInsets();
  const editingContactId = route.params?.contactId;
  const editingContact = editingContactId ? state.contacts.find((c: Contact) => c.id === editingContactId) : undefined;
  const [name, setName] = useState(editingContact?.name ?? '');
  const [status, setStatus] = useState<ContactStatus>(editingContact?.status ?? 'bible_study');
  const [publication, setPublication] = useState(editingContact?.publication ?? '');
  const [address, setAddress] = useState(editingContact?.address ?? '');
  const { locating, fetchLocation } = useCurrentLocation(setAddress);

  const save = () => {
    if (editingContactId) actions.updateContact(editingContactId, { name, status, publication, address });
    else actions.addContact({ name, status, publication, address });
    navigation.goBack();
  };

  const onDelete = () => {
    if (!editingContactId) return;
    Alert.alert(t('addContact.deleteTitle'), t('addContact.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('addContact.deleteContact'),
        style: 'destructive',
        onPress: () => {
          actions.deleteContact(editingContactId);
          navigation.pop(2);
        },
      },
    ]);
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
        <Text style={[styles.title, { color: theme.text }]}>
          {t(editingContactId ? 'addContact.editTitle' : 'addContact.title')}
        </Text>
        <View style={styles.headerRight}>
          {editingContactId ? (
            <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteIconBtn}>
              <TrashIcon color={theme.danger} size={16} />
            </Pressable>
          ) : null}
          <Pressable onPress={save} style={[styles.saveBtn, { backgroundColor: theme.accent }]}>
            <Text style={[styles.saveBtnLabel, { color: theme.accentText }]}>{t('addContact.save')}</Text>
          </Pressable>
        </View>
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

      <PublicationPickerField
        label={t('addContact.publication')}
        value={publication}
        onChange={setPublication}
        language={state.language}
        theme={theme}
        placeholder={t('addContact.publicationPlaceholder')}
        noneLabel={t('addContact.publicationNone')}
        style={{ marginBottom: 22 }}
      />

      <View style={styles.addressLabelRow}>
        <Text style={[styles.label, { color: theme.secondaryText, marginBottom: 0 }]}>
          {t('addContact.address')}
        </Text>
        <Pressable onPress={fetchLocation} disabled={locating} hitSlop={6}>
          {locating ? (
            <View style={styles.locatingRow}>
              <ActivityIndicator size="small" color={theme.accent} />
              <Text style={[styles.useLocationLink, { color: theme.secondaryText }]}>{t('addContact.locating')}</Text>
            </View>
          ) : (
            <Text style={[styles.useLocationLink, { color: theme.accent }]}>{t('addContact.useCurrentLocation')}</Text>
          )}
        </Pressable>
      </View>
      <LabeledInput
        value={address}
        onChangeText={setAddress}
        placeholder={t('addContact.addressPlaceholder')}
        theme={theme}
        fontSize={14.5}
        style={{ marginBottom: 30 }}
      />
    </KeyboardAvoidingScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  cancel: { fontSize: 14.5 },
  title: { fontSize: 15.5, fontWeight: '700' },
  deleteIconBtn: { padding: 4 },
  saveBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18 },
  saveBtnLabel: { fontSize: 13.5, fontWeight: '700' },
  label: { fontSize: 12, marginBottom: 8 },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 22, flexWrap: 'wrap' },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  useLocationLink: { fontSize: 12.5, fontWeight: '600' },
  locatingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
