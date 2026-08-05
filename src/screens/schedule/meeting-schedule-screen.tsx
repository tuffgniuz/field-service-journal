import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { themeFor } from '../../theme/theme';
import { KeyboardAvoidingScrollView } from '../../components/layout/keyboard-avoiding-scroll-view';
import { TimePickerField } from '../../components/inputs/time-picker-field';
import { ColorPickerRow } from '../../components/inputs/color-picker-row';
import { INTL_LOCALE_TAGS } from '../../i18n/language';
import { dateKey, todayKey, parseDateKey } from '../../utils/dates';
import type { MeetingScheduleDay } from '../../store/types';
import type { RootNavProp } from '../../navigation/types';

// Monday-first display order of ISO weekdays, expressed as JS Date.getDay() values (0=Sun..6=Sat).
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function nextDateForDay(dayOfWeek: number, skipKeys: string[] = []): string {
  const today = parseDateKey(todayKey());
  const daysUntil = (dayOfWeek - today.getDay() + 7) % 7;
  const skip = new Set(skipKeys);

  for (let i = 0; i < 520; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + daysUntil + i * 7);
    const key = dateKey(d);
    if (!skip.has(key)) return key;
  }

  return dateKey(today);
}

// Rows are visible if they have a location OR a conductor override — either alone shouldn't make the other invisible/unreachable.
function initialDateLocationKeys(locationOverrides: Record<string, string>, conductorOverrides: Record<string, string>): Record<number, string[]> {
  const keys = new Set([...Object.keys(locationOverrides), ...Object.keys(conductorOverrides)]);
  return DISPLAY_ORDER.reduce<Record<number, string[]>>((acc, dow) => {
    acc[dow] = [...keys].filter((key) => parseDateKey(key).getDay() === dow).sort();
    return acc;
  }, {});
}

export function MeetingScheduleScreen({ navigation }: { navigation: RootNavProp }) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const theme = themeFor(state.darkMode);
  const locale = INTL_LOCALE_TAGS[state.language];
  const insets = useSafeAreaInsets();
  const [days, setDays] = useState<MeetingScheduleDay[]>(state.meetingSchedule);
  const [color, setColor] = useState<string | null>(state.meetingColor);
  const [locationOverrides, setLocationOverrides] = useState<Record<string, string>>(state.meetingLocationOverrides);
  const [conductorOverrides, setConductorOverrides] = useState<Record<string, string>>(state.meetingConductorOverrides);
  const [dateLocationKeysByDay, setDateLocationKeysByDay] = useState<Record<number, string[]>>(() =>
    initialDateLocationKeys(state.meetingLocationOverrides, state.meetingConductorOverrides)
  );

  const dayLabel = (dayOfWeek: number) => {
    // Jan 4, 1970 was a Sunday — used purely as a known week anchor.
    return new Date(1970, 0, 4 + dayOfWeek).toLocaleDateString(locale, { weekday: 'short' });
  };

  const updateDay = (dayOfWeek: number, patch: Partial<MeetingScheduleDay>) => {
    setDays((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)));
  };

  const save = () => {
    actions.setMeetingSchedule(days);
    actions.setMeetingLocationOverrides(locationOverrides);
    actions.setMeetingConductorOverrides(conductorOverrides);
    actions.setMeetingColor(color);
    navigation.goBack();
  };

  const updateLocationOverride = (key: string, value: string) => {
    setLocationOverrides((prev) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  };

  const updateConductorOverride = (key: string, value: string) => {
    setConductorOverrides((prev) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  };

  const addDateLocation = (dayOfWeek: number) => {
    setDateLocationKeysByDay((prev) => {
      const current = prev[dayOfWeek] ?? [];
      const nextKey = nextDateForDay(dayOfWeek, current);
      return { ...prev, [dayOfWeek]: [...current, nextKey].sort() };
    });
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
        <Text style={[styles.title, { color: theme.text }]}>{t('meetingSchedule.title')}</Text>
        <Pressable onPress={save} style={[styles.saveBtn, { backgroundColor: theme.accent }]}>
          <Text style={[styles.saveBtnLabel, { color: theme.accentText }]}>{t('meetingSchedule.save')}</Text>
        </Pressable>
      </View>

      <Text style={[styles.intro, { color: theme.secondaryText }]}>
        {t('meetingSchedule.intro', { meeting: t('schedule.meetingForFieldService') })}
      </Text>

      <Text style={[styles.colorLabel, { color: theme.secondaryText }]}>{t('addActivity.colorLabel')}</Text>
      <View style={{ marginBottom: 22 }}>
        <ColorPickerRow theme={theme} value={color} onChange={setColor} noneLabel={t('addActivity.colorNone')} />
      </View>

      {DISPLAY_ORDER.map((dow, i) => {
        const day = days.find((d) => d.dayOfWeek === dow)!;
        return (
          <View
            key={dow}
            style={[styles.dayBlock, i > 0 ? { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth } : null]}
          >
            <View style={styles.dayToggleRow}>
              <Text style={[styles.dayLabel, { color: theme.text }]}>{dayLabel(dow)}</Text>
              <Switch
                value={day.enabled}
                onValueChange={(enabled) => updateDay(dow, { enabled })}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {day.enabled ? (
              <View style={styles.inputsRow}>
                <TimePickerField
                  value={day.time}
                  onChange={(v) => updateDay(dow, { time: v })}
                  placeholder={t('meetingSchedule.timePlaceholder')}
                  theme={theme}
                  locale={locale}
                  uses24HourClock={state.uses24HourClock}
                  compact
                  style={styles.timePicker}
                />
                <TextInput
                  value={day.location}
                  onChangeText={(v) => updateDay(dow, { location: v })}
                  placeholder={t('meetingSchedule.locationPlaceholder')}
                  placeholderTextColor={theme.secondaryText}
                  style={[
                    styles.input,
                    { flex: 1.4, borderColor: theme.border, backgroundColor: theme.card, color: theme.text },
                  ]}
                />
              </View>
            ) : null}

            {day.enabled ? (
              <View style={styles.dateLocations}>
                <View style={styles.dateLocationsHeader}>
                  <Text style={[styles.dateLocationsTitle, { color: theme.secondaryText }]}>
                    {t('meetingSchedule.dateLocationsTitle')}
                  </Text>
                  <Pressable onPress={() => addDateLocation(dow)} hitSlop={6}>
                    <Text style={[styles.addDateLocation, { color: theme.accent }]}>
                      {t('meetingSchedule.addDateLocation')}
                    </Text>
                  </Pressable>
                </View>
                {(dateLocationKeysByDay[dow] ?? []).map((key) => {
                  const overrideDate = parseDateKey(key);
                  return (
                    <View key={key} style={styles.dateOverrideRow}>
                      <Text style={[styles.dateOverrideLabel, { color: theme.secondaryText }]}>
                        {overrideDate.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Text>
                      <View style={styles.dateOverrideInputs}>
                        <TextInput
                          value={locationOverrides[key] ?? ''}
                          onChangeText={(value) => updateLocationOverride(key, value)}
                          placeholder={day.location || t('meetingSchedule.dateLocationPlaceholder')}
                          placeholderTextColor={theme.secondaryText}
                          style={[
                            styles.dateOverrideInput,
                            { borderColor: theme.border, backgroundColor: theme.card, color: theme.text },
                          ]}
                        />
                        <TextInput
                          value={conductorOverrides[key] ?? ''}
                          onChangeText={(value) => updateConductorOverride(key, value)}
                          placeholder={t('meetingSchedule.conductorPlaceholder')}
                          placeholderTextColor={theme.secondaryText}
                          style={[
                            styles.dateOverrideInput,
                            { borderColor: theme.border, backgroundColor: theme.card, color: theme.text },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}
    </KeyboardAvoidingScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  cancel: { fontSize: 14.5 },
  title: { fontSize: 15.5, fontWeight: '700' },
  saveBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18 },
  saveBtnLabel: { fontSize: 13.5, fontWeight: '700' },
  intro: { fontSize: 13, lineHeight: 19, marginBottom: 20 },
  colorLabel: { fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  dayBlock: { paddingVertical: 14 },
  dayToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayLabel: { fontSize: 15, fontWeight: '600' },
  inputsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  timePicker: { flex: 1 },
  input: { borderWidth: 1, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, fontSize: 14 },
  dateLocations: { marginTop: 16, gap: 12 },
  dateLocationsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dateLocationsTitle: { fontSize: 12, fontWeight: '600' },
  addDateLocation: { fontSize: 12.5, fontWeight: '700' },
  dateOverrideRow: { gap: 6 },
  dateOverrideLabel: { fontSize: 12.5, fontWeight: '600' },
  dateOverrideInputs: { gap: 8 },
  dateOverrideInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13.5,
  },
});
