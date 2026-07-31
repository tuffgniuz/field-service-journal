import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import { themeFor } from '../../theme/theme';
import { KeyboardAvoidingScrollView } from '../../components/KeyboardAvoidingScrollView';
import { useStatusMeta } from '../../i18n/labels';
import { statusColor } from '../../utils/statusColor';
import { hexToRgba } from '../../utils/color';
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
  const [name, setName] = useState(contact?.name ?? '');

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
        <TextInput
          value={name}
          onChangeText={(v) => {
            setName(v);
            actions.setContactName(contact.id, v);
          }}
          onBlur={() => {
            if (!name.trim()) {
              const fallback = t('addContact.unnamedFallback');
              setName(fallback);
              actions.setContactName(contact.id, fallback);
            }
          }}
          accessibilityLabel={t('contactDetail.editNameAccessibility')}
          style={[styles.name, { color: theme.text }]}
        />
        <Pressable
          onPress={() => navigation.navigate('AddEditVisit', { contactId: contact.id })}
          style={[styles.addVisitBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={[styles.addVisitBtnLabel, { color: theme.accentText }]}>{t('contactDetail.addVisit')}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => actions.cycleContactStatus(contact.id)}
        style={[styles.statusTag, { backgroundColor: hexToRgba(color, 0.16) }]}
      >
        <Text style={[styles.statusTagLabel, { color }]}>{statusMeta[contact.status]}</Text>
      </Pressable>

      <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
        {lastVisit ? (
          <>
            <Text style={[styles.cardMeta, { color: theme.secondaryText }]}>
              {t('contactDetail.lastVisit', { date: formatShortDate(lastVisit.date, locale) })}
            </Text>
            <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>{t('contactDetail.covered')}</Text>
            <Text style={[styles.cardBody, { color: theme.text }]}>{lastVisit.covered}</Text>
          </>
        ) : (
          <Text style={[styles.cardBody, { color: theme.secondaryText }]}>{t('contactDetail.noVisitsLogged')}</Text>
        )}
      </View>

      <Text style={[styles.sectionLabel, { color: theme.secondaryText, marginBottom: 14 }]}>
        {t('contactDetail.visitHistory')}
      </Text>
      {timeline.map((v, i) => (
        <Pressable
          key={v.id}
          onPress={() => navigation.navigate('AddEditVisit', { contactId: contact.id, visitId: v.id })}
          style={styles.tlRow}
        >
          <View style={styles.tlMarker}>
            <View style={[styles.tlDot, { borderColor: color, backgroundColor: theme.bg }]} />
            {i < timeline.length - 1 ? <View style={[styles.tlLine, { backgroundColor: theme.border }]} /> : null}
          </View>
          <View style={styles.tlContent}>
            <Text style={[styles.tlDate, { color: theme.text }]}>{formatShortDate(v.date, locale)}</Text>
            <Text style={[styles.tlCovered, { color: theme.secondaryText }]} numberOfLines={2}>
              {v.covered}
            </Text>
          </View>
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
  name: { flex: 1, fontSize: 20, fontWeight: '700', padding: 0 },
  addVisitBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18 },
  addVisitBtnLabel: { fontSize: 13.5, fontWeight: '600' },
  statusTag: { alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, marginBottom: 20 },
  statusTagLabel: { fontSize: 12.5, fontWeight: '600' },
  card: { borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 20 },
  cardMeta: { fontSize: 12, marginBottom: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  cardBody: { fontSize: 14.5, lineHeight: 20 },
  tlRow: { flexDirection: 'row' },
  tlMarker: { width: 20, alignItems: 'center' },
  tlDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, marginTop: 4 },
  tlLine: { flex: 1, width: 1, marginTop: 2 },
  tlContent: { flex: 1, paddingBottom: 20 },
  tlDate: { fontSize: 13.5, fontWeight: '600', marginBottom: 4 },
  tlCovered: { fontSize: 13, lineHeight: 18 },
});
