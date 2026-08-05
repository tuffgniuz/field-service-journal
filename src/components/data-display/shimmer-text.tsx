import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View, type TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// A fixed, generous sweep travel range (px) rather than measuring the text's
// actual width — this is decorative only, and relying on `onLayout` isn't
// reliable everywhere, so a fixed range clipped by `overflow: hidden` on the
// wrapper (which sizes to the text automatically) is simpler and just as good
// for the short numeric labels this is used on.
const SWEEP_RANGE = 130;

/**
 * Renders text with an optional looping diagonal shine sweep across it —
 * used to celebrate hitting a goal (e.g. "Total hours" once it clears the
 * target). Purely decorative: pass `active={false}` to render as plain text.
 */
export function ShimmerText({
  children,
  color,
  style,
  active,
}: {
  children: string;
  color: string;
  style?: TextStyle;
  active: boolean;
}) {
  const translateX = useRef(new Animated.Value(-SWEEP_RANGE)).current;

  useEffect(() => {
    if (!active) return;
    translateX.setValue(-SWEEP_RANGE);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: SWEEP_RANGE,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.delay(1100),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, translateX]);

  return (
    <View style={styles.wrap}>
      <Text style={[style, { color }]}>{children}</Text>
      {active ? (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Animated.View
            style={[styles.sweep, { transform: [{ translateX }, { skewX: "-18deg" }] }]}
          >
            <LinearGradient
              colors={["transparent", "rgba(255,255,255,0.65)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            />
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "flex-start", overflow: "hidden" },
  sweep: { position: "absolute", top: 0, bottom: 0, width: 60 },
  gradient: { flex: 1 },
});
