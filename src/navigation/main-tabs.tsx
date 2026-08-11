import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { FloatingTabBar } from './floating-tab-bar';
import { LogScreen } from '../screens/log/log-screen';
import { StudiesListScreen } from '../screens/studies/studies-list-screen';
import { ScheduleScreen } from '../screens/schedule/schedule-screen';
import { NotesListScreen } from '../screens/notes/notes-list-screen';
import { ProfileScreen } from '../screens/profile/profile-screen';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export function MainTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tab.Screen name="Log" component={LogScreen} options={{ title: t('tabs.log') }} />
      <Tab.Screen name="Studies" component={StudiesListScreen} options={{ title: t('tabs.studies') }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ title: t('tabs.schedule') }} />
      <Tab.Screen name="Notes" component={NotesListScreen} options={{ title: t('tabs.notes') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabs.profile') }} />
    </Tab.Navigator>
  );
}
