import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import type { Theme } from '../../theme/theme';

export function Toast({ visible, text, theme }: { visible: boolean; text: string; theme: Theme }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!visible && (opacity as any).__getValue?.() === 0) {
    // still allow fade-out to render briefly; cheap guard for initial mount
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        { backgroundColor: theme.text, opacity },
      ]}
    >
      <Text style={[styles.text, { color: theme.bg }]}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 110,
    left: 24,
    right: 24,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  text: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});
