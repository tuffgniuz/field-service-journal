import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CheckIcon } from '../data-display/icons';
import { ACTIVITY_COLORS } from '../../utils/schedule';
import type { Theme } from '../../theme/theme';

/** A "no color" outline swatch plus one circle per `ACTIVITY_COLORS` entry — shared by Add Activity and the Meeting Schedule editor. */
export function ColorPickerRow({
  theme,
  value,
  onChange,
  noneLabel,
}: {
  theme: Theme;
  value: string | null;
  onChange: (color: string | null) => void;
  noneLabel: string;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(null)}
        accessibilityLabel={noneLabel}
        style={[
          styles.swatch,
          { backgroundColor: theme.card, borderColor: value === null ? theme.text : theme.border },
        ]}
      >
        {value === null ? <CheckIcon color={theme.text} size={13} /> : null}
      </Pressable>
      {ACTIVITY_COLORS.map((opt) => {
        const active = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            accessibilityLabel={opt.key}
            style={[styles.swatch, { backgroundColor: opt.swatch, borderColor: active ? theme.text : 'transparent' }]}
          >
            {/* Swatches are light pastels in both themes, so a fixed dark checkmark always reads clearly. */}
            {active ? <CheckIcon color="#1A1A1A" size={13} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
