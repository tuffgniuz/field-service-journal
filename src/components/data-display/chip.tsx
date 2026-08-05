import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

export function Chip({
  label,
  onPress,
  borderColor,
  bg = 'transparent',
  color,
  bold = true,
  disabled = false,
  fontSize = 13.5,
}: {
  label: string;
  onPress: () => void;
  borderColor: string;
  bg?: string;
  color: string;
  bold?: boolean;
  disabled?: boolean;
  fontSize?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        { borderColor, backgroundColor: bg, opacity: disabled ? 0.35 : pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.label, { color, fontSize, fontWeight: bold ? '600' : '400' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexShrink: 0,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: {
    fontSize: 13.5,
    flexShrink: 0,
  },
});
