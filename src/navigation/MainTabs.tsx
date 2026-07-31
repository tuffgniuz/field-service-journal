import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useApp } from '../store/AppContext';
import { themeFor } from '../theme/theme';
import { TabIcon } from '../components/icons';
import { LogScreen } from '../screens/log/LogScreen';
import { StudiesListScreen } from '../screens/studies/StudiesListScreen';
import { ReportScreen } from '../screens/report/ReportScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS = { Log: 'log', Studies: 'studies', Report: 'report', Profile: 'profile' } as const;

export function MainTabs() {
  const { state } = useApp();
  const { t } = useTranslation();
  const theme = themeFor(state.darkMode);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.secondaryText,
        tabBarStyle: {
          backgroundColor: theme.bg,
          borderTopColor: theme.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' },
        tabBarIcon: ({ color }) => (
          <TabIcon name={ICONS[route.name]} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Log" component={LogScreen} options={{ title: t('tabs.log') }} />
      <Tab.Screen name="Studies" component={StudiesListScreen} options={{ title: t('tabs.studies') }} />
      <Tab.Screen name="Report" component={ReportScreen} options={{ title: t('tabs.report') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabs.profile') }} />
    </Tab.Navigator>
  );
}
