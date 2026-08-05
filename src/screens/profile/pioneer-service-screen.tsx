import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { themeFor } from '../../theme/theme';
import { KeyboardAvoidingScrollView } from '../../components/layout/keyboard-avoiding-scroll-view';
import { PillButton } from '../../components/actions/pill-button';
import { Chip } from '../../components/data-display/chip';
import { useRoleMeta } from '../../hooks/use-role-meta';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import { monthShortLabel, parseMonthKey } from '../../utils/dates';
import { serviceYearMonthOptions } from '../../utils/aux-pioneer';
import type { RootNavProp } from '../../navigation/types';

type RoleCardKey = 'publisher' | 'aux_pioneer' | 'regular_pioneer' | 'special_pioneer';

const ROLE_CARD_ORDER: RoleCardKey[] = ['publisher', 'aux_pioneer', 'regular_pioneer', 'special_pioneer'];

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
  const monthOptions = serviceYearMonthOptions();

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

  return (
    <KeyboardAvoidingScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityLabel={t('common.back')}>
          <Text style={[styles.back, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>{t('pioneerService.title')}</Text>
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

      <PillButton
        label={t('pioneerService.saveChanges')}
        onPress={() => navigation.goBack()}
        theme={theme}
        style={{ marginTop: 24 }}
      />
    </KeyboardAvoidingScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  back: { fontSize: 22, lineHeight: 22 },
  title: { fontSize: 20, fontWeight: '700' },
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
});
