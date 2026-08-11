import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { useUi } from '../../store/ui-context';
import { themeFor } from '../../theme/theme';
import { KeyboardAvoidingScrollView } from '../../components/layout/keyboard-avoiding-scroll-view';
import { LabeledInput } from '../../components/inputs/field';
import { SegmentedControl } from '../../components/inputs/segmented-control';
import { LANGUAGE_NATIVE_NAMES, INTL_LOCALE_TAGS } from '../../i18n/language';
import { currentServiceYearLabel, formatRelativeTime } from '../../utils/dates';
import { type LanguagePreference, type ThemePreference } from '../../store/types';
import { exportAppData } from '../../utils/export-data';
// import { useGoogleDriveSync } from '../../hooks/use-google-drive-sync';
import type { RootNavProp } from '../../navigation/types';

const LANGUAGE_ORDER: LanguagePreference[] = ['system', 'en', 'nl', 'id'];

export function SettingsScreen({ navigation }: { navigation: RootNavProp }) {
  const { state, actions } = useApp();
  const { showToast } = useUi();
  const { t } = useTranslation();
  const theme = themeFor(state.darkMode);
  const locale = INTL_LOCALE_TAGS[state.language];
  const insets = useSafeAreaInsets();
  // const googleSync = useGoogleDriveSync();

  // useEffect(() => {
  //   if (!googleSync.error) return;
  //   if (googleSync.error === 'not-configured') {
  //     Alert.alert(t('settings.googleNotConfiguredTitle'), t('settings.googleNotConfiguredMessage'));
  //   } else {
  //     showToast(t('settings.googleSyncError'));
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [googleSync.error]);

  // useEffect(() => {
  //   if (!googleSync.pendingRestore) return;
  //   Alert.alert(t('settings.googleRestoreTitle'), t('settings.googleRestoreMessage'), [
  //     { text: t('settings.googleKeepLocal'), style: 'cancel', onPress: googleSync.keepLocalData },
  //     { text: t('settings.googleRestore'), onPress: googleSync.restoreFromDrive },
  //   ]);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [googleSync.pendingRestore]);

  const currentLabel = currentServiceYearLabel();
  const [startingHoursText, setStartingHoursText] = useState(() =>
    state.serviceYearStartingHoursYear === currentLabel && state.serviceYearStartingHours > 0
      ? String(state.serviceYearStartingHours)
      : ''
  );
  const onChangeStartingHours = (v: string) => {
    setStartingHoursText(v);
    const n = parseFloat(v);
    if (!isNaN(n) && n >= 0) actions.setServiceYearStartingHours(n);
    else if (v.trim() === '') actions.setServiceYearStartingHours(0);
  };

  const onExport = async () => {
    const ok = await exportAppData(state, t('share.dialogTitle'));
    showToast(ok ? t('settings.exportSuccess') : t('settings.exportFailure'));
  };

  const onToggleReportReminder = async (value: boolean) => {
    const ok = await actions.setReportReminderEnabled(value);
    if (!ok) {
      Alert.alert(t('settings.notificationsOffTitle'), t('settings.notificationsOffMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.openSettings'), onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    showToast(value ? t('settings.reminderOnToast') : t('settings.reminderOffToast'));
  };

  const onDeleteAllData = () => {
    Alert.alert(t('settings.deleteTitle'), t('settings.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.delete'), style: 'destructive', onPress: () => actions.resetAllData() },
    ]);
  };

  return (
    <KeyboardAvoidingScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityLabel={t('common.back')} testID="back-btn">
          <Text style={[styles.back, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>{t('settings.title')}</Text>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>{t('settings.yourName')}</Text>
      <View style={[styles.card, { borderColor: theme.border }]}>
        <LabeledInput
          value={state.name}
          onChangeText={actions.setName}
          placeholder={t('settings.namePlaceholder')}
          theme={theme}
          fontSize={14.5}
        />
      </View>

      {state.role === 'regular_pioneer' ? (
        <View style={[styles.card, { borderColor: theme.border }]}>
          <LabeledInput
            label={t('settings.serviceYearStartingHoursLabel')}
            value={startingHoursText}
            onChangeText={onChangeStartingHours}
            placeholder="0"
            theme={theme}
            keyboardType="numeric"
            fontSize={14.5}
            style={{ marginBottom: 8 }}
          />
          <Text style={{ color: theme.secondaryText, fontSize: 12, lineHeight: 16.5 }}>
            {t('settings.serviceYearStartingHoursHint')}
          </Text>
        </View>
      ) : null}

      <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>{t('settings.reportRecipient')}</Text>
      <View style={[styles.card, { borderColor: theme.border }]}>
        <LabeledInput
          label={t('settings.nameAndRole')}
          value={state.reportRecipient}
          onChangeText={actions.setReportRecipient}
          placeholder={t('settings.recipientPlaceholder')}
          theme={theme}
          fontSize={14.5}
          style={{ marginBottom: 14 }}
        />
        <View style={styles.twoCol}>
          <LabeledInput
            label={t('settings.phoneOptional')}
            value={state.recipientPhone}
            onChangeText={actions.setRecipientPhone}
            placeholder={t('settings.phonePlaceholder')}
            theme={theme}
            keyboardType="phone-pad"
            fontSize={14}
            style={{ flex: 1 }}
          />
          <LabeledInput
            label={t('settings.emailOptional')}
            value={state.recipientEmail}
            onChangeText={actions.setRecipientEmail}
            placeholder={t('settings.emailPlaceholder')}
            theme={theme}
            keyboardType="email-address"
            fontSize={14}
            style={{ flex: 1 }}
          />
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>{t('settings.notifications')}</Text>
      <View style={[styles.card, { borderColor: theme.border, flexDirection: 'row', alignItems: 'center' }]}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ color: theme.text, fontSize: 14.5, fontWeight: '600', marginBottom: 4 }}>
            {t('settings.monthlyReminderTitle')}
          </Text>
          <Text style={{ color: theme.secondaryText, fontSize: 12.5, lineHeight: 17 }}>
            {t('settings.monthlyReminderDesc')}
          </Text>
        </View>
        <Switch
          value={state.reportReminderEnabled}
          onValueChange={onToggleReportReminder}
          trackColor={{ false: theme.border, true: theme.accent }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/*
      <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>{t('settings.googleSyncSection')}</Text>
      <View style={[styles.card, { borderColor: theme.border }]}>
        {googleSync.connected ? (
          <>
            <View style={styles.googleRow}>
              <Text style={{ color: theme.text, fontSize: 14.5, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                {googleSync.account?.email || t('settings.googleConnected')}
              </Text>
              {googleSync.status !== 'idle' ? <ActivityIndicator size="small" color={theme.accent} /> : null}
            </View>
            <Text style={{ color: theme.secondaryText, fontSize: 12.5, marginBottom: 14 }}>
              {googleSync.lastSyncedAt
                ? t('settings.googleLastSynced', { when: formatRelativeTime(googleSync.lastSyncedAt, locale) })
                : t('settings.googleNeverSynced')}
            </Text>
            <View style={styles.googleActionsRow}>
              <Pressable onPress={googleSync.syncNow} disabled={googleSync.status !== 'idle'} hitSlop={6}>
                <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '600' }}>{t('settings.googleSyncNow')}</Text>
              </Pressable>
              <Pressable onPress={googleSync.disconnect} disabled={googleSync.status !== 'idle'} hitSlop={6}>
                <Text style={{ color: theme.danger, fontSize: 14, fontWeight: '600' }}>{t('settings.googleDisconnect')}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={{ color: theme.text, fontSize: 14.5, fontWeight: '600', marginBottom: 4 }}>
              {t('settings.googleSyncTitle')}
            </Text>
            <Text style={{ color: theme.secondaryText, fontSize: 12.5, lineHeight: 17, marginBottom: 16 }}>
              {t('settings.googleSyncDesc')}
            </Text>
            <Pressable
              onPress={googleSync.connect}
              disabled={googleSync.status !== 'idle'}
              style={[styles.connectBtn, { backgroundColor: theme.accent, opacity: googleSync.status !== 'idle' ? 0.6 : 1 }]}
            >
              {googleSync.status !== 'idle' ? (
                <ActivityIndicator size="small" color={theme.accentText} />
              ) : (
                <Text style={{ color: theme.accentText, fontSize: 13.5, fontWeight: '700' }}>
                  {t('settings.googleConnectButton')}
                </Text>
              )}
            </Pressable>
          </>
        )}
      </View>
      */}

      <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>{t('settings.appearance')}</Text>
      <SegmentedControl
        options={[
          { key: 'system', label: t('settings.system') },
          { key: 'light', label: t('settings.light') },
          { key: 'dark', label: t('settings.dark') },
        ]}
        value={state.themePreference}
        onChange={(v: ThemePreference) => {
          if (v === 'system') actions.setSystemTheme();
          else if (v === 'light') actions.setLight();
          else actions.setDark();
        }}
        theme={theme}
      />
      <Text style={[styles.appearanceHint, { color: theme.secondaryText }]}>{t('settings.appearanceHint')}</Text>

      <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>{t('settings.language')}</Text>
      <View style={styles.pickerList}>
        {LANGUAGE_ORDER.map((key) => {
          const selected = state.languagePreference === key;
          const label = key === 'system' ? t('settings.system') : LANGUAGE_NATIVE_NAMES[key];
          return (
            <Pressable
              key={key}
              onPress={() => actions.setLanguagePreference(key)}
              style={[styles.pickerRow, { borderColor: selected ? theme.accent : theme.border }]}
            >
              <Text style={{ color: theme.text, fontSize: 14.5, fontWeight: selected ? '700' : '400' }}>{label}</Text>
              {selected ? <View style={[styles.pickerDot, { backgroundColor: theme.accent }]} /> : null}
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.appearanceHint, { color: theme.secondaryText }]}>{t('settings.languageHint')}</Text>

      <View style={styles.settingsList}>
        {__DEV__ ? (
          <Pressable onPress={actions.seedDummyData} style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <Text style={{ color: theme.text, fontSize: 14.5 }}>Load dummy data (dev)</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onExport} style={[styles.settingRow, { borderBottomColor: theme.border }]}>
          <Text style={{ color: theme.text, fontSize: 14.5 }}>{t('settings.exportData')}</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('About')}
          style={[styles.settingRow, { borderBottomColor: theme.border }]}
        >
          <Text style={{ color: theme.text, fontSize: 14.5 }}>{t('settings.about')}</Text>
        </Pressable>
        <Pressable
          onPress={actions.restartOnboarding}
          style={[styles.settingRow, { borderBottomColor: theme.border }]}
        >
          <Text style={{ color: theme.text, fontSize: 14.5 }}>{t('settings.restartOnboarding')}</Text>
        </Pressable>
        <Pressable onPress={onDeleteAllData} style={[styles.settingRow, { borderBottomColor: theme.border }]}>
          <Text style={{ color: theme.danger, fontSize: 14.5 }}>{t('settings.deleteAllData')}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 28 },
  googleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  googleActionsRow: { flexDirection: 'row', gap: 20 },
  connectBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
    minWidth: 130,
    alignItems: 'center',
  },
  back: { fontSize: 22, lineHeight: 22 },
  title: { fontSize: 20, fontWeight: '700' },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  pickerList: { gap: 8, marginBottom: 28 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  pickerDot: { width: 8, height: 8, borderRadius: 4 },
  twoCol: { flexDirection: 'row', gap: 12 },
  settingsList: {},
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  appearanceHint: { fontSize: 12, marginTop: 8, marginBottom: 28 },
});
