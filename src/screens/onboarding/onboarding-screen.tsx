import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { themeFor, onboardingTint } from '../../theme/theme';
import { LabeledInput } from '../../components/inputs/field';
import { PillButton } from '../../components/actions/pill-button';
import { AuxPioneerFields } from '../../components/inputs/aux-pioneer-fields';
import { useRoleMeta } from '../../hooks/use-role-meta';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import type { BaseRole } from '../../store/types';

const ROLE_ORDER: BaseRole[] = ['publisher', 'regular_pioneer', 'special_pioneer'];
const TOTAL_STEPS = 4;

export function OnboardingScreen() {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const roleMeta = useRoleMeta();
  const theme = themeFor(state.darkMode);
  const locale = INTL_LOCALE_TAGS[state.language];
  const [step, setStep] = useState(0);
  const primaryLabels = [t('onboarding.primaryGetStarted'), t('onboarding.primaryContinue'), t('onboarding.primaryContinue'), t('onboarding.primaryFinish')];

  const tint = step === 0 ? (state.darkMode ? onboardingTint.dark : onboardingTint.light) : theme.bg;

  const next = () => {
    if (step >= TOTAL_STEPS - 1) {
      actions.completeOnboarding();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.wrap, { backgroundColor: tint }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.topRow}>
        {step < TOTAL_STEPS - 1 ? (
          <Pressable onPress={actions.skipOnboarding} hitSlop={8}>
            <Text style={[styles.skip, { color: theme.secondaryText }]}>{t('onboarding.skip')}</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      {step === 0 ? (
        <View style={styles.centerFill}>
          <Text style={[styles.eyebrow, { color: theme.secondaryText }]}>{t('onboarding.welcomeEyebrow')}</Text>
          <Text style={[styles.headline, { color: theme.text }]}>{t('onboarding.welcomeHeadline')}</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.stepBody}>
          <Text style={[styles.stepTitle, { color: theme.text }]}>{t('onboarding.nameTitle')}</Text>
          <Text style={[styles.stepSub, { color: theme.secondaryText }]}>{t('onboarding.nameSubtitle')}</Text>
          <LabeledInput
            value={state.name}
            onChangeText={actions.setName}
            placeholder={t('onboarding.namePlaceholder')}
            theme={theme}
            fontSize={15}
          />
        </View>
      ) : null}

      {step === 2 ? (
        <ScrollView style={styles.stepBody} showsVerticalScrollIndicator={false}>
          <Text style={[styles.stepTitle, { color: theme.text }]}>{t('onboarding.roleTitle')}</Text>
          <Text style={[styles.stepSub, { color: theme.secondaryText }]}>{t('onboarding.roleSubtitle')}</Text>
          <View style={{ gap: 10 }}>
            {ROLE_ORDER.map((key) => {
              const selected = state.role === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => actions.setRole(key)}
                  style={[styles.roleCard, { borderColor: selected ? theme.accent : theme.border }]}
                >
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: selected ? '700' : '400' }}>
                    {roleMeta[key]}
                  </Text>
                  {selected ? <View style={[styles.roleDot, { backgroundColor: theme.accent }]} /> : null}
                </Pressable>
              );
            })}
          </View>

          {state.role === 'publisher' ? (
            <View style={styles.auxSection}>
              <Text style={[styles.auxTitle, { color: theme.text }]}>{t('onboarding.auxPioneerTitle')}</Text>
              <Text style={[styles.auxSubtitle, { color: theme.secondaryText }]}>
                {t('onboarding.auxPioneerSubtitle')}
              </Text>
              <AuxPioneerFields
                schedule={state.auxPioneerSchedule}
                onSetOngoing={actions.setAuxPioneerOngoing}
                onToggleMonth={actions.toggleAuxPioneerMonth}
                theme={theme}
                locale={locale}
              />
            </View>
          ) : null}
        </ScrollView>
      ) : null}

      {step === 3 ? (
        <View style={styles.stepBody}>
          <Text style={[styles.stepTitle, { color: theme.text }]}>{t('onboarding.recipientTitle')}</Text>
          <Text style={[styles.stepSub, { color: theme.secondaryText }]}>{t('onboarding.recipientSubtitle')}</Text>
          <LabeledInput
            value={state.reportRecipient}
            onChangeText={actions.setReportRecipient}
            placeholder={t('onboarding.recipientPlaceholder')}
            theme={theme}
            fontSize={15}
          />
        </View>
      ) : null}

      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: step === i ? theme.accent : theme.border }]} />
        ))}
      </View>
      <PillButton label={primaryLabels[step]} onPress={next} theme={theme} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingTop: 56, paddingHorizontal: 24, paddingBottom: 32 },
  topRow: { flexDirection: 'row', justifyContent: 'flex-end', minHeight: 24 },
  skip: { fontSize: 13.5, padding: 6 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  eyebrow: { fontSize: 13, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 18 },
  headline: { fontSize: 24, fontWeight: '600', lineHeight: 34, letterSpacing: -0.3, textAlign: 'center' },
  stepBody: { flex: 1, paddingTop: 20 },
  stepTitle: { fontSize: 23, fontWeight: '700', marginBottom: 6 },
  stepSub: { fontSize: 13.5, marginBottom: 28 },
  roleCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 14, borderWidth: 1.5 },
  roleDot: { width: 9, height: 9, borderRadius: 5 },
  auxSection: { marginTop: 22 },
  auxTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  auxSubtitle: { fontSize: 12.5, marginBottom: 14 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
