import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PixelRatio,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trans, useTranslation } from 'react-i18next';
import { captureRef } from 'react-native-view-shot';
import { useApp } from '../../store/app-context';
import { useUi } from '../../store/ui-context';
import { themeFor } from '../../theme/theme';
import { SegmentedControl } from '../../components/inputs/segmented-control';
import { PillButton } from '../../components/actions/pill-button';
import { ClockIcon, ShareIcon, type ShareChannel } from '../../components/data-display/icons';
import { useRoleMeta } from '../../hooks/use-role-meta';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import { calculateReportHours, isReportOverdue, participatedFor, pendingReportMonth, studiesForMonth } from '../../store/selectors';
import { monthLabel, parseMonthKey } from '../../utils/dates';
import { fmtHours } from '../../utils/format';
import { hexToRgba } from '../../utils/color';
import { buildReportText, isPioneerRole, recipientFirstName } from '../../utils/report';
import { sharePngFile, shareViaEmail, shareViaSms, shareViaSystemSheet, shareViaTelegram, shareViaWhatsapp } from '../../utils/share';
import { translateText } from '../../utils/translate';
import type { TranslateLanguage } from '../../utils/translate-languages';
import { TranslateLanguageSheet } from './translate-language-sheet';
import type { ReportTone } from '../../store/types';
import type { RootNavProp } from '../../navigation/types';

export function ReportScreen({ navigation }: { navigation: RootNavProp }) {
  const { state, actions } = useApp();
  const { showToast } = useUi();
  const { t } = useTranslation();
  const roleMeta = useRoleMeta();
  const theme = themeFor(state.darkMode);
  const locale = INTL_LOCALE_TAGS[state.language];
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isPioneer = isPioneerRole(state);
  const pendingMonth = useMemo(() => pendingReportMonth(state), [state]);
  const overdue = useMemo(() => isReportOverdue(state), [state]);
  const reportHoursCalc = useMemo(() => calculateReportHours(state, pendingMonth), [state, pendingMonth]);
  const hours = reportHoursCalc.reportHours;
  const studies = useMemo(() => studiesForMonth(state, pendingMonth), [state, pendingMonth]);
  const participated = participatedFor(state, pendingMonth);
  const name = recipientFirstName(state);
  const reportCardMonth = useMemo(() => monthLabel(parseMonthKey(pendingMonth), locale), [pendingMonth, locale]);
  const reportCardWidth = Math.min(windowWidth - 48, 720);
  const reportCardScale = Math.min(Math.max(reportCardWidth / 327, 0.84), 1.8);
  const reportMetricRowHeight = 38 * reportCardScale;

  const [editedText, setEditedText] = useState(() => buildReportText(state, pendingMonth));
  const [sourceLanguageCode, setSourceLanguageCode] = useState<string>(state.language);
  const [translatedToName, setTranslatedToName] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const reportCardRef = useRef<View>(null);
  const lastGeneratedRef = useRef(editedText);

  // Bottom tabs stay mounted once visited, so a language, role, or recipient
  // change made from the Profile/Settings tab wouldn't otherwise reach an
  // already-open Report tab — depending on the whole `state` (everything
  // buildReportText actually reads) instead of just `state.language` is what
  // makes those cross-tab edits show up immediately instead of only once
  // something else happens to touch language or the pending month. Only
  // regenerate if the user hasn't diverged from the last auto-generated text
  // (typed their own edit, or used the one-off Translate feature) — otherwise
  // this would silently clobber their changes.
  useEffect(() => {
    const regenerated = buildReportText(state, pendingMonth);
    if (editedText === lastGeneratedRef.current) {
      setEditedText(regenerated);
      setSourceLanguageCode(state.language);
      setTranslatedToName(null);
    }
    lastGeneratedRef.current = regenerated;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pendingMonth]);

  const onChangeTone = (tone: ReportTone) => {
    if (tone === 'formal') actions.setToneFormal();
    else actions.setToneConversational();
    const regenerated = buildReportText({ ...state, reportTone: tone }, pendingMonth);
    setEditedText(regenerated);
    lastGeneratedRef.current = regenerated;
    setSourceLanguageCode(state.language);
    setTranslatedToName(null);
  };

  const onTranslate = async (language: TranslateLanguage) => {
    setLanguagePickerOpen(false);
    setTranslating(true);
    try {
      const translated = await translateText(editedText, sourceLanguageCode, language.code);
      setEditedText(translated);
      setSourceLanguageCode(language.code);
      setTranslatedToName(language.name);
    } catch {
      showToast(t('report.translateFailed'));
    } finally {
      setTranslating(false);
    }
  };

  const send = async () => {
    const result = await shareViaSystemSheet(editedText, t('share.shareTitle'));
    if (result === 'shared') {
      showToast(name ? t('report.reportSentTo', { name }) : t('report.reportSent'));
    }
  };

  const sendVia = async (channel: ShareChannel) => {
    let ok = false;
    if (channel === 'whatsapp') ok = await shareViaWhatsapp(editedText, state.recipientPhone);
    else if (channel === 'telegram') ok = await shareViaTelegram(editedText);
    else if (channel === 'sms') ok = await shareViaSms(editedText, state.recipientPhone);
    else ok = await shareViaEmail(editedText, state.recipientEmail, t('share.emailSubject'));
    if (ok) showToast(name ? t('report.reportSentTo', { name }) : t('report.reportSent'));
    else showToast(t('report.couldntOpen', { channel }));
  };

  const markSent = () => {
    actions.markReportSent(pendingMonth);
    showToast(t('report.markedSentToast'));
  };

  const exportReportCardPng = async () => {
    const target = reportCardRef.current;
    if (!target) return;
    setExportingPng(true);
    try {
      const uri = await captureRef(target, {
        format: 'png',
        quality: 1,
        result: Platform.OS === 'web' ? 'base64' : 'tmpfile',
        width: 1440 / PixelRatio.get(),
        height: (1440 / REPORT_CARD_ASPECT_RATIO) / PixelRatio.get(),
      });
      const ok = await sharePngFile(uri, t('share.shareTitle'));
      if (!ok) showToast(t('report.exportPngFailed'));
    } catch {
      showToast(t('report.exportPngFailed'));
    } finally {
      setExportingPng(false);
    }
  };

  return (
    <>
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityLabel={t('common.back')}>
          <Text style={[styles.back, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>{t('tabs.report')}</Text>
        <Pressable onPress={() => navigation.navigate('History')}>
          <Text style={[styles.historyLink, { color: theme.accent }]}>{t('report.history')}</Text>
        </Pressable>
      </View>
      <Text style={[styles.subLabel, { color: theme.secondaryText }]}>
        {t('report.subtitle', { month: monthLabel(parseMonthKey(pendingMonth), locale), role: roleMeta[state.role] })}
      </Text>

      {overdue ? (
        <Pressable
          onPress={markSent}
          style={[
            styles.reminderCard,
            { backgroundColor: hexToRgba(theme.gold, 0.14), borderColor: hexToRgba(theme.gold, 0.35) },
          ]}
        >
          <ClockIcon color={theme.gold} size={18} />
          <View style={styles.reminderTextWrap}>
            <Text style={[styles.reminderTitle, { color: theme.text }]}>
              {t('report.reminderTitle', {
                month: parseMonthKey(pendingMonth).toLocaleDateString(locale, { month: 'long' }),
              })}
            </Text>
            <Text style={[styles.reminderSubtitle, { color: theme.secondaryText }]}>
              {t('report.reminderSubtitle')}
            </Text>
          </View>
          <View style={[styles.checkbox, { borderColor: theme.gold }]} />
        </Pressable>
      ) : null}

      <View
        ref={reportCardRef}
        collapsable={false}
        style={[
          styles.card,
          {
            aspectRatio: REPORT_CARD_ASPECT_RATIO,
            backgroundColor: theme.card,
            borderRadius: 24 * reportCardScale,
            paddingHorizontal: 24 * reportCardScale,
            paddingVertical: 24 * reportCardScale,
            width: reportCardWidth,
          },
        ]}
      >
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          selectable
          style={[
            styles.cardTitle,
            { color: theme.text, fontSize: 20 * reportCardScale, lineHeight: 24 * reportCardScale },
          ]}
        >
          {t('report.cardTitle')}
        </Text>
        <Text
          selectable
          style={[
            styles.cardSubtitle,
            {
              color: theme.secondaryText,
              fontSize: 12.5 * reportCardScale,
              lineHeight: 16 * reportCardScale,
              marginTop: 6 * reportCardScale,
            },
          ]}
        >
          {reportCardMonth}
        </Text>

        <View style={{ marginTop: 10 * reportCardScale }}>
          <Pressable
            accessibilityRole={isPioneer ? undefined : 'checkbox'}
            accessibilityState={isPioneer ? undefined : { checked: participated }}
            disabled={isPioneer}
            onPress={() => actions.toggleParticipated(pendingMonth)}
            style={[
              styles.cardSection,
              styles.cardSectionDivider,
              { borderBottomColor: theme.border, height: reportMetricRowHeight },
            ]}
          >
            <Text
              numberOfLines={1}
              selectable
              style={[
                styles.cardRowLabel,
                { color: theme.secondaryText, fontSize: 14 * reportCardScale, paddingRight: 12 * reportCardScale },
              ]}
            >
              {isPioneer ? t('report.fieldServiceHours') : t('report.sharedInMinistry')}
            </Text>
            {isPioneer ? (
              <Text
                selectable
                style={[
                  styles.cardRowValue,
                  { color: theme.text, fontSize: 25 * reportCardScale, lineHeight: 30 * reportCardScale },
                ]}
              >
                {fmtHours(hours)}
              </Text>
            ) : (
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: theme.accent,
                    backgroundColor: participated ? theme.accent : 'transparent',
                    height: 20 * reportCardScale,
                    width: 20 * reportCardScale,
                  },
                ]}
              >
                {participated ? <Text style={{ color: theme.accentText, fontSize: 13 * reportCardScale }}>✓</Text> : null}
              </View>
            )}
          </Pressable>

          <View style={[styles.cardSection, { height: reportMetricRowHeight }]}>
            <Text
              numberOfLines={1}
              selectable
              style={[
                styles.cardRowLabel,
                { color: theme.secondaryText, fontSize: 14 * reportCardScale, paddingRight: 12 * reportCardScale },
              ]}
            >
              {t('report.bibleStudies')}
            </Text>
            <Text
              selectable
              style={[
                styles.cardRowValue,
                { color: theme.text, fontSize: 25 * reportCardScale, lineHeight: 30 * reportCardScale },
              ]}
            >
              {studies}
            </Text>
          </View>
        </View>

        {state.creditHoursEnabled && state.creditHoursAmount > 0 && isPioneer ? (
          <View style={[styles.creditBlock, { paddingTop: 12 * reportCardScale }]}>
            <Text
              numberOfLines={2}
              selectable
              style={[
                styles.creditStatement,
                {
                  color: theme.secondaryText,
                  fontSize: 12.5 * reportCardScale,
                  lineHeight: 17 * reportCardScale,
                },
              ]}
            >
              <Trans
                i18nKey="report.creditHoursStatementCard"
                values={{
                  hours: fmtHours(state.creditHoursAmount),
                  source: state.creditHoursSource.trim() || t('report.creditHoursSourceFallback'),
                }}
                components={{ bold: <Text style={[styles.creditHoursBold, { color: theme.text }]} /> }}
              />
            </Text>
          </View>
        ) : null}

      </View>

      {reportHoursCalc.remainder > 0 ? (
        <Text style={[styles.rolloverText, { color: theme.secondaryText }]}>
          {t('report.rolloverNotice', {
            remainder: fmtHours(reportHoursCalc.remainder),
            total: fmtHours(reportHoursCalc.totalAccumulated),
          })}
        </Text>
      ) : null}

      <PillButton
        label={exportingPng ? t('report.exportPngWorking') : t('report.exportPng')}
        onPress={exportReportCardPng}
        theme={theme}
        disabled={exportingPng}
        style={{ marginBottom: 18 }}
      />

      <SegmentedControl
        options={[
          { key: 'formal', label: t('report.formal') },
          { key: 'conversational', label: t('report.conversational') },
        ]}
        value={state.reportTone}
        onChange={onChangeTone}
        theme={theme}
      />

      <View style={[styles.preview, { borderColor: theme.border }]}>
        <View style={styles.previewHeader}>
          <Pressable onPress={() => setLanguagePickerOpen(true)} disabled={translating} hitSlop={6}>
            {translating ? (
              <View style={styles.translatingRow}>
                <ActivityIndicator size="small" color={theme.accent} />
                <Text style={[styles.translateLink, { color: theme.secondaryText }]}>{t('report.translating')}</Text>
              </View>
            ) : (
              <Text style={[styles.translateLink, { color: theme.accent }]}>{t('report.translate')}</Text>
            )}
          </Pressable>
        </View>
        <TextInput
          value={editedText}
          onChangeText={(v) => {
            setEditedText(v);
            setTranslatedToName(null);
          }}
          multiline
          style={[styles.previewText, { color: theme.text }]}
        />
        {translatedToName ? (
          <Text style={[styles.translatedCaption, { color: theme.secondaryText }]}>
            {t('report.translatedTo', { language: translatedToName })}
          </Text>
        ) : null}
      </View>

      <PillButton
        label={name ? t('report.sendTo', { name }) : t('report.sendReport')}
        onPress={send}
        theme={theme}
        style={{ marginBottom: 20 }}
      />

      <View style={styles.iconRow}>
        {(['whatsapp', 'telegram', 'sms', 'email'] as ShareChannel[]).map((channel) => (
          <Pressable key={channel} onPress={() => sendVia(channel)} style={[styles.iconBtn, { borderColor: theme.border }]}>
            <ShareIcon name={channel} color={theme.secondaryText} />
          </Pressable>
        ))}
      </View>
    </ScrollView>

    <TranslateLanguageSheet
      visible={languagePickerOpen}
      onClose={() => setLanguagePickerOpen(false)}
      onSelect={onTranslate}
      theme={theme}
    />
    </>
  );
}

const REPORT_CARD_ASPECT_RATIO = 1.56;

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 110 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  back: { fontSize: 22, lineHeight: 22 },
  title: { fontSize: 15.5, fontWeight: '700' },
  historyLink: { fontSize: 13, fontWeight: '600' },
  subLabel: { fontSize: 13, marginBottom: 24 },
  card: {
    alignSelf: 'center',
    borderCurve: 'continuous',
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardTitle: { fontWeight: '800', letterSpacing: -0.55 },
  cardSubtitle: { letterSpacing: -0.1 },
  cardSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSectionDivider: { borderBottomWidth: StyleSheet.hairlineWidth },
  cardRowLabel: { flex: 1, fontWeight: '400' },
  cardRowValue: { fontVariant: ['tabular-nums'], fontWeight: '800', letterSpacing: -0.8 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  reminderTextWrap: { flex: 1, gap: 2 },
  reminderTitle: { fontSize: 13.5, fontWeight: '600' },
  reminderSubtitle: { fontSize: 12 },
  preview: { borderWidth: 1, borderRadius: 12, padding: 16, paddingTop: 10, marginTop: 18, marginBottom: 24 },
  previewHeader: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  translateLink: { fontSize: 12.5, fontWeight: '600' },
  translatingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewText: { fontSize: 13, lineHeight: 20.8, padding: 0, textAlignVertical: 'top' },
  translatedCaption: { fontSize: 11, marginTop: 8, fontStyle: 'italic' },
  creditBlock: { marginTop: 'auto' },
  creditStatement: { letterSpacing: -0.1 },
  creditHoursBold: { fontWeight: '800' },
  iconRow: { flexDirection: 'row', justifyContent: 'center', gap: 28 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rolloverText: { fontSize: 12, lineHeight: 16, fontStyle: 'italic', textAlign: 'center', marginBottom: 14 },
});
