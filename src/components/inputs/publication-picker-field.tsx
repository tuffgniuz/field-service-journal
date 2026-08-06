import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../../theme/theme';
import { CheckIcon, ChevronRightIcon } from '../data-display/icons';
import { PUBLICATIONS } from '../../utils/publications';
import type { AppLanguage } from '../../store/types';

export function PublicationPickerField({
  label,
  value,
  onChange,
  language,
  theme,
  placeholder,
  noneLabel,
  style,
}: {
  label?: string;
  value: string;
  onChange: (code: string) => void;
  language: AppLanguage;
  theme: Theme;
  placeholder: string;
  noneLabel: string;
  style?: object;
}) {
  const [open, setOpen] = useState(false);
  const selected = PUBLICATIONS.find((p) => p.code === value);

  return (
    <View style={style}>
      {label ? <Text style={[styles.label, { color: theme.secondaryText }]}>{label}</Text> : null}
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[styles.field, { borderColor: theme.border, backgroundColor: theme.card }]}
      >
        <Text
          style={[styles.fieldText, { color: selected ? theme.text : theme.secondaryText }]}
          numberOfLines={1}
        >
          {selected ? selected.title[language] : placeholder}
        </Text>
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <ChevronRightIcon color={theme.secondaryText} size={15} />
        </View>
      </Pressable>
      {open ? (
        <View style={[styles.list, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <Pressable
            onPress={() => {
              onChange('');
              setOpen(false);
            }}
            style={styles.row}
          >
            <Text style={[styles.rowText, { color: !value ? theme.accent : theme.text }]}>{noneLabel}</Text>
            {!value ? <CheckIcon color={theme.accent} /> : null}
          </Pressable>
          {PUBLICATIONS.map((p) => {
            const active = p.code === value;
            return (
              <Pressable
                key={p.code}
                onPress={() => {
                  onChange(p.code);
                  setOpen(false);
                }}
                style={[styles.row, { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}
              >
                <Text style={[styles.rowText, { color: active ? theme.accent : theme.text }]} numberOfLines={1}>
                  {p.title[language]}
                </Text>
                {active ? <CheckIcon color={theme.accent} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  fieldText: { fontSize: 14.5, flex: 1 },
  list: { marginTop: 8, borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  rowText: { fontSize: 14.5, flex: 1 },
});
