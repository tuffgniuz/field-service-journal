import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import { ContactDetailScreen } from '../screens/studies/ContactDetailScreen';
import { AddContactScreen } from '../screens/studies/AddContactScreen';
import { AddEditVisitScreen } from '../screens/studies/AddEditVisitScreen';
import { HistoryScreen } from '../screens/report/HistoryScreen';
import { AboutScreen } from '../screens/profile/AboutScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { TimerScreen } from '../screens/log/TimerScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="ContactDetail" component={ContactDetailScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="AddContact" component={AddContactScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="AddEditVisit" component={AddEditVisitScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: 'fade' }} />
      <Stack.Screen
        name="Timer"
        component={TimerScreen}
        options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
