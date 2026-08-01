import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import { useUi } from '../../store/UiContext';
import { themeFor } from '../../theme/theme';
import { SegmentedControl } from '../../components/SegmentedControl';
import { PillButton } from '../../components/PillButton';
import { ClockIcon, ShareIcon, type ShareChannel } from '../../components/icons';
import { useRoleMeta } from '../../i18n/labels';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import { calculateReportHours, isReportOverdue, monthHoursFor, participatedFor, pendingReportMonth, studiesForMonth } from '../../store/selectors';
import { monthLabel, parseMonthKey } from '../../utils/dates';
import { fmtHours } from '../../utils/format';
import { hexToRgba } from '../../utils/color';
import { buildReportText, isPioneerRole, recipientFirstName } from '../../utils/report';
import { shareViaEmail, shareViaSms, shareViaSystemSheet, shareViaTelegram, shareViaWhatsapp } from '../../utils/share';
import { translateText } from '../../utils/translate';
import type { TranslateLanguage } from '../../utils/translateLanguages';
import { TranslateLanguageSheet } from './TranslateLanguageSheet';
import type { ReportTone } from '../../store/types';
import type { TabScreenNavProp } from '../../navigation/types';

export function ReportScreen({ navigation }: { navigation: TabScreenNavProp<'Report'> }) {
  const { state, actions } = useApp();
  const { showToast } = useUi();
  const { t } = useTranslation();
  const roleMeta = useRoleMeta();
  const theme = themeFor(state.darkMode);
  const locale = INTL_LOCALE_TAGS[state.language];
  const insets = useSafeAreaInsets();
  const isPioneer = isPioneerRole(state);
  const pendingMonth = useMemo(() => pendingReportMonth(state), [state]);
  const overdue = useMemo(() => isReportOverdue(state), [state]);
  const reportHoursCalc = useMemo(() => calculateReportHours(state, pendingMonth), [state, pendingMonth]);
  const hours = reportHoursCalc.reportHours;
  const studies = useMemo(() => studiesForMonth(state, pendingMonth), [state, pendingMonth]);
  const participated = participatedFor(state, pendingMonth);
  const name = recipientFirstName(state);

  const [editedText, setEditedText] = useState(() => buildReportText(state, pendingMonth));
  const [sourceLanguageCode, setSourceLanguageCode] = useState<string>(state.language);
  const [translatedToName, setTranslatedToName] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
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

  return (
    <>
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}
    >
      <View style={styles.headerRow}>
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

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        {!isPioneer ? (
          <Pressable
            onPress={() => actions.toggleParticipated(pendingMonth)}
            style={[styles.cardRow, styles.cardRowBorder, { borderBottomColor: theme.border }]}
          >
            <Text style={[styles.cardRowLabel, { color: theme.text }]}>{t('report.sharedInMinistry')}</Text>
            <View
              style={[
                styles.checkbox,
                { borderColor: theme.accent, backgroundColor: participated ? theme.accent : 'transparent' },
              ]}
            >
              {participated ? <Text style={{ color: theme.accentText, fontSize: 13 }}>✓</Text> : null}
            </View>
          </Pressable>
        ) : (
          <View style={[styles.cardRow, styles.cardRowBorder, { borderBottomColor: theme.border }]}>
            <Text style={[styles.cardRowLabel, { color: theme.secondaryText }]}>{t('report.fieldServiceHours')}</Text>
            <Text style={[styles.cardRowValue, { color: theme.text }]}>{fmtHours(hours)}</Text>
          </View>
        )}
        <View style={[styles.cardRow, reportHoursCalc.remainder > 0 ? styles.cardRowBorder : null, { borderBottomColor: theme.border }]}>
          <Text style={[styles.cardRowLabel, { color: theme.secondaryText }]}>{t('report.bibleStudies')}</Text>
          <Text style={[styles.cardRowValue, { color: theme.text }]}>{studies}</Text>
        </View>

        {reportHoursCalc.remainder > 0 ? (
          <View style={styles.rolloverRow}>
            <Text style={[styles.rolloverText, { color: theme.secondaryText }]}>
              {t('report.rolloverNotice', {
                remainder: fmtHours(reportHoursCalc.remainder),
                total: fmtHours(reportHoursCalc.totalAccumulated),
              })}
            </Text>
          </View>
        ) : null}
      </View>

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

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 110 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end', marginBottom: 6 },
  historyLink: { fontSize: 13, fontWeight: '600' },
  subLabel: { fontSize: 13, marginBottom: 24 },
  card: { borderRadius: 16, padding: 22, marginBottom: 20 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 14 },
  cardRowBorder: { marginBottom: 14, borderBottomWidth: 1 },
  cardRowLabel: { fontSize: 14.5 },
  cardRowValue: { fontSize: 22, fontWeight: '700' },
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
  iconRow: { flexDirection: 'row', justifyContent: 'center', gap: 28 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rolloverRow: { paddingTop: 10 },
  rolloverText: { fontSize: 12, lineHeight: 16, fontStyle: 'italic', textAlign: 'center' },
});
