import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../theme/theme';
import type { AuxPioneerSchedule } from '../../store/types';
import { AuxPioneerFields } from '../../components/inputs/aux-pioneer-fields';
import { PillButton } from '../../components/actions/pill-button';

/**
 * Rendered as a plain in-screen overlay rather than a navigator modal, same
 * reasoning as ManualEntrySheet/TranslateLanguageSheet.
 */
export function AuxPioneerScheduleSheet({
  visible,
  schedule,
  onClose,
  onSetOngoing,
  onToggleMonth,
  onStop,
  theme,
  locale,
}: {
  visible: boolean;
  schedule: AuxPioneerSchedule;
  onClose: () => void;
  onSetOngoing: (ongoing: boolean) => void;
  onToggleMonth: (monthKey: string) => void;
  onStop: () => void;
  theme: Theme;
  locale: string;
}) {
  const { t } = useTranslation();

  if (!visible) return null;

  const isActive = schedule.ongoing || schedule.months.length > 0;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.bg }]} onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.title, { color: theme.text }]}>{t('profile.auxPioneerSheetTitle')}</Text>

          <AuxPioneerFields
            schedule={schedule}
            onSetOngoing={onSetOngoing}
            onToggleMonth={onToggleMonth}
            theme={theme}
            locale={locale}
          />

          {isActive ? (
            <Pressable
              onPress={() => {
                onStop();
                onClose();
              }}
              style={styles.stopBtn}
            >
              <Text style={[styles.stopLabel, { color: theme.danger }]}>{t('profile.stopAuxPioneering')}</Text>
            </Pressable>
          ) : null}

          <PillButton label={t('common.done')} onPress={onClose} theme={theme} style={{ marginTop: 20 }} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 18 },
  stopBtn: { alignItems: 'center', marginTop: 20 },
  stopLabel: { fontSize: 13.5, fontWeight: '600' },
});
