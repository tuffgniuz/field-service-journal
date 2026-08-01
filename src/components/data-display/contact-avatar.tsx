import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { initialsFor } from '../../utils/initials';

export function ContactAvatar({
  name,
  color,
  size = 38,
  fontSize = 13,
}: {
  name: string;
  color: string;
  size?: number;
  fontSize?: number;
}) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}>
      <Text style={[styles.text, { color, fontSize }]}>{initialsFor(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  text: { fontWeight: '700' },
});
