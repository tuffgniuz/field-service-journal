import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../theme/theme';
import type { AuxPioneerSchedule } from '../../store/types';
import { auxPioneerMonthOptions } from '../../utils/aux-pioneer';
import { monthShortLabel, parseMonthKey } from '../../utils/dates';
import { SegmentedControl } from './segmented-control';
import { Chip } from '../data-display/chip';

/**
 * The actual ongoing-vs-specific-months controls, with no surrounding sheet
 * or step chrome, so it can be reused as-is inside both the onboarding role
 * step and the Profile schedule sheet.
 */
export function AuxPioneerFields({
  schedule,
  onSetOngoing,
  onToggleMonth,
  theme,
  locale,
}: {
  schedule: AuxPioneerSchedule;
  onSetOngoing: (ongoing: boolean) => void;
  onToggleMonth: (monthKey: string) => void;
  theme: Theme;
  locale: string;
}) {
  const { t } = useTranslation();
  const monthOptions = auxPioneerMonthOptions();

  return (
    <View>
      <SegmentedControl<'ongoing' | 'months'>
        options={[
          { key: 'ongoing', label: t('profile.auxPioneerOngoing') },
          { key: 'months', label: t('profile.auxPioneerSpecificMonths') },
        ]}
        value={schedule.ongoing ? 'ongoing' : 'months'}
        onChange={(key) => onSetOngoing(key === 'ongoing')}
        theme={theme}
      />
      {schedule.ongoing ? (
        <Text style={[styles.hint, { color: theme.secondaryText }]}>{t('profile.auxPioneerOngoingHint')}</Text>
      ) : (
        <>
          <Text style={[styles.hint, { color: theme.secondaryText }]}>{t('profile.auxPioneerMonthsHint')}</Text>
          <View style={styles.monthGrid}>
            {monthOptions.map((monthKey: string) => {
              const selected = schedule.months.includes(monthKey);
              return (
                <Chip
                  key={monthKey}
                  label={monthShortLabel(parseMonthKey(monthKey), locale)}
                  onPress={() => onToggleMonth(monthKey)}
                  borderColor={selected ? theme.accent : theme.border}
                  bg={selected ? theme.accent : 'transparent'}
                  color={selected ? theme.accentText : theme.text}
                  bold={selected}
                />
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 12.5, lineHeight: 17, marginTop: 14 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
});
