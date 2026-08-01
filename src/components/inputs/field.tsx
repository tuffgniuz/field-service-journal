import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { Theme } from '../../theme/theme';

export function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  theme,
  style,
  keyboardType,
  fontSize = 16,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  theme: Theme;
  style?: object;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  fontSize?: number;
}) {
  return (
    <View style={style}>
      {label ? <Text style={[styles.label, { color: theme.secondaryText }]}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.secondaryText}
        keyboardType={keyboardType}
        style={[
          styles.input,
          { fontSize, borderColor: theme.border, backgroundColor: theme.card, color: theme.text },
        ]}
      />
    </View>
  );
}

export function LabeledTextArea({
  label,
  value,
  onChangeText,
  placeholder,
  theme,
  style,
  minHeight = 100,
  bordered = true,
  fontSize = 14.5,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  theme: Theme;
  style?: object;
  minHeight?: number;
  bordered?: boolean;
  fontSize?: number;
}) {
  return (
    <View style={style}>
      {label ? <Text style={[styles.label, { color: theme.secondaryText }]}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.secondaryText}
        multiline
        style={[
          styles.textarea,
          {
            fontSize,
            minHeight,
            borderColor: theme.border,
            borderStyle: bordered ? 'solid' : 'dashed',
            backgroundColor: bordered ? theme.card : 'transparent',
            color: theme.text,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  textarea: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
});
