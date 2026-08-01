import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { Theme } from '../../theme/theme';

export function PillButton({
  label,
  onPress,
  theme,
  style,
  disabled,
}: {
  label: string;
  onPress: () => void;
  theme: Theme;
  style?: object;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: theme.accent, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[styles.label, { color: theme.accentText }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15.5,
    fontWeight: '600',
  },
});
