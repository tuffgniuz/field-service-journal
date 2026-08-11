import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/app-context';
import { themeFor } from '../../theme/theme';
import { CheckIcon, ChevronRightIcon, StarIcon } from '../../components/data-display/icons';
import {
  LFF_SECTION_COUNT,
  LFF_SECTION_RANGES,
  lffLessonTitle,
  publicationTitle,
  sectionProgress,
  studyItemsForPublication,
  studyProgressSummary,
  type StudyItem,
} from '../../utils/publications';
import type { RootNavProp, RootStackParamList } from '../../navigation/types';

export function StudyProgressScreen({
  navigation,
  route,
}: {
  navigation: RootNavProp;
  route: RouteProp<RootStackParamList, 'StudyProgress'>;
}) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const theme = themeFor(state.darkMode);
  const insets = useSafeAreaInsets();
  const { contactId } = route.params;
  const contact = state.contacts.find((c) => c.id === contactId);

  const items = useMemo(
    () => (contact?.publication ? studyItemsForPublication(contact.publication) : []),
    [contact?.publication]
  );
  const completedSet = useMemo(() => new Set(contact?.studyProgress ?? []), [contact?.studyProgress]);
  const summary = useMemo(() => studyProgressSummary(items, contact?.studyProgress ?? []), [items, contact?.studyProgress]);

  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>(() => ({
    [summary.currentSection]: true,
  }));

  if (!contact || !contact.publication || items.length === 0) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.bg, padding: 24, paddingTop: insets.top + 24 }]}>
        <Text style={{ color: theme.text }}>{t('contactDetail.notFound')}</Text>
      </View>
    );
  }

  const toggleSection = (section: number) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityLabel={t('common.back')}>
          <Text style={[styles.back, { color: theme.text }]}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
      </View>

      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {contact.name}
          </Text>
          <Text style={[styles.publicationLabel, { color: theme.secondaryText }]} numberOfLines={1}>
            {publicationTitle(contact.publication, state.language)}
          </Text>
        </View>
        <View style={[styles.lessonBadge, { backgroundColor: theme.accent }]}>
          <Text style={[styles.lessonBadgeText, { color: theme.accentText }]}>
            {t('studyProgress.lessonOfTotal', { current: summary.currentLessonNumber, total: summary.totalLessons })}
          </Text>
        </View>
      </View>

      <Text style={[styles.percentText, { color: theme.secondaryText }]}>
        {t('studyProgress.percentComplete', { percent: summary.percent })}
      </Text>
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <View style={[styles.progressFill, { width: `${summary.percent}%`, backgroundColor: theme.accent }]} />
      </View>

      {Array.from({ length: LFF_SECTION_COUNT }, (_, i) => i + 1).map((section) => {
        const [start, end] = LFF_SECTION_RANGES[section];
        const sectionItems = items.filter((i) => i.section === section);
        const progress = sectionProgress(items, contact.studyProgress, section);
        const expanded = !!expandedSections[section];

        return (
          <View key={section} style={[styles.sectionBlock, { borderColor: theme.border }]}>
            <Pressable onPress={() => toggleSection(section)} style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>
                  {t('studyProgress.sectionLabel', { n: section })}
                </Text>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {t('studyProgress.lessonsRange', { start, end })}
                </Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: theme.pageBg }]}>
                <Text style={[styles.countBadgeText, { color: theme.text }]}>
                  {progress.done}/{progress.total}
                </Text>
              </View>
              <View style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }], marginLeft: 8 }}>
                <ChevronRightIcon color={theme.secondaryText} size={15} />
              </View>
            </Pressable>

            {expanded
              ? sectionItems.map((item) => {
                  const done = completedSet.has(item.id);
                  const isNext = item.id === summary.nextItemId;
                  const label =
                    item.kind === 'review'
                      ? t('studyProgress.sectionReview', { n: item.section })
                      : `${item.lesson}. ${lffLessonTitle(item.lesson!, state.language)}`;

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => actions.toggleStudyItem(contact.id, item.id)}
                      style={styles.itemRow}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: done ? theme.accent : theme.border,
                            backgroundColor: done ? theme.accent : 'transparent',
                          },
                        ]}
                      >
                        {done ? (
                          <CheckIcon color={theme.accentText} size={11} />
                        ) : item.kind === 'review' ? (
                          <StarIcon color={theme.gold} size={12} />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.itemLabel,
                          {
                            color: done ? theme.secondaryText : theme.text,
                            textDecorationLine: done ? 'line-through' : 'none',
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {label}
                      </Text>
                      {isNext ? (
                        <View style={[styles.nextBadge, { backgroundColor: theme.accent }]}>
                          <Text style={[styles.nextBadgeText, { color: theme.accentText }]}>
                            {t('studyProgress.next')}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })
              : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 24, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  back: { fontSize: 22, lineHeight: 22 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
  name: { fontSize: 19, fontWeight: '700' },
  publicationLabel: { fontSize: 13, marginTop: 3 },
  lessonBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14 },
  lessonBadgeText: { fontSize: 11.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  percentText: { fontSize: 12.5, fontWeight: '600', marginBottom: 8 },
  progressTrack: { height: 7, borderRadius: 3.5, overflow: 'hidden', marginBottom: 26 },
  progressFill: { height: 7, borderRadius: 3.5 },
  sectionBlock: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  sectionTitle: { fontSize: 15.5, fontWeight: '700' },
  countBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
  countBadgeText: { fontSize: 12, fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { flex: 1, fontSize: 14, lineHeight: 19 },
  nextBadge: { paddingVertical: 4, paddingHorizontal: 9, borderRadius: 9 },
  nextBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
});
