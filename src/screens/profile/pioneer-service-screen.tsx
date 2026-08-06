import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { themeFor } from '../../theme/theme';
import { KeyboardAvoidingScrollView } from '../../components/layout/keyboard-avoiding-scroll-view';
import { LabeledInput } from '../../components/inputs/field';
import { Chip } from '../../components/data-display/chip';
import { useRoleMeta } from '../../hooks/use-role-meta';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import { monthShortLabel, parseMonthKey } from '../../utils/dates';
import { serviceYearMonthOptions } from '../../utils/aux-pioneer';
import { MAX_CREDIT_HOURS } from '../../store/selectors';
import type { RootNavProp } from '../../navigation/types';

type RoleCardKey = 'publisher' | 'aux_pioneer' | 'regular_pioneer' | 'special_pioneer';

const ROLE_CARD_ORDER: RoleCardKey[] = ['publisher', 'aux_pioneer', 'regular_pioneer', 'special_pioneer'];

// Monday-first display order of ISO weekdays, expressed as JS Date.getDay() values (0=Sun..6=Sat).
const FAMILY_STUDY_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function weekdayShortLabel(dayOfWeek: number, locale: string): string {
  // Jan 4, 1970 was a Sunday — used purely as a known week anchor.
  return new Date(1970, 0, 4 + dayOfWeek).toLocaleDateString(locale, { weekday: 'short' });
}

export function PioneerServiceScreen({ navigation }: { navigation: RootNavProp }) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const roleMeta = useRoleMeta();
  const theme = themeFor(state.darkMode);
  const locale = INTL_LOCALE_TAGS[state.language];
  const insets = useSafeAreaInsets();

  const auxConfigured = state.role === 'publisher' && (state.auxPioneerSchedule.ongoing || state.auxPioneerSchedule.months.length > 0);
  // Tracks which top-level role card the user has selected in this session,
  // independent of whether the schedule has any real content yet — deriving
  // this purely from `ongoing || months.length > 0` would make the Auxiliary
  // Pioneer section collapse back to "Publisher" the moment someone switches
  // to "Specific months" before picking any months.
  const [selectedCard, setSelectedCard] = useState<RoleCardKey>(
    state.role !== 'publisher' ? state.role : auxConfigured ? 'aux_pioneer' : 'publisher',
  );
  const [creditAmountText, setCreditAmountText] = useState(() =>
    state.creditHoursAmount > 0 ? String(state.creditHoursAmount) : ''
  );
  const monthOptions = serviceYearMonthOptions();
  const isPioneeringRole = selectedCard !== 'publisher';

  const selectRoleCard = (card: RoleCardKey) => {
    setSelectedCard(card);
    if (card === 'aux_pioneer') {
      actions.setRole('publisher');
      if (!auxConfigured) actions.setAuxPioneerOngoing(true);
    } else if (card === 'publisher') {
      actions.setRole('publisher');
      actions.stopAuxPioneering();
    } else {
      actions.setRole(card);
    }
  };

  const onChangeCreditAmount = (v: string) => {
    if (v.trim() === '') {
      setCreditAmountText('');
      actions.setCreditHoursAmount(0);
      return;
    }
    const n = parseFloat(v);
    if (isNaN(n) || n < 0) return;
    // Clamp the displayed text too, so it's never showing a number larger than what actually gets counted.
    const clamped = Math.min(n, MAX_CREDIT_HOURS);
    setCreditAmountText(clamped === n ? v : String(clamped));
    actions.setCreditHoursAmount(clamped);
  };

  return (
    <KeyboardAvoidingScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityLabel={t('common.back')}>
            <Text style={[styles.back, { color: theme.text }]}>‹</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {t('pioneerService.title')}
          </Text>
        </View>
        <Pressable onPress={() => navigation.goBack()} style={[styles.saveBtn, { backgroundColor: theme.accent }]}>
          <Text style={[styles.saveBtnLabel, { color: theme.accentText }]}>{t('pioneerService.saveChanges')}</Text>
        </Pressable>
      </View>

      <Text style={[styles.subtitle, { color: theme.secondaryText }]}>{t('pioneerService.subtitle')}</Text>

      <View style={styles.roleList}>
        {ROLE_CARD_ORDER.map((card) => {
          const selected = selectedCard === card;
          const label = card === 'aux_pioneer' ? roleMeta.aux_pioneer : roleMeta[card];
          return (
            <Pressable
              key={card}
              onPress={() => selectRoleCard(card)}
              style={[styles.roleCard, { borderColor: selected ? theme.accent : theme.border, backgroundColor: theme.card }]}
            >
              <Text style={{ color: theme.text, fontSize: 14.5, fontWeight: selected ? '700' : '400' }}>{label}</Text>
              {selected ? <View style={[styles.dot, { backgroundColor: theme.accent }]} /> : null}
            </Pressable>
          );
        })}
      </View>

      {selectedCard === 'aux_pioneer' ? (
        <>
          <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>{t('pioneerService.scheduleLabel')}</Text>

          <Pressable
            onPress={() => actions.setAuxPioneerOngoing(true)}
            style={[
              styles.scheduleCard,
              { borderColor: state.auxPioneerSchedule.ongoing ? theme.accent : theme.border, backgroundColor: theme.card },
            ]}
          >
            <View style={styles.scheduleCardHeader}>
              <Text style={{ color: theme.text, fontSize: 14.5, fontWeight: '700' }}>{t('profile.auxPioneerOngoing')}</Text>
              {state.auxPioneerSchedule.ongoing ? <View style={[styles.dot, { backgroundColor: theme.accent }]} /> : null}
            </View>
            <Text style={[styles.scheduleCardSubtitle, { color: theme.secondaryText }]}>
              {t('pioneerService.ongoingSubtitle')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => actions.setAuxPioneerOngoing(false)}
            style={[
              styles.scheduleCard,
              { borderColor: !state.auxPioneerSchedule.ongoing ? theme.accent : theme.border, backgroundColor: theme.card },
            ]}
          >
            <View style={styles.scheduleCardHeader}>
              <Text style={{ color: theme.text, fontSize: 14.5, fontWeight: '700' }}>
                {t('profile.auxPioneerSpecificMonths')}
              </Text>
              {!state.auxPioneerSchedule.ongoing ? <View style={[styles.dot, { backgroundColor: theme.accent }]} /> : null}
            </View>
            <Text style={[styles.scheduleCardSubtitle, { color: theme.secondaryText }]}>
              {t('pioneerService.specificMonthsSubtitle')}
            </Text>

            {!state.auxPioneerSchedule.ongoing ? (
              <>
                <View style={styles.monthGrid}>
                  {monthOptions.map((monthKey) => {
                    const monthSelected = state.auxPioneerSchedule.months.includes(monthKey);
                    return (
                      <Chip
                        key={monthKey}
                        label={monthShortLabel(parseMonthKey(monthKey), locale)}
                        onPress={() => actions.toggleAuxPioneerMonth(monthKey)}
                        borderColor={monthSelected ? theme.accent : theme.border}
                        bg={monthSelected ? theme.accent : 'transparent'}
                        color={monthSelected ? theme.accentText : theme.text}
                        bold={monthSelected}
                      />
                    );
                  })}
                </View>
                <Text style={[styles.monthsSelectedCaption, { color: theme.secondaryText }]}>
                  {t('pioneerService.monthsSelected', { count: state.auxPioneerSchedule.months.length })}
                </Text>
              </>
            ) : null}
          </Pressable>
        </>
      ) : (
        <>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text style={[styles.hint, { color: theme.secondaryText }]}>{t('pioneerService.auxHint')}</Text>
        </>
      )}

      {isPioneeringRole ? (
        <>
          <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>{t('pioneerService.familyStudyLabel')}</Text>
          <View style={[styles.toggleCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: theme.text }]}>{t('pioneerService.familyStudyToggle')}</Text>
              <Switch
                value={state.familyBibleStudy.enabled}
                onValueChange={actions.setFamilyBibleStudyEnabled}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
            <Text style={[styles.toggleHint, { color: theme.secondaryText }]}>{t('pioneerService.familyStudyHint')}</Text>

            {state.familyBibleStudy.enabled ? (
              <>
                <Text style={[styles.subLabel, { color: theme.secondaryText }]}>
                  {t('pioneerService.familyStudyContactLabel')}
                </Text>
                {state.contacts.length === 0 ? (
                  <Text style={[styles.emptyHint, { color: theme.secondaryText }]}>
                    {t('pioneerService.familyStudyNoContacts')}
                  </Text>
                ) : (
                  <View style={styles.chipsRow}>
                    {state.contacts.map((c) => {
                      const active = state.familyBibleStudy.contactId === c.id;
                      return (
                        <Chip
                          key={c.id}
                          label={c.name}
                          onPress={() => actions.setFamilyBibleStudyContact(c.id)}
                          borderColor={active ? theme.accent : theme.border}
                          color={active ? theme.accent : theme.secondaryText}
                        />
                      );
                    })}
                  </View>
                )}

                <Text style={[styles.subLabel, { color: theme.secondaryText, marginTop: 16 }]}>
                  {t('pioneerService.familyStudyDaysLabel')}
                </Text>
                <View style={styles.chipsRow}>
                  {FAMILY_STUDY_DAY_ORDER.map((dow) => {
                    const active = state.familyBibleStudy.days.includes(dow);
                    return (
                      <Chip
                        key={dow}
                        label={weekdayShortLabel(dow, locale)}
                        onPress={() => actions.toggleFamilyBibleStudyDay(dow)}
                        borderColor={active ? theme.accent : theme.border}
                        bg={active ? theme.accent : 'transparent'}
                        color={active ? theme.accentText : theme.text}
                        bold={active}
                      />
                    );
                  })}
                </View>
              </>
            ) : null}
          </View>

          <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>{t('pioneerService.creditHoursLabel')}</Text>
          <View style={[styles.toggleCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: theme.text }]}>{t('pioneerService.creditHoursToggle')}</Text>
              <Switch
                value={state.creditHoursEnabled}
                onValueChange={actions.setCreditHoursEnabled}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
            <Text style={[styles.toggleHint, { color: theme.secondaryText }]}>
              {t('pioneerService.creditHoursHint', { max: MAX_CREDIT_HOURS })}
            </Text>

            {state.creditHoursEnabled ? (
              <>
                <LabeledInput
                  label={t('pioneerService.creditHoursAmountLabel')}
                  value={creditAmountText}
                  onChangeText={onChangeCreditAmount}
                  placeholder="0"
                  theme={theme}
                  keyboardType="numeric"
                  style={{ marginTop: 16, marginBottom: 16 }}
                />
                <LabeledInput
                  label={t('pioneerService.creditHoursSourceLabel')}
                  value={state.creditHoursSource}
                  onChangeText={actions.setCreditHoursSource}
                  placeholder={t('pioneerService.creditHoursSourcePlaceholder')}
                  theme={theme}
                  fontSize={14.5}
                />
              </>
            ) : null}
          </View>
        </>
      ) : null}
    </KeyboardAvoidingScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, marginRight: 12 },
  back: { fontSize: 22, lineHeight: 22 },
  title: { fontSize: 20, fontWeight: '700', flexShrink: 1 },
  saveBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18 },
  saveBtnLabel: { fontSize: 13.5, fontWeight: '700' },
  subtitle: { fontSize: 13.5, lineHeight: 19, marginBottom: 22 },
  roleList: { gap: 8, marginBottom: 4 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 20 },
  hint: { fontSize: 12.5, lineHeight: 17, marginTop: 16 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
  },
  scheduleCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  scheduleCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scheduleCardSubtitle: { fontSize: 12.5, marginTop: 4 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  monthsSelectedCaption: { fontSize: 12, marginTop: 12 },
  toggleCard: { borderWidth: 1, borderRadius: 12, padding: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  toggleLabel: { fontSize: 14.5, fontWeight: '600', flex: 1 },
  toggleHint: { fontSize: 12.5, lineHeight: 17, marginTop: 6 },
  subLabel: { fontSize: 12, marginTop: 16, marginBottom: 8 },
  emptyHint: { fontSize: 12.5, lineHeight: 17 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
