import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { themeFor } from '../../theme/theme';
import { KeyboardAvoidingScrollView } from '../../components/layout/keyboard-avoiding-scroll-view';
import { LabeledInput, LabeledTextArea } from '../../components/inputs/field';
import { TimePickerField } from '../../components/inputs/time-picker-field';
import { ColorPickerRow } from '../../components/inputs/color-picker-row';
import { Chip } from '../../components/data-display/chip';
import { PillButton } from '../../components/actions/pill-button';
import { dateKey, parseDateKey } from '../../utils/dates';
import { ACTIVITY_TYPE_KEYS, currentWeekStart, weekDates, weekStartOf } from '../../utils/schedule';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import type { ActivityType, RecurringRule } from '../../store/types';
import type { RootNavProp, RootStackParamList } from '../../navigation/types';

const TYPE_ORDER: ActivityType[] = ['field_service', 'bible_study', 'return_visit', 'cart', 'other'];
const REPEAT_ORDER: RecurringRule[] = ['none', 'weekly', 'biweekly', 'monthly'];
const REPEAT_KEYS: Record<
  RecurringRule,
  'addActivity.repeatNone' | 'addActivity.repeatWeekly' | 'addActivity.repeatBiweekly' | 'addActivity.repeatMonthly'
> = {
  none: 'addActivity.repeatNone',
  weekly: 'addActivity.repeatWeekly',
  biweekly: 'addActivity.repeatBiweekly',
  monthly: 'addActivity.repeatMonthly',
};

export function AddActivityScreen({
  navigation,
  route,
}: {
  navigation: RootNavProp;
  route: RouteProp<RootStackParamList, 'AddActivity'>;
}) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const theme = themeFor(state.darkMode);
  const locale = INTL_LOCALE_TAGS[state.language];
  const insets = useSafeAreaInsets();
  const editingActivityId = route.params?.activityId;
  const editingActivity = editingActivityId
    ? state.scheduledActivities.find((a) => a.id === editingActivityId)
    : undefined;

  const baseWeekStart = useMemo(() => {
    const seedDate = editingActivity?.date ?? route.params?.date;
    return seedDate ? weekStartOf(parseDateKey(seedDate)) : currentWeekStart();
  }, [editingActivity, route.params]);
  const weekChipDates = useMemo(() => weekDates(baseWeekStart), [baseWeekStart]);

  const [type, setType] = useState<ActivityType>(editingActivity?.type ?? 'bible_study');
  const [selectedDate, setSelectedDate] = useState<string | null>(
    editingActivity?.date ?? route.params?.date ?? null
  );
  const [time, setTime] = useState(editingActivity?.time ?? '');
  const [endTime, setEndTime] = useState(editingActivity?.endTime ?? '');
  const [contactId, setContactId] = useState<string | null>(editingActivity?.contactId ?? null);
  const [color, setColor] = useState<string | null>(editingActivity?.color ?? null);
  const [location, setLocation] = useState(editingActivity?.location ?? '');
  const [partners, setPartners] = useState(editingActivity?.partners ?? '');
  const [recurring, setRecurring] = useState<RecurringRule>(editingActivity?.recurring ?? 'none');
  const [notes, setNotes] = useState(editingActivity?.notes ?? '');

  const showContact = type === 'bible_study' || type === 'return_visit';
  const locationPlaceholder = showContact
    ? t('addActivity.locationAutoFillPlaceholder')
    : type === 'field_service'
    ? t('addActivity.locationPlaceholderFieldService')
    : type === 'cart'
    ? t('addActivity.locationPlaceholderCart')
    : t('addActivity.locationPlaceholderOther');

  const onSelectContact = (id: string) => {
    setContactId((prev) => {
      const next = prev === id ? null : id;
      if (next && !location) {
        const contact = state.contacts.find((c) => c.id === next);
        if (contact?.address) setLocation(contact.address);
      }
      return next;
    });
  };

  const save = () => {
    if (!selectedDate) return;
    const draft = {
      type,
      date: selectedDate,
      time,
      endTime: endTime.trim() || undefined,
      location,
      contactId: showContact ? contactId : null,
      color,
      partners,
      recurring,
      notes,
    };
    if (editingActivityId) actions.updateActivity(editingActivityId, draft);
    else actions.addActivity(draft);
    navigation.goBack();
  };

  const onDelete = () => {
    if (!editingActivityId) return;
    Alert.alert(t('addActivity.deleteTitle'), t('addActivity.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('addActivity.deleteActivity'),
        style: 'destructive',
        onPress: () => {
          actions.deleteActivity(editingActivityId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={[styles.cancel, { color: theme.secondaryText }]}>‹ {t('common.cancel')}</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>
          {t(editingActivityId ? 'addActivity.editTitle' : 'addActivity.title')}
        </Text>
        <Pressable onPress={save} disabled={!selectedDate} style={[styles.saveBtn, { backgroundColor: theme.accent, opacity: selectedDate ? 1 : 0.5 }]}>
          <Text style={[styles.saveBtnLabel, { color: theme.accentText }]}>{t('addActivity.save')}</Text>
        </Pressable>
      </View>

      <Text style={[styles.label, { color: theme.secondaryText }]}>{t('addActivity.typeLabel')}</Text>
      <View style={styles.chipsRow}>
        {TYPE_ORDER.map((key) => {
          const active = type === key;
          return (
            <Chip
              key={key}
              label={t(ACTIVITY_TYPE_KEYS[key])}
              onPress={() => setType(key)}
              borderColor={active ? theme.accent : theme.border}
              color={active ? theme.accent : theme.secondaryText}
            />
          );
        })}
      </View>

      <Text style={[styles.label, { color: theme.secondaryText }]}>{t('addActivity.colorLabel')}</Text>
      <View style={{ marginBottom: 22 }}>
        <ColorPickerRow theme={theme} value={color} onChange={setColor} noneLabel={t('addActivity.colorNone')} />
      </View>

      <Text style={[styles.label, { color: theme.secondaryText }]}>{t('addActivity.dateLabel')}</Text>
      <View style={styles.chipsRow}>
        {weekChipDates.map((d) => {
          const key = dateKey(d);
          const active = selectedDate === key;
          return (
            <Chip
              key={key}
              label={d.toLocaleDateString(locale, { weekday: 'short' })}
              onPress={() => setSelectedDate(key)}
              borderColor={active ? theme.accent : theme.border}
              color={active ? theme.accent : theme.secondaryText}
            />
          );
        })}
      </View>

      <View style={styles.timeRow}>
        <TimePickerField
          label={t('addActivity.timeLabel')}
          value={time}
          onChange={setTime}
          placeholder={t('addActivity.timePlaceholder')}
          theme={theme}
          locale={locale}
          uses24HourClock={state.uses24HourClock}
          style={styles.timeField}
        />

        <TimePickerField
          label={t('addActivity.endTimeLabel')}
          value={endTime}
          onChange={setEndTime}
          onClear={() => setEndTime('')}
          clearLabel={t('addActivity.clearEndTime')}
          placeholder={t('addActivity.endTimePlaceholder')}
          theme={theme}
          locale={locale}
          uses24HourClock={state.uses24HourClock}
          style={styles.timeField}
        />
      </View>

      {showContact ? (
        <>
          <Text style={[styles.label, { color: theme.secondaryText }]}>{t('addActivity.contactLabel')}</Text>
          <View style={styles.chipsRow}>
            {state.contacts.map((c) => {
              const active = contactId === c.id;
              return (
                <Chip
                  key={c.id}
                  label={c.name}
                  onPress={() => onSelectContact(c.id)}
                  borderColor={active ? theme.accent : theme.border}
                  color={active ? theme.accent : theme.secondaryText}
                />
              );
            })}
          </View>
        </>
      ) : null}

      <LabeledInput
        label={t('addActivity.locationLabel')}
        value={location}
        onChangeText={setLocation}
        placeholder={locationPlaceholder}
        theme={theme}
        fontSize={14.5}
        style={{ marginBottom: 22 }}
      />

      <LabeledInput
        label={t('addActivity.partnersLabel')}
        value={partners}
        onChangeText={setPartners}
        placeholder={t('addActivity.partnersPlaceholder')}
        theme={theme}
        fontSize={14.5}
        style={{ marginBottom: 22 }}
      />

      <Text style={[styles.label, { color: theme.secondaryText }]}>{t('addActivity.repeatsLabel')}</Text>
      <View style={styles.chipsRow}>
        {REPEAT_ORDER.map((key) => {
          const active = recurring === key;
          return (
            <Chip
              key={key}
              label={t(REPEAT_KEYS[key])}
              onPress={() => setRecurring(key)}
              borderColor={active ? theme.accent : theme.border}
              color={active ? theme.accent : theme.secondaryText}
            />
          );
        })}
      </View>

      <LabeledTextArea
        label={t('addActivity.notesLabel')}
        value={notes}
        onChangeText={setNotes}
        placeholder={t('addActivity.notesPlaceholder')}
        theme={theme}
        minHeight={90}
        style={{ marginBottom: 22 }}
      />

      {editingActivityId ? (
        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <Text style={[styles.deleteLabel, { color: theme.danger }]}>{t('addActivity.deleteActivity')}</Text>
        </Pressable>
      ) : null}
    </KeyboardAvoidingScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 10 },
  cancel: { fontSize: 14.5 },
  title: { fontSize: 15.5, fontWeight: '700' },
  saveBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18 },
  saveBtnLabel: { fontSize: 13.5, fontWeight: '700' },
  label: { fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 22, flexWrap: 'wrap' },
  timeRow: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  timeField: { flex: 1, minWidth: 0 },
  deleteBtn: { alignItems: 'center', marginTop: 4, marginBottom: 16 },
  deleteLabel: { fontSize: 14, fontWeight: '600' },
});
