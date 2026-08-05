import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ClockIcon } from '../data-display/icons';
import type { Theme } from '../../theme/theme';
import { formatTimeLabel, timeDateToStorage, timeStringToDate } from '../../utils/time';

export function TimePickerField({
  label,
  value,
  onChange,
  onClear,
  clearLabel,
  placeholder,
  theme,
  locale,
  uses24HourClock,
  style,
  compact = false,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  clearLabel?: string;
  placeholder: string;
  theme: Theme;
  locale: string;
  uses24HourClock: boolean | null;
  style?: object;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const display = formatTimeLabel(value, locale, placeholder, uses24HourClock);
  const muted = !value.trim();

  return (
    <View style={style}>
      {label || (onClear && value) ? (
        <View style={styles.labelRow}>
          {label ? <Text style={[styles.label, { color: theme.secondaryText }]}>{label}</Text> : <View />}
          {onClear && value ? (
            <Pressable onPress={onClear} hitSlop={6}>
              <Text style={[styles.clearLabel, { color: theme.accent }]}>{clearLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.input,
          compact ? styles.compactInput : null,
          { borderColor: theme.border, backgroundColor: theme.card },
        ]}
      >
        <View style={styles.valueRow}>
          <ClockIcon color={theme.secondaryText} size={14} />
          <Text style={[styles.value, compact ? styles.compactValue : null, { color: muted ? theme.secondaryText : theme.text }]}>
            {display}
          </Text>
        </View>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={timeStringToDate(value)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour={uses24HourClock ?? undefined}
          themeVariant={theme.dark ? 'dark' : 'light'}
          textColor={theme.text}
          accentColor={theme.accent}
          positiveButton={{ textColor: theme.accent }}
          negativeButton={{ textColor: theme.secondaryText }}
          onChange={(_, selected) => {
            setOpen(Platform.OS === 'ios');
            if (selected) onChange(timeDateToStorage(selected));
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
  },
  clearLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  compactInput: {
    minHeight: 46,
    paddingVertical: 12,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  compactValue: {
    fontSize: 14,
  },
});
