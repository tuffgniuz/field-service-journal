import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { themeFor } from '../../theme/theme';
import { PillButton } from '../../components/actions/pill-button';
import { fmtHours } from '../../utils/format';
import { ACTIVITY_TYPE_KEYS, parseTimeToMinutes, type ScheduledActivityOccurrence } from '../../utils/schedule';

const STEP = 0.5;

/** Hours between an activity's start/end time, or 0 if either is missing/unparseable/non-positive. */
function defaultHoursFor(activity: ScheduledActivityOccurrence): number {
  if (!activity.time.trim() || !activity.endTime?.trim()) return 0;
  const start = parseTimeToMinutes(activity.time);
  const end = parseTimeToMinutes(activity.endTime);
  if (start === Number.MAX_SAFE_INTEGER || end === Number.MAX_SAFE_INTEGER) return 0;
  const diff = (end - start) / 60;
  return diff > 0 ? Math.round(diff * 100) / 100 : 0;
}

/**
 * Rendered as a plain in-screen overlay rather than a native navigator modal
 * — see manual-entry-sheet.tsx for why (keyboard-avoidance reliability).
 * This sheet doesn't take text input, but stays consistent with the other
 * Log-screen sheets for the same reason.
 */
export function ActivityHoursSheet({
  visible,
  activity,
  activityTitle,
  onClose,
}: {
  visible: boolean;
  activity: ScheduledActivityOccurrence | null;
  /** Contact name, location, or type label — whichever the Upcoming Activities card is showing as the activity's title. */
  activityTitle: string;
  onClose: () => void;
}) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const theme = themeFor(state.darkMode);
  const [hours, setHours] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible && activity) {
      setHours(defaultHoursFor(activity));
      setNotes('');
    }
  }, [visible, activity]);

  if (!visible || !activity) return null;

  // A Bible study tied to a contact is also a visit — logging it here should feel
  // like it counted as one, not just a stray hours entry.
  const isVisitableStudy = activity.type === 'bible_study' && Boolean(activity.contactId);

  const adjust = (delta: number) => setHours((h) => Math.max(0, Math.round((h + delta) * 100) / 100));

  const confirm = () => {
    actions.confirmActivityHours(activity.id, activity.occurrenceDate, hours);
    if (isVisitableStudy && activity.contactId) {
      actions.saveVisit(activity.contactId, { date: new Date().toISOString(), covered: notes });
    }
    onClose();
  };

  return (
    <KeyboardAvoidingView
      style={StyleSheet.absoluteFill}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.bg }]} onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.title, { color: theme.text }]}>{t('log.confirmHoursTitle')}</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]} numberOfLines={1}>
            {t(ACTIVITY_TYPE_KEYS[activity.type])}
            {activityTitle ? ` · ${activityTitle}` : ''}
          </Text>

          <Text style={[styles.hoursValue, { color: theme.text }]}>
            {fmtHours(hours)}
            <Text style={[styles.hoursUnit, { color: theme.secondaryText }]}>{' '}h</Text>
          </Text>

          <View style={styles.stepperRow}>
            <Pressable
              onPress={() => adjust(-STEP)}
              disabled={hours <= 0}
              accessibilityLabel={t('log.decreaseAccessibility', { value: STEP })}
              style={[styles.stepBtn, { borderColor: theme.border, opacity: hours > 0 ? 1 : 0.4 }]}
            >
              <Text style={[styles.stepBtnLabel, { color: theme.text }]}>−</Text>
            </Pressable>
            <Text style={[styles.stepValue, { color: theme.secondaryText }]}>
              {t('log.quickStepLabel', { value: STEP })}
            </Text>
            <Pressable
              onPress={() => adjust(STEP)}
              accessibilityLabel={t('log.increaseAccessibility', { value: STEP })}
              style={[styles.stepBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}
            >
              <Text style={[styles.stepBtnLabel, { color: theme.accentText }]}>+</Text>
            </Pressable>
          </View>

          {isVisitableStudy ? (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <Text style={[styles.notesLabel, { color: theme.secondaryText }]}>{t('log.visitNotesLabel')}</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={t('addVisit.coveredPlaceholder')}
                placeholderTextColor={theme.secondaryText}
                multiline
                style={[styles.notesInput, { color: theme.text }]}
              />
            </>
          ) : null}

          <PillButton label={t('log.confirmHoursConfirm')} onPress={confirm} theme={theme} style={{ marginTop: 22 }} />
        </Pressable>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 18 },
  hoursValue: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1.5,
    includeFontPadding: false,
    fontVariant: ['tabular-nums'],
    marginBottom: 20,
  },
  hoursUnit: { fontSize: 18, fontWeight: '600', marginLeft: 1 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnLabel: { fontSize: 20, fontWeight: '600' },
  stepValue: { fontSize: 13, fontWeight: '600', letterSpacing: 0.4 },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 22, marginBottom: 18 },
  notesLabel: { fontSize: 12, marginBottom: 10 },
  notesInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 90,
    padding: 0,
    textAlignVertical: 'top',
  },
});
