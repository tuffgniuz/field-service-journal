import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './main-tabs';
import { ContactDetailScreen } from '../screens/studies/contact-detail-screen';
import { AddContactScreen } from '../screens/studies/add-contact-screen';
import { AddEditVisitScreen } from '../screens/studies/add-edit-visit-screen';
import { AddActivityScreen } from '../screens/schedule/add-activity-screen';
import { MeetingScheduleScreen } from '../screens/schedule/meeting-schedule-screen';
import { HistoryScreen } from '../screens/report/history-screen';
import { AboutScreen } from '../screens/profile/about-screen';
import { SettingsScreen } from '../screens/profile/settings-screen';
import { PioneerServiceScreen } from '../screens/profile/pioneer-service-screen';
import { TimerScreen } from '../screens/log/timer-screen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="ContactDetail" component={ContactDetailScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="AddContact" component={AddContactScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="AddEditVisit" component={AddEditVisitScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="AddActivity" component={AddActivityScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="MeetingSchedule" component={MeetingScheduleScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="PioneerService" component={PioneerServiceScreen} options={{ animation: 'fade' }} />
      <Stack.Screen
        name="Timer"
        component={TimerScreen}
        options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
