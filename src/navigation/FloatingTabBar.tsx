import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useApp } from '../store/AppContext';
import { themeFor, type Theme } from '../theme/theme';
import { TabIcon } from '../components/icons';
import type { TabParamList } from './types';

const ICONS = { Log: 'log', Studies: 'studies', Report: 'report', Profile: 'profile' } as const;

// Enable LayoutAnimation on Android for smooth layout transitions
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TabItemProps {
  focused: boolean;
  theme: Theme;
  iconName: (typeof ICONS)[keyof TabParamList];
  label: string;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

function TabItem({
  focused,
  theme,
  iconName,
  label,
  onPress,
  onLayout,
}: TabItemProps) {
  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={label}
      style={styles.item}
    >
      <TabIcon name={iconName} color={focused ? theme.accentText : theme.secondaryText} size={19} />
      {focused ? <Text style={[styles.label, { color: theme.accentText }]}>{label}</Text> : null}
    </Pressable>
  );
}

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { state: appState } = useApp();
  const theme = themeFor(appState.darkMode);
  const insets = useSafeAreaInsets();

  // Track the layout (x, y, width, height) of each tab item
  const [layouts, setLayouts] = useState<Record<number, { x: number; y: number; width: number; height: number }>>({});

  // Animated values for the sliding/morphing bubble
  const bubbleX = useRef(new Animated.Value(0)).current;
  const bubbleY = useRef(new Animated.Value(0)).current;
  const bubbleWidth = useRef(new Animated.Value(0)).current;
  const bubbleHeight = useRef(new Animated.Value(0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;

  const isFirstLayout = useRef(true);

  // Smoothly animate the layouts of the tab items (e.g. text expanding/shrinking) on index change
  useEffect(() => {
    LayoutAnimation.configureNext({
      duration: 250,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
  }, [state.index]);

  // Smoothly slide and morph the bubble to the active tab's layout
  useEffect(() => {
    const activeLayout = layouts[state.index];
    if (activeLayout) {
      if (isFirstLayout.current) {
        // Position the bubble instantly on initial layout of the active tab
        bubbleX.setValue(activeLayout.x);
        bubbleY.setValue(activeLayout.y);
        bubbleWidth.setValue(activeLayout.width);
        bubbleHeight.setValue(activeLayout.height);
        Animated.timing(bubbleOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }).start();
        isFirstLayout.current = false;
      } else {
        // Animate fluidly using a spring for a bouncy bubble-like effect
        Animated.parallel([
          Animated.spring(bubbleX, {
            toValue: activeLayout.x,
            tension: 130,
            friction: 12,
            useNativeDriver: false,
          }),
          Animated.spring(bubbleY, {
            toValue: activeLayout.y,
            tension: 130,
            friction: 12,
            useNativeDriver: false,
          }),
          Animated.spring(bubbleWidth, {
            toValue: activeLayout.width,
            tension: 130,
            friction: 12,
            useNativeDriver: false,
          }),
          Animated.spring(bubbleHeight, {
            toValue: activeLayout.height,
            tension: 130,
            friction: 12,
            useNativeDriver: false,
          }),
        ]).start();
      }
    }
  }, [state.index, layouts, bubbleX, bubbleY, bubbleWidth, bubbleHeight, bubbleOpacity]);

  const handleLayout = (index: number, layout: { x: number; y: number; width: number; height: number }) => {
    setLayouts((prev) => {
      const current = prev[index];
      if (
        current &&
        current.x === layout.x &&
        current.y === layout.y &&
        current.width === layout.width &&
        current.height === layout.height
      ) {
        return prev;
      }
      return { ...prev, [index]: layout };
    });
  };

  return (
    <View style={[styles.wrap, { backgroundColor: theme.bg, paddingBottom: insets.bottom + 10 }]}>
      <View style={[styles.bar, { backgroundColor: theme.card }]}>
        {/* Sliding background bubble */}
        <Animated.View
          style={[
            styles.bubble,
            {
              backgroundColor: theme.accent,
              left: bubbleX,
              top: bubbleY,
              width: bubbleWidth,
              height: bubbleHeight,
              opacity: bubbleOpacity,
            },
          ]}
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              focused={focused}
              theme={theme}
              iconName={ICONS[route.name as keyof TabParamList]}
              label={label}
              onPress={onPress}
              onLayout={(e) => handleLayout(index, e.nativeEvent.layout)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8 },
  bar: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  bubble: {
    position: 'absolute',
    borderRadius: 22,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    overflow: 'hidden',
  },
  label: { fontSize: 13, fontWeight: '700' },
});
