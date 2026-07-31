import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import { themeFor } from '../../theme/theme';
import { KeyboardAvoidingScrollView } from '../../components/KeyboardAvoidingScrollView';
import { LabeledTextArea } from '../../components/Field';
import { useStatusMeta } from '../../i18n/labels';
import { statusColor } from '../../utils/statusColor';
import { formatShortDate } from '../../utils/dates';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import type { RootNavProp, RootStackParamList } from '../../navigation/types';

export function ContactDetailScreen({
  navigation,
  route,
}: {
  navigation: RootNavProp;
  route: RouteProp<RootStackParamList, 'ContactDetail'>;
}) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const statusMeta = useStatusMeta();
  const theme = themeFor(state.darkMode);
  const locale = INTL_LOCALE_TAGS[state.language];
  const insets = useSafeAreaInsets();
  const { contactId } = route.params;
  const contact = state.contacts.find((c) => c.id === contactId);
  const [notes, setNotes] = useState(contact?.notes ?? '');

  const timeline = useMemo(
    () => (contact ? [...contact.visits].reverse() : []),
    [contact]
  );
  const lastVisit = contact && contact.visits.length ? contact.visits[contact.visits.length - 1] : null;

  if (!contact) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.bg, padding: 24, paddingTop: insets.top + 24 }]}>
        <Text style={{ color: theme.text }}>{t('contactDetail.notFound')}</Text>
      </View>
    );
  }

  const color = statusColor(theme, contact.status);

  return (
    <KeyboardAvoidingScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityLabel={t('common.back')} testID="back-btn">
          <Text style={[styles.back, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {contact.name}
        </Text>
        <Pressable onPress={() => actions.cycleContactStatus(contact.id)} style={[styles.statusTag, { borderColor: color }]}>
          <Text style={[styles.statusTagLabel, { color }]}>{statusMeta[contact.status]}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => navigation.navigate('AddEditVisit', { contactId: contact.id })}
        style={styles.addVisit}
      >
        <Text style={[styles.addVisitLabel, { color: theme.accent }]}>{t('contactDetail.addVisit')}</Text>
      </Pressable>

      <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Text style={[styles.cardMeta, { color: theme.secondaryText }]}>
          {t('contactDetail.lastVisit', { date: lastVisit ? formatShortDate(lastVisit.date, locale) : t('common.dash') })}
        </Text>
        <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>{t('contactDetail.covered')}</Text>
        <Text style={[styles.cardBody, { color: theme.text, marginBottom: 14 }]}>
          {lastVisit ? lastVisit.covered : t('contactDetail.noVisitsLogged')}
        </Text>
        <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>{t('contactDetail.standout')}</Text>
        <Text style={[styles.cardBody, { color: theme.text }]}>{lastVisit ? lastVisit.standout : t('common.dash')}</Text>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.secondaryText, marginBottom: 8 }]}>{t('contactDetail.notes')}</Text>
      <LabeledTextArea
        value={notes}
        onChangeText={(v) => {
          setNotes(v);
          actions.setContactNotes(contact.id, v);
        }}
        placeholder={t('contactDetail.notesPlaceholder')}
        theme={theme}
        minHeight={76}
        bordered={false}
        fontSize={13.5}
        style={{ marginBottom: 24 }}
      />

      <Text style={[styles.sectionLabel, { color: theme.secondaryText, marginBottom: 10 }]}>{t('contactDetail.visitHistory')}</Text>
      {timeline.map((v) => (
        <Pressable
          key={v.id}
          onPress={() => navigation.navigate('AddEditVisit', { contactId: contact.id, visitId: v.id })}
          style={[styles.tlRow, { borderBottomColor: theme.border }]}
        >
          <Text style={[styles.tlDate, { color: theme.text }]}>{formatShortDate(v.date, locale)}</Text>
          <Text style={[styles.tlCovered, { color: theme.secondaryText }]} numberOfLines={2}>
            {v.covered}
          </Text>
        </Pressable>
      ))}
    </KeyboardAvoidingScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 24, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  back: { fontSize: 22, lineHeight: 22 },
  name: { flex: 1, fontSize: 20, fontWeight: '700' },
  statusTag: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
  statusTagLabel: { fontSize: 12, fontWeight: '600' },
  addVisit: { marginBottom: 20 },
  addVisitLabel: { fontSize: 13.5, fontWeight: '600' },
  card: { borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 20 },
  cardMeta: { fontSize: 12, marginBottom: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  cardBody: { fontSize: 14.5, lineHeight: 20 },
  tlRow: { paddingVertical: 14, borderBottomWidth: 1 },
  tlDate: { fontSize: 13.5, fontWeight: '600', marginBottom: 4 },
  tlCovered: { fontSize: 13, lineHeight: 18 },
});
