import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import { themeFor } from '../../theme/theme';
import { SegmentedControl } from '../../components/SegmentedControl';
import { LabeledInput } from '../../components/Field';
import { PillButton } from '../../components/PillButton';
import { dateKey, parseDateKey, todayKey } from '../../utils/dates';
import { INTL_LOCALE_TAGS } from '../../i18n/language';

/**
 * Rendered as a plain in-screen overlay (not a native navigator modal). React
 * Navigation's transparentModal on Android is a separate native surface that
 * doesn't reliably receive keyboard-resize events, which left this sheet's
 * input covered by the keyboard no matter what KeyboardAvoidingView setting
 * was used. As a normal sibling view in the same screen tree, it behaves like
 * any other view and keyboard-avoidance works as expected on both platforms.
 */
export function ManualEntrySheet({
  visible,
  targetDate,
  onClose,
}: {
  visible: boolean;
  targetDate: string;
  onClose: () => void;
}) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const theme = themeFor(state.darkMode);
  const locale = INTL_LOCALE_TAGS[state.language];
  const [mode, setMode] = useState<'add' | 'subtract'>('add');
  const [hours, setHours] = useState('');
  const [date, setDate] = useState<Date>(() => parseDateKey(targetDate));
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setMode('add');
      setHours('');
      setDate(parseDateKey(targetDate));
      setShowPicker(false);
    }
  }, [visible, targetDate]);

  if (!visible) return null;

  const selectedKey = dateKey(date);
  const dateLabel =
    selectedKey === todayKey()
      ? t('manualEntry.today')
      : date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });

  const submit = () => {
    const h = parseFloat(hours);
    if (!isNaN(h) && h > 0) {
      actions.addHours(selectedKey, mode === 'subtract' ? -h : h);
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
          <Text style={[styles.title, { color: theme.text }]}>{t('manualEntry.title')}</Text>

          <Text style={[styles.label, { color: theme.secondaryText }]}>{t('manualEntry.dateLabel')}</Text>
          <Pressable
            onPress={() => setShowPicker((v) => !v)}
            style={[styles.dateInput, { borderColor: theme.border, backgroundColor: theme.card }]}
          >
            <Text style={{ color: theme.text, fontSize: 14.5 }}>{dateLabel}</Text>
            <Text
              style={[
                styles.dateChevron,
                { color: theme.secondaryText, transform: [{ rotate: showPicker ? '-90deg' : '90deg' }] },
              ]}
            >
              ›
            </Text>
          </Pressable>
          {showPicker ? (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={(_, selected) => {
                setShowPicker(Platform.OS === 'ios');
                if (selected) setDate(selected);
              }}
            />
          ) : null}
          <View style={{ height: 20 }} />

          <SegmentedControl
            options={[
              { key: 'add', label: t('manualEntry.add') },
              { key: 'subtract', label: t('manualEntry.subtract') },
            ]}
            value={mode}
            onChange={setMode}
            theme={theme}
          />
          <View style={{ height: 20 }} />
          <LabeledInput
            label={t('manualEntry.hoursLabel')}
            value={hours}
            onChangeText={setHours}
            placeholder="0.0"
            theme={theme}
            keyboardType="numeric"
            fontSize={24}
          />
          <View style={{ height: 20 }} />
          <PillButton label={t('manualEntry.submit')} onPress={submit} theme={theme} />
        </Pressable>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 18 },
  label: { fontSize: 12, marginBottom: 6 },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dateChevron: { fontSize: 11 },
});
