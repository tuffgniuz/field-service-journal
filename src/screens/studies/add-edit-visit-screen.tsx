import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { themeFor } from '../../theme/theme';
import { KeyboardAvoidingScrollView } from '../../components/layout/keyboard-avoiding-scroll-view';
import { LabeledTextArea } from '../../components/inputs/field';
import { PillButton } from '../../components/actions/pill-button';
import { VisitDateCalendar } from './visit-date-calendar';
import { type Contact, type Visit } from '../../store/types';
import { todayKey } from '../../utils/dates';
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
  const { contactId, visitId } = route.params;
  const contact = state.contacts.find((c: Contact) => c.id === contactId);
  const editingVisit = visitId ? contact?.visits.find((v: Visit) => v.id === visitId) : null;

  const [selectedDate, setSelectedDate] = useState(editingVisit?.date ?? todayKey());
  const [covered, setCovered] = useState(editingVisit?.covered ?? '');

  if (!contact) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, padding: 24, paddingTop: insets.top + 24 }}>
        <Text style={{ color: theme.text }}>{t('contactDetail.notFound')}</Text>
      </View>
    );
  }

  const save = () => {
    const finalDate = (!visitId && selectedDate === todayKey()) ? new Date().toISOString() : selectedDate;
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
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingScrollView
        style={styles.flex}
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
        <View style={[styles.calendarCard, { borderColor: theme.border }]}>
          <VisitDateCalendar theme={theme} locale={locale} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </View>

        <LabeledTextArea
          label={t('addVisit.covered')}
          value={covered}
          onChangeText={setCovered}
          placeholder={t('addVisit.coveredPlaceholder')}
          theme={theme}
          minHeight={110}
        />
      </KeyboardAvoidingScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.bg, paddingBottom: insets.bottom + 16 }]}>
        <PillButton label={t('addVisit.save')} onPress={save} theme={theme} />
        {editingVisit ? (
          <Pressable onPress={onDelete} style={styles.deleteBtn}>
            <Text style={[styles.deleteLabel, { color: theme.danger }]}>{t('addVisit.deleteVisit')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 24, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  cancel: { fontSize: 14.5 },
  title: { fontSize: 15.5, fontWeight: '700' },
  label: { fontSize: 12, marginBottom: 6 },
  calendarCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 22 },
  footer: { paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1 },
  deleteBtn: { alignItems: 'center', marginTop: 16 },
  deleteLabel: { fontSize: 14, fontWeight: '600' },
});
