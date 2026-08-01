import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import { themeFor } from '../../theme/theme';
import { KeyboardAvoidingScrollView } from '../../components/KeyboardAvoidingScrollView';
import { ContactAvatar } from '../../components/ContactAvatar';
import { EditIcon } from '../../components/icons';
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
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => navigation.navigate('AddContact', { contactId: contact.id })}
          hitSlop={8}
          accessibilityLabel={t('contactDetail.editAccessibility')}
          style={[styles.editBtn, { borderColor: theme.border }]}
        >
          <EditIcon color={theme.secondaryText} size={16} />
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('AddEditVisit', { contactId: contact.id })}
          style={[styles.addVisitBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={[styles.addVisitBtnLabel, { color: theme.accentText }]}>{t('contactDetail.addVisit')}</Text>
        </Pressable>
      </View>

      <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
        <View style={styles.profileHeaderRow}>
          <ContactAvatar name={contact.name} color={color} size={52} fontSize={16} />
          <View style={styles.nameColumn}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {contact.name}
            </Text>
            <Pressable onPress={() => actions.cycleContactStatus(contact.id)} hitSlop={6}>
              <Text style={[styles.statusSubtitle, { color: theme.secondaryText }]}>
                {statusMeta[contact.status]}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.profileRow}>
          <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>
            {t('contactDetail.publication')}
          </Text>
          <Text style={[styles.cardBody, { color: contact.publication ? theme.text : theme.secondaryText }]}>
            {contact.publication || t('common.na')}
          </Text>
        </View>

        <View style={styles.profileRow}>
          <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>{t('contactDetail.address')}</Text>
          <Text style={[styles.cardBody, { color: contact.address ? theme.text : theme.secondaryText }]}>
            {contact.address || t('common.na')}
          </Text>
        </View>

        <View style={styles.profileRow}>
          <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>{t('contactDetail.lastVisit')}</Text>
          <Text style={[styles.cardBody, { color: lastVisit ? theme.text : theme.secondaryText }]}>
            {lastVisit ? formatShortDate(lastVisit.date, locale) : t('common.na')}
          </Text>
        </View>
      </View>

      {lastVisit ? (
        <>
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
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
            {t('contactDetail.noVisitsLogged')}
          </Text>
        </View>
      )}
    </KeyboardAvoidingScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  back: { fontSize: 22, lineHeight: 22 },
  addVisitBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18 },
  addVisitBtnLabel: { fontSize: 13.5, fontWeight: '600' },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  nameColumn: { flex: 1 },
  name: { fontSize: 19, fontWeight: '700' },
  statusSubtitle: { fontSize: 13, marginTop: 3 },
  profileCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
  },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  cardBody: { fontSize: 14.5, lineHeight: 20, textAlign: 'right', flex: 1 },
  tlRow: { flexDirection: 'row' },
  tlMarker: { width: 20, alignItems: 'center' },
  tlDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, marginTop: 4 },
  tlLine: { flex: 1, width: 1, marginTop: 2 },
  tlContent: { flex: 1, paddingBottom: 20 },
  tlDate: { fontSize: 13.5, fontWeight: '600', marginBottom: 4 },
  tlCovered: { fontSize: 13, lineHeight: 18 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { fontSize: 14.5 },
});
