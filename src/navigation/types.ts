import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  ContactDetail: { contactId: string };
  AddContact: { contactId?: string } | undefined;
  AddEditVisit: { contactId: string; visitId?: string };
  History: undefined;
  About: undefined;
  Settings: undefined;
  Timer: undefined;
};

export type TabParamList = {
  Log: undefined;
  Studies: undefined;
  Report: undefined;
  Profile: undefined;
};

export type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

export type TabScreenNavProp<T extends keyof TabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, T>,
  NativeStackNavigationProp<RootStackParamList>
>;
