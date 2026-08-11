import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import "./src/theme/globals.css";
import { AppProvider, useApp } from './src/store/app-context';
import { UiProvider, useUi } from './src/store/ui-context';
import { themeFor } from './src/theme/theme';
import { OnboardingScreen } from './src/screens/onboarding/onboarding-screen';
import { RootNavigator } from './src/navigation/root-navigator';
import { Toast } from './src/components/feedback/toast';
import { isLastDayOfMonthReminderNotification, isReportReminderNotification } from './src/utils/notifications';
import type { RootStackParamList } from './src/navigation/types';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

function navigateToReportTab() {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Report');
  }
}

function Root() {
  const { state, ready } = useApp();
  const { toastVisible, toastText } = useUi();
  const theme = themeFor(state.darkMode);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const isReportRelated = (data: Record<string, unknown> | undefined) =>
      isReportReminderNotification(data) || isLastDayOfMonthReminderNotification(data);
    const last = Notifications.getLastNotificationResponse();
    if (last && isReportRelated(last.notification.request.content.data)) {
      navigateToReportTab();
    }
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (isReportRelated(response.notification.request.content.data)) {
        navigateToReportTab();
      }
    });
    return () => subscription.remove();
  }, []);

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const navTheme = {
    ...(state.darkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(state.darkMode ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.bg,
      card: theme.bg,
      border: theme.border,
      text: theme.text,
      primary: theme.accent,
    },
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <StatusBar style={state.darkMode ? 'light' : 'dark'} />
      {state.onboardingDone ? (
        <NavigationContainer ref={navigationRef} theme={navTheme}>
          <RootNavigator />
        </NavigationContainer>
      ) : (
        <OnboardingScreen />
      )}
      <Toast visible={toastVisible} text={toastText} theme={theme} />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AppProvider>
          <UiProvider>
            <Root />
          </UiProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
