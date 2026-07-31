import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import { themeFor } from '../../theme/theme';
import { KeyboardAvoidingScrollView } from '../../components/KeyboardAvoidingScrollView';
import { LabeledTextArea } from '../../components/Field';
import { Chip } from '../../components/Chip';
import { PillButton } from '../../components/PillButton';
import { dateKey, parseDateKey } from '../../utils/dates';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import type { RootNavProp, RootStackParamList } from '../../navigation/types';

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
  const REMINDER_OPTIONS = [
    { v: 3, l: t('addVisit.reminder3days') },
    { v: 7, l: t('addVisit.reminder1week') },
    { v: 14, l: t('addVisit.reminder2weeks') },
    { v: 30, l: t('addVisit.reminder1month') },
  ];
  const { contactId, visitId } = route.params;
  const contact = state.contacts.find((c) => c.id === contactId);
  const editingVisit = visitId ? contact?.visits.find((v) => v.id === visitId) : null;

  const [date, setDate] = useState<Date>(editingVisit ? parseDateKey(editingVisit.date) : new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [covered, setCovered] = useState(editingVisit?.covered ?? '');
  const [standout, setStandout] = useState(editingVisit?.standout ?? '');
  const [reminder, setReminder] = useState<number | null>(null);

  if (!contact) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, padding: 24, paddingTop: insets.top + 24 }}>
        <Text style={{ color: theme.text }}>{t('contactDetail.notFound')}</Text>
      </View>
    );
  }

  const save = () => {
    actions.saveVisit(contactId, { date: dateKey(date), covered, standout, reminderDays: reminder }, visitId ?? null);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={[styles.cancel, { color: theme.secondaryText }]}>{t('addVisit.cancel')}</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>
          {editingVisit ? t('addVisit.editTitle') : t('addVisit.addTitle')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <Text style={[styles.label, { color: theme.secondaryText }]}>{t('addVisit.date')}</Text>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={[styles.dateInput, { borderColor: theme.border, backgroundColor: theme.card }]}
      >
        <Text style={{ color: theme.text, fontSize: 14.5 }}>
          {date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
        </Text>
      </Pressable>
      {showPicker ? (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={new Date()}
          onChange={(_, selected) => {
            setShowPicker(Platform.OS === 'ios');
            if (selected) setDate(selected);
          }}
        />
      ) : null}

      <LabeledTextArea
        label={t('addVisit.covered')}
        value={covered}
        onChangeText={setCovered}
        placeholder={t('addVisit.coveredPlaceholder')}
        theme={theme}
        minHeight={110}
        style={{ marginBottom: 18 }}
      />

      <LabeledTextArea
        label={t('addVisit.standout')}
        value={standout}
        onChangeText={setStandout}
        placeholder={t('addVisit.standoutPlaceholder')}
        theme={theme}
        minHeight={64}
        bordered={false}
        fontSize={13.5}
        style={{ marginBottom: 22 }}
      />

      <Text style={[styles.label, { color: theme.secondaryText, marginBottom: 8 }]}>{t('addVisit.remindIn')}</Text>
      <View style={styles.chipsRow}>
        {REMINDER_OPTIONS.map((r) => {
          const active = reminder === r.v;
          return (
            <Chip
              key={r.v}
              label={r.l}
              onPress={() => setReminder(active ? null : r.v)}
              borderColor={active ? theme.accent : theme.border}
              bg={active ? theme.accent : 'transparent'}
              color={active ? theme.accentText : theme.secondaryText}
            />
          );
        })}
      </View>

      <PillButton label={t('addVisit.save')} onPress={save} theme={theme} style={{ marginTop: 30 }} />
    </KeyboardAvoidingScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  cancel: { fontSize: 14.5 },
  title: { fontSize: 15.5, fontWeight: '700' },
  label: { fontSize: 12, marginBottom: 6 },
  dateInput: { borderWidth: 1, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 22 },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
