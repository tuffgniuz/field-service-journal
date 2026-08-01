import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../../theme/theme';

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  theme,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  theme: Theme;
}) {
  return (
    <View style={[styles.wrap, { borderColor: theme.border }]}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              styles.segment,
              { backgroundColor: active ? theme.accent : 'transparent' },
            ]}
          >
            <Text style={[styles.label, { color: active ? theme.accentText : theme.secondaryText }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
