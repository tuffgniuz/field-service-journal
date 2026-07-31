import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import { themeFor } from '../../theme/theme';
import { KeyboardAvoidingScrollView } from '../../components/KeyboardAvoidingScrollView';
import { CameraIcon, SettingsIcon } from '../../components/icons';
import { MonthHeatmap } from './MonthHeatmap';
import { useRoleMeta } from '../../i18n/labels';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import { buildChartMonth, monthHoursFor } from '../../store/selectors';
import { fmtHours } from '../../utils/format';
import { deleteAvatarImage, pickAvatarImage } from '../../utils/avatar';
import { pioneerGoalFor } from '../../utils/goals';
import type { TabScreenNavProp } from '../../navigation/types';

export function ProfileScreen({ navigation }: { navigation: TabScreenNavProp<'Profile'> }) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const roleMeta = useRoleMeta();
  const theme = themeFor(state.darkMode);
  const insets = useSafeAreaInsets();
  const locale = INTL_LOCALE_TAGS[state.language];
  const [monthOffset, setMonthOffset] = useState(0);
  const chart = useMemo(() => buildChartMonth(state, monthOffset, locale), [state, monthOffset, locale]);
  const monthHours = useMemo(() => monthHoursFor(state, chart.monthKey), [state, chart.monthKey]);
  const goal = useMemo(() => pioneerGoalFor(state), [state]);

  const onPickAvatar = async () => {
    const uri = await pickAvatarImage(state.avatarUri || undefined);
    if (uri) actions.setAvatarUri(uri);
  };

  const onAvatarPress = () => {
    if (!state.avatarUri) {
      onPickAvatar();
      return;
    }
    Alert.alert(t('profile.profilePhotoAlertTitle'), undefined, [
      { text: t('profile.changePhoto'), onPress: onPickAvatar },
      {
        text: t('profile.removePhoto'),
        style: 'destructive',
        onPress: () => {
          deleteAvatarImage(state.avatarUri);
          actions.setAvatarUri('');
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <KeyboardAvoidingScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>
            {state.name.trim() ? t('profile.greeting', { name: state.name.trim() }) : t('profile.titleFallback')}
          </Text>
          <Text style={[styles.roleSubtitle, { color: theme.secondaryText }]}>{roleMeta[state.role]}</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          hitSlop={8}
          accessibilityLabel={t('profile.settingsAccessibility')}
          style={[styles.settingsBtn, { borderColor: theme.border }]}
        >
          <SettingsIcon color={theme.secondaryText} size={18} />
        </Pressable>
      </View>

      <View style={styles.avatarRow}>
        <Pressable
          onPress={onAvatarPress}
          accessibilityLabel={state.avatarUri ? t('profile.changeProfilePhotoLabel') : t('profile.addProfilePhoto')}
          style={[
            styles.avatar,
            state.avatarUri
              ? { borderColor: theme.border }
              : { borderColor: theme.border, borderStyle: 'dashed', backgroundColor: theme.card },
          ]}
        >
          {state.avatarUri ? (
            <Image
              source={{ uri: state.avatarUri }}
              style={styles.avatarImage}
              onError={() => actions.setAvatarUri('')}
            />
          ) : (
            <CameraIcon color={theme.secondaryText} size={24} />
          )}
        </Pressable>
      </View>

      {goal ? (
        <View style={[styles.card, { borderColor: theme.border }]}>
          <Text style={[styles.goalTitle, { color: theme.text }]}>
            {t(goal.kind === 'monthly' ? 'profile.monthlyGoalTitle' : 'profile.yearlyGoalTitle')}
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.accent,
                  width: `${Math.min(100, (goal.completedHours / goal.targetHours) * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.goalProgress, { color: theme.secondaryText }]}>
            {t('profile.goalProgress', { completed: fmtHours(goal.completedHours), target: goal.targetHours })}
          </Text>
          <Text style={[styles.goalStatus, { color: theme.text }]}>
            {goal.remainingHours > 0
              ? t('profile.hoursToGo', { count: goal.remainingHours })
              : t(goal.kind === 'monthly' ? 'profile.goalReachedMonthly' : 'profile.goalReachedYearly')}
          </Text>
          {goal.kind === 'yearly' ? (
            <Text style={[styles.goalCaption, { color: theme.secondaryText }]}>
              {t('profile.serviceYearCaption', { year: goal.serviceYearLabel })}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.card, { borderColor: theme.border }]}>
        <View style={styles.monthNavRow}>
          <Pressable
            onPress={() => setMonthOffset((o) => Math.max(-24, o - 1))}
            hitSlop={8}
            accessibilityLabel={t('profile.previousMonth')}
            style={styles.navBtn}
          >
            <Text style={[styles.navArrow, { color: theme.secondaryText }]}>‹</Text>
          </Pressable>
          <Text style={[styles.monthLabel, { color: theme.text }]}>{chart.label}</Text>
          <Pressable
            onPress={monthOffset < 0 ? () => setMonthOffset((o) => Math.min(0, o + 1)) : undefined}
            hitSlop={8}
            accessibilityLabel={t('profile.nextMonth')}
            style={styles.navBtn}
          >
            <Text style={[styles.navArrow, { color: monthOffset < 0 ? theme.secondaryText : theme.border }]}>›</Text>
          </Pressable>
        </View>
        <Text style={[styles.monthHoursLabel, { color: theme.secondaryText }]}>{t('profile.hoursLogged')}</Text>
        <Text style={[styles.monthHoursValue, { color: theme.text }]}>{fmtHours(monthHours)}</Text>
        <View style={styles.heatmapSpacer} />
        <MonthHeatmap theme={theme} chart={chart} locale={locale} />
      </View>
    </KeyboardAvoidingScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 110 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerText: { flex: 1, marginRight: 12 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.4 },
  roleSubtitle: { fontSize: 14, marginTop: 4 },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRow: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 28 },
  goalTitle: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 4 },
  goalProgress: { fontSize: 13, marginBottom: 2 },
  goalStatus: { fontSize: 15, fontWeight: '700' },
  goalCaption: { fontSize: 12, marginTop: 8 },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  navArrow: { fontSize: 16 },
  monthLabel: { fontSize: 13.5, fontWeight: '600' },
  monthHoursLabel: { fontSize: 13, marginBottom: 4 },
  monthHoursValue: { fontSize: 34, fontWeight: '700', letterSpacing: -0.6 },
  heatmapSpacer: { height: 18 },
});
