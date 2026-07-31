import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { AppProvider, useApp } from './src/store/AppContext';
import { UiProvider, useUi } from './src/store/UiContext';
import { themeFor } from './src/theme/theme';
import { OnboardingScreen } from './src/screens/onboarding/OnboardingScreen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Toast } from './src/components/Toast';
import { isReportReminderNotification } from './src/utils/notifications';
import type { RootStackParamList } from './src/navigation/types';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

function navigateToReportTab() {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Tabs', { screen: 'Report' });
  }
}

function Root() {
  const { state, ready } = useApp();
  const { toastVisible, toastText } = useUi();
  const theme = themeFor(state.darkMode);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const last = Notifications.getLastNotificationResponse();
    if (last && isReportReminderNotification(last.notification.request.content.data)) {
      navigateToReportTab();
    }
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (isReportReminderNotification(response.notification.request.content.data)) {
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
    <SafeAreaProvider>
      <AppProvider>
        <UiProvider>
          <Root />
        </UiProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
