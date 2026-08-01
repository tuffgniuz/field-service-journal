import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { themeFor } from '../../theme/theme';
import { fmtElapsed } from '../../utils/format';
import type { RootNavProp } from '../../navigation/types';

export function TimerScreen({ navigation }: { navigation: RootNavProp }) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const theme = themeFor(state.darkMode);
  const [elapsedSec, setElapsedSec] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const started = state.timerStartedAt ?? Date.now();
    const tick = () => setElapsedSec(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.timerStartedAt]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const onStop = () => {
    actions.stopTimer();
    navigation.goBack();
  };

  return (
    <View style={[styles.wrap, { backgroundColor: theme.bg }]}>
      <View style={styles.liveRow}>
        <Animated.View style={[styles.dot, { backgroundColor: theme.gold, opacity: pulse }]} />
        <Text style={[styles.liveLabel, { color: theme.secondaryText }]}>{t('timer.live')}</Text>
      </View>
      <Text style={[styles.elapsed, { color: theme.text }]}>{fmtElapsed(elapsedSec)}</Text>
      <Pressable
        onPress={onStop}
        accessibilityLabel={t('timer.stopAccessibility')}
        testID="stop-timer-btn"
        style={[styles.stopBtn, { backgroundColor: theme.accent }]}
      >
        <View style={[styles.stopIcon, { backgroundColor: theme.accentText }]} />
      </Pressable>
      <Text style={[styles.stopLabel, { color: theme.secondaryText }]}>{t('timer.stop')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 36 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  liveLabel: { fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase' },
  elapsed: { fontSize: 72, fontWeight: '700', letterSpacing: -2, marginBottom: 64 },
  stopBtn: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  stopIcon: { width: 26, height: 26, borderRadius: 5 },
  stopLabel: { fontSize: 13, marginTop: 20 },
});
