import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

/**
 * Drop-in replacement for ScrollView on any form screen. Keeps the focused
 * input above the keyboard on both platforms via KeyboardAvoidingView, using
 * the pairing recommended by the RN docs: "padding" on iOS (no native window
 * resize there), "height" on Android. We don't rely on Android's native
 * windowSoftInputMode config for this — that requires a custom native build
 * and has no effect inside Expo Go, which is how this app is actually run.
 */
export function KeyboardAvoidingScrollView({
  children,
  style,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  style?: object;
  contentContainerStyle?: object;
}) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
