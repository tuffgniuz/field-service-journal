import React, { useMemo } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trans, useTranslation } from "react-i18next";
import { useApp } from "../../store/app-context";
import { themeFor } from "../../theme/theme";
import { CameraIcon, SettingsIcon } from "../../components/data-display/icons";
import { ShimmerText } from "../../components/data-display/shimmer-text";
import { PillButton } from "../../components/actions/pill-button";
import { YearHeatmap } from "./year-heatmap";

import { useRoleMeta } from "../../hooks/use-role-meta";
import { INTL_LOCALE_TAGS } from "../../i18n/language";
import { serviceYearContributionWeeks } from "../../store/selectors";
import { fmtHours } from "../../utils/format";
import { hexToRgba } from "../../utils/color";
import { currentServiceYearLabel } from "../../utils/dates";
import { deleteAvatarImage, pickAvatarImage } from "../../utils/avatar";
import {
  auxPioneerProgressFor,
  pioneerGoalFor,
  serviceYearProgressFor,
} from "../../utils/goals";
import type { TabScreenNavProp } from "../../navigation/types";

const COUNTDOWN_KEYS = {
  months: "profile.serviceYearMonthsLeft",
  days: "profile.serviceYearDaysLeft",
  today: "profile.serviceYearToday",
} as const;

export function ProfileScreen({
  navigation,
}: {
  navigation: TabScreenNavProp<"Profile">;
}) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const roleMeta = useRoleMeta();
  const theme = themeFor(state.darkMode);
  const insets = useSafeAreaInsets();
  const locale = INTL_LOCALE_TAGS[state.language];
  const currentYearLabel = currentServiceYearLabel();
  const contributionWeeks = useMemo(
    () => serviceYearContributionWeeks(state, currentYearLabel, locale),
    [state, locale, currentYearLabel],
  );

  const currentMonthName = useMemo(
    () => new Date().toLocaleDateString(locale, { month: "long" }),
    [locale],
  );
  const goal = useMemo(() => pioneerGoalFor(state), [state]);
  const pioneerServiceButtonLabel =
    state.role === "publisher" ? t("profile.startPioneerService") : t("profile.configurePioneerService");
  const progress = useMemo(() => serviceYearProgressFor(state), [state]);
  const auxProgress = useMemo(() => auxPioneerProgressFor(state), [state]);
  const auxPioneerConfigured =
    state.role === "publisher" &&
    (state.auxPioneerSchedule.ongoing ||
      state.auxPioneerSchedule.months.length > 0);
  const auxPioneerCaption = auxPioneerConfigured
    ? state.auxPioneerSchedule.ongoing
      ? t("profile.auxPioneerOngoing")
      : t("profile.auxPioneerSpecificMonths")
    : null;

  const getProgressKey = (remaining: number, target: number, weekly: boolean) => {
    if (remaining <= 0) return "profile.progressReached" as const;
    const logged = target - remaining;
    const ratio = logged / target;

    if (ratio === 0) return "profile.progressNotStarted" as const;
    if (ratio < 0.5) return weekly ? ("profile.progressStartedWeekly" as const) : ("profile.progressStarted" as const);
    if (ratio < 0.9) return weekly ? ("profile.progressHalfwayWeekly" as const) : ("profile.progressHalfway" as const);
    return weekly ? ("profile.progressAlmostWeekly" as const) : ("profile.progressAlmost" as const);
  };

  const onPickAvatar = async () => {
    const uri = await pickAvatarImage(state.avatarUri || undefined);
    if (uri) actions.setAvatarUri(uri);
  };

  const onAvatarPress = () => {
    if (!state.avatarUri) {
      onPickAvatar();
      return;
    }
    Alert.alert(t("profile.profilePhotoAlertTitle"), undefined, [
      { text: t("profile.changePhoto"), onPress: onPickAvatar },
      {
        text: t("profile.removePhoto"),
        style: "destructive",
        onPress: () => {
          deleteAvatarImage(state.avatarUri);
          actions.setAvatarUri("");
        },
      },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={[
        styles.screen,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
      ]}
    >
        <View style={styles.headerRow}>
          <View style={styles.greetingRow}>
            <Text
              style={[styles.title, { color: theme.text }]}
              numberOfLines={1}
            >
              {state.name.trim()
                ? t("profile.greeting", { name: state.name.trim() })
                : t("profile.titleFallback")}
            </Text>
            <Pressable
              onPress={() => navigation.navigate("Settings")}
              hitSlop={8}
              accessibilityLabel={t("profile.settingsAccessibility")}
              style={[styles.settingsBtn, { borderColor: theme.border }]}
            >
              <SettingsIcon color={theme.secondaryText} size={18} />
            </Pressable>
          </View>
          <Text style={[styles.roleSubtitle, { color: theme.secondaryText }]}>
            {state.effectiveRole === "aux_pioneer" &&
            state.auxPioneerSchedule.ongoing
              ? t("roles.regularAuxPioneer")
              : roleMeta[state.effectiveRole]}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            styles.noBorder,
            { backgroundColor: theme.card },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <Pressable
              onPress={onAvatarPress}
              accessibilityLabel={
                state.avatarUri
                  ? t("profile.changeProfilePhotoLabel")
                  : t("profile.addProfilePhoto")
              }
              style={[
                styles.avatar,
                state.avatarUri
                  ? { borderColor: theme.border }
                  : {
                      borderColor: theme.border,
                      borderStyle: "dashed",
                      backgroundColor: theme.card,
                    },
              ]}
            >
              {state.avatarUri ? (
                <Image
                  source={{ uri: state.avatarUri }}
                  style={styles.avatarImage}
                  onError={() => actions.setAvatarUri("")}
                />
              ) : (
                <CameraIcon color={theme.secondaryText} size={20} />
              )}
            </Pressable>

            <View style={styles.cardHeaderText}>
              {goal && (progress || auxProgress) ? (
                <View style={styles.statsRow}>
                  <View style={styles.statBlock}>
                    <ShimmerText
                      style={styles.statValue}
                      color={goal.completedHours > goal.targetHours ? theme.gold : theme.text}
                      active={goal.completedHours > goal.targetHours}
                    >
                      {t("profile.hoursValue", {
                        hours: fmtHours(goal.completedHours),
                      })}
                    </ShimmerText>
                    <Text
                      style={[styles.statLabel, { color: theme.secondaryText }]}
                    >
                      {t("profile.totalHours")}
                    </Text>
                  </View>
                  <View style={styles.statBlock}>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                      {t("profile.hoursValue", {
                        hours: fmtHours(
                          progress
                            ? progress.neededPerMonth
                            : auxProgress!.neededPerWeek,
                        ),
                      })}
                    </Text>
                    <Text
                      style={[styles.statLabel, { color: theme.secondaryText }]}
                    >
                      {t(
                        progress
                          ? "profile.neededPerMonth"
                          : "profile.neededPerWeek",
                      )}
                    </Text>
                  </View>
                  <View style={styles.statBlock}>
                    {(progress ?? auxProgress!).countdown.unit === "today" ? (
                      <Text style={[styles.statValue, { color: theme.text }]}>
                        {t("profile.serviceYearToday")}
                      </Text>
                    ) : (
                      <>
                        <Text style={[styles.statValue, { color: theme.text }]}>
                          {(progress ?? auxProgress!).countdown.value}
                        </Text>
                        <Text
                          style={[styles.statLabel, { color: theme.secondaryText }]}
                        >
                          {t(
                            COUNTDOWN_KEYS[
                              (progress ?? auxProgress!).countdown.unit
                            ],
                            {
                              count: (progress ?? auxProgress!).countdown.value,
                            },
                          )}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              ) : (
                <>
                  {goal ? (
                    <Text
                      style={[styles.cardHeaderTitle, { color: theme.text }]}
                    >
                      {t(
                        goal.kind === "monthly"
                          ? "profile.monthlyGoalTitle"
                          : "profile.yearlyGoalTitle",
                      )}
                    </Text>
                  ) : null}
                  {auxPioneerCaption ? (
                    <Text
                      style={[
                        styles.cardHeaderCaption,
                        { color: theme.secondaryText },
                      ]}
                    >
                      {auxPioneerCaption}
                    </Text>
                  ) : null}
                </>
              )}
            </View>

            {!goal ? (
              <Pressable
                onPress={() => navigation.navigate("PioneerService")}
                hitSlop={8}
                accessibilityLabel={pioneerServiceButtonLabel}
                style={[
                  styles.auxActionBtn,
                  { borderColor: theme.accent, backgroundColor: theme.accent },
                ]}
              >
                <Text
                  style={[styles.auxActionLabel, { color: theme.accentText }]}
                >
                  {pioneerServiceButtonLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {goal ? (
            <>
              <View style={[styles.goalSummaryRow, { marginTop: 20 }]}>
                <Text style={[styles.goalSummary, { color: theme.text }]}>
                  <Trans
                    i18nKey={getProgressKey(
                      goal.remainingHours,
                      goal.targetHours,
                      Boolean(auxProgress),
                    )}
                    values={{
                      count: auxProgress ? auxProgress.neededPerWeek : goal.remainingHours,
                    }}
                    components={{
                      highlight: (
                        <Text
                          style={{ color: theme.gold, fontWeight: "600" }}
                        />
                      ),
                    }}
                  />
                </Text>
                {auxProgress ? (
                  <View
                    style={[
                      styles.monthChip,
                      { backgroundColor: hexToRgba(theme.gold, 0.16) },
                    ]}
                  >
                    <Text style={[styles.monthChipLabel, { color: theme.gold }]}>
                      {currentMonthName}
                    </Text>
                  </View>
                ) : null}
              </View>
              {goal.kind === "yearly" ? (
                <Text
                  style={[styles.goalCaption, { color: theme.secondaryText }]}
                >
                  {t("profile.serviceYearCaption", {
                    year: goal.serviceYearLabel,
                  })}
                </Text>
              ) : null}
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: theme.border, marginTop: 12 },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.gold,
                      width: `${Math.min(100, (goal.completedHours / goal.targetHours) * 100)}%`,
                    },
                  ]}
                />
              </View>

              <PillButton
                label={t("profile.configurePioneerService")}
                onPress={() => navigation.navigate("PioneerService")}
                theme={theme}
                style={{ marginTop: 16 }}
              />
            </>
          ) : null}
        </View>

        <View
          style={[
            styles.card,
            styles.heatmapCard,
            { borderColor: theme.border },
          ]}
        >
          <YearHeatmap theme={theme} weeks={contributionWeeks} />
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 16 },
  headerRow: {
    marginBottom: 24,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.2,
    flex: 1,
    marginRight: 12,
  },
  roleSubtitle: { fontSize: 14, marginTop: 4 },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 28 },
  noBorder: { borderWidth: 0 },
  heatmapCard: { marginBottom: 0 },
  cardHeaderRow: { flexDirection: "row", alignItems: "center" },
  cardHeaderText: { flex: 1, marginLeft: 14 },
  cardHeaderTitle: { fontSize: 14.5, fontWeight: "600" },
  cardHeaderCaption: { fontSize: 12, marginTop: 3 },
  configureRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  auxActionBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  auxActionLabel: { fontSize: 12.5, fontWeight: "700" },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  goalSummaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  goalSummary: { flex: 1, fontSize: 13.5, fontWeight: "500" },
  goalCaption: { fontSize: 12, marginTop: 4 },
  monthChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  monthChipLabel: { fontSize: 12.5, fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    gap: 14,
  },
  statBlock: { alignItems: "flex-start" },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    includeFontPadding: false,
    textAlign: "left",
  },
  statLabel: { fontSize: 10.5, marginTop: 2, textAlign: "left" },
});
