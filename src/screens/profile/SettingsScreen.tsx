import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import { useUi } from '../../store/UiContext';
import { themeFor } from '../../theme/theme';
import { KeyboardAvoidingScrollView } from '../../components/KeyboardAvoidingScrollView';
import { LabeledInput } from '../../components/Field';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useRoleMeta } from '../../i18n/labels';
import { LANGUAGE_NATIVE_NAMES } from '../../i18n/language';
import { currentServiceYearLabel } from '../../utils/dates';
import { type LanguagePreference, type Role, type ThemePreference } from '../../store/types';
import { exportAppData } from '../../utils/exportData';
import type { RootNavProp } from '../../navigation/types';

const ROLE_ORDER: Role[] = ['publisher', 'aux_pioneer', 'regular_pioneer', 'special_pioneer'];
const LANGUAGE_ORDER: LanguagePreference[] = ['system', 'en', 'nl', 'id'];

export function SettingsScreen({ navigation }: { navigation: RootNavProp }) {
  const { state, actions } = useApp();
  const { showToast } = useUi();
  const { t } = useTranslation();
  const roleMeta = useRoleMeta();
  const theme = themeFor(state.darkMode);
  const insets = useSafeAreaInsets();

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

      <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>{t('settings.role')}</Text>
      <View style={styles.pickerList}>
        {ROLE_ORDER.map((key) => {
          const selected = state.role === key;
          return (
            <Pressable
              key={key}
              onPress={() => actions.setRole(key)}
              style={[styles.pickerRow, { borderColor: selected ? theme.accent : theme.border }]}
            >
              <Text style={{ color: theme.text, fontSize: 14.5, fontWeight: selected ? '700' : '400' }}>
                {roleMeta[key]}
              </Text>
              {selected ? <View style={[styles.pickerDot, { backgroundColor: theme.accent }]} /> : null}
            </Pressable>
          );
        })}
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
