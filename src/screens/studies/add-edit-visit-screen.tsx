import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { themeFor } from '../../theme/theme';
import { CalendarIcon, TrashIcon } from '../../components/data-display/icons';
import { type Contact, type Visit } from '../../store/types';
import { dateKey, parseDateKey, todayKey } from '../../utils/dates';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import type { RootNavProp, RootStackParamList } from '../../navigation/types';
import { VisitDatePopover } from './visit-date-popover';

export function AddEditVisitScreen({
  navigation,
  route,
}: {
  navigation: RootNavProp;
  route: RouteProp<RootStackParamList, 'AddEditVisit'>;
}) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const theme = themeFor(state.darkMode);
  const locale = INTL_LOCALE_TAGS[state.language];
  const insets = useSafeAreaInsets();
  const { contactId, visitId } = route.params;
  const contact = state.contacts.find((c: Contact) => c.id === contactId);
  const editingVisit = visitId ? contact?.visits.find((v: Visit) => v.id === visitId) : null;

  const [date, setDate] = useState<Date>(() => parseDateKey(editingVisit?.date ?? todayKey()));
  const [showPicker, setShowPicker] = useState(false);
  const [covered, setCovered] = useState(editingVisit?.covered ?? '');

  if (!contact) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, padding: 24, paddingTop: insets.top + 24 }}>
        <Text style={{ color: theme.text }}>{t('contactDetail.notFound')}</Text>
      </View>
    );
  }

  const selectedKey = dateKey(date);
  const dateLabel =
    selectedKey === todayKey() ? t('addVisit.today') : date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });

  const save = () => {
    const finalDate = (!visitId && selectedKey === todayKey()) ? new Date().toISOString() : selectedKey;
    actions.saveVisit(contactId, { date: finalDate, covered }, visitId ?? null);
    navigation.goBack();
  };

  const onDelete = () => {
    if (!visitId) return;
    Alert.alert(t('addVisit.deleteTitle'), t('addVisit.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('addVisit.deleteVisit'),
        style: 'destructive',
        onPress: () => {
          actions.deleteVisit(contactId, visitId);
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
          <Text style={[styles.cancel, { color: theme.secondaryText }]}>‹ {t('addVisit.cancel')}</Text>
        </Pressable>

        <View style={styles.datePillWrap}>
          <Pressable
            onPress={() => setShowPicker((v) => !v)}
            style={[styles.datePill, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <CalendarIcon color={theme.secondaryText} size={14} />
            <Text style={[styles.datePillLabel, { color: theme.text }]}>{dateLabel}</Text>
          </Pressable>
          {showPicker ? (
            <VisitDatePopover
              theme={theme}
              locale={locale}
              value={date}
              onSelect={(selected) => {
                setDate(selected);
                setShowPicker(false);
              }}
            />
          ) : null}
        </View>

        <View style={styles.headerRight}>
          {editingVisit ? (
            <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
              <TrashIcon color={theme.danger} size={16} />
            </Pressable>
          ) : null}
          <Pressable onPress={save} style={[styles.saveBtn, { backgroundColor: theme.accent }]}>
            <Text style={[styles.saveBtnLabel, { color: theme.accentText }]}>
              {editingVisit ? t('addVisit.update') : t('addVisit.save')}
            </Text>
          </Pressable>
        </View>
      </View>

      <TextInput
        value={covered}
        onChangeText={setCovered}
        placeholder={t('addVisit.coveredPlaceholder')}
        placeholderTextColor={theme.secondaryText}
        multiline
        autoFocus
        style={[styles.notes, { color: theme.text, paddingBottom: insets.bottom + 24 }]}
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
  datePillWrap: { position: 'relative' },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  datePillLabel: { fontSize: 13, fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  deleteBtn: { padding: 4 },
  saveBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18 },
  saveBtnLabel: { fontSize: 13.5, fontWeight: '700' },
  notes: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    padding: 0,
    paddingHorizontal: 20,
    textAlignVertical: 'top',
  },
});
