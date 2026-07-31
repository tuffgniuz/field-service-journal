# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

Note: this project is intentionally pinned to SDK 54, not the latest Expo SDK. Expo Go
only supports the SDK version of whatever build the user has installed, and that lags
behind (sometimes by several major SDKs) what's newest on npm. Before changing the SDK
version, check the SDK number actually shown in the user's Expo Go app (Profile tab in
the app) rather than assuming the latest npm release is installable — do not just
`expo install`/upgrade to latest without confirming this first.

If reproducing `expo start` locally in a network-sandboxed environment, note that the
CLI does a network call (dependency-version validation against Expo's API) that a
restrictive egress allowlist can block outright, crashing the whole command instead of
degrading gracefully. Set `EXPO_OFFLINE=1` to skip that check. This is a sandbox-only
workaround — the end user's own machine has normal internet access and does not need it.

Two more Expo-Go-specific gotchas that cost real debugging time here:

- `android.softwareKeyboardLayoutMode` (or any other native AndroidManifest/Info.plist
  config in app.json) has NO EFFECT inside Expo Go — Expo Go ships a fixed native
  binary; app.json's native config only applies once you do a real prebuild/EAS build.
  Don't reach for it as a fix while the user is testing via Expo Go. Handle keyboard
  avoidance entirely in JS instead (KeyboardAvoidingView with an explicit `behavior`,
  never `undefined` on Android, since `undefined` does nothing without native config).
- React Navigation's `presentation: 'transparentModal'` (and `'modal'`) render as a
  separate native surface on Android that does not reliably participate in the app's
  normal keyboard-resize/pan behavior, so KeyboardAvoidingView inside one of these
  routes can silently fail to do anything on Android. If a screen needs to both look
  like a bottom sheet AND contain a text input, don't make it a stacked modal route —
  render it as a plain in-screen overlay (conditional View, not a navigator screen)
  instead. See ManualEntrySheet for the pattern.
- i18n: English/Dutch/Indonesian via `react-i18next`, set up in `src/i18n/`. Device
  language is detected with `expo-localization` and mapped to a supported language
  (falling back to English) — see `src/i18n/language.ts`. `languagePreference`
  (`'system'|'en'|'nl'|'id'`) is persisted on `AppState` exactly like
  `themePreference`; the resolved `language` is a derived field on `RuntimeState`,
  computed in `AppContext.tsx` and kept in sync with the `i18next` singleton via a
  `useEffect`. All UI strings live in `src/i18n/locales/{en,nl,id}.ts`, typed against
  `en.ts` as the source of truth (`src/i18n/i18next.d.ts`) so a missing translation key
  fails `tsc`, not just at runtime. Role/status enum labels are NOT static — they're
  hooks (`useRoleMeta`/`useStatusMeta` in `src/i18n/labels.ts`) since they depend on
  the current language. Code that needs to build translated strings outside of a React
  component (`utils/report.ts`, `store/AppContext.tsx`'s notification scheduling) uses
  the `i18next` singleton's `.t()` directly rather than the `useTranslation()` hook.
  Date/number locale formatting (`toLocaleDateString`, weekday initials) is threaded
  through as an explicit `locale` string param (see `INTL_LOCALE_TAGS` in
  `src/i18n/language.ts`) rather than ever hardcoding `'en-US'`.
- `expo-notifications`: remote/server push notifications were removed from Expo Go on
  Android starting SDK 53 — but **local scheduled notifications (no server involved)
  still work fine in Expo Go on both iOS and Android**. The monthly report reminder
  (`src/utils/notifications.ts`) is a local notification scheduled on-device with a
  `SchedulableTriggerInputTypes.MONTHLY` trigger, so this limitation doesn't apply to
  it. If this project ever needs actual remote push (e.g. server-triggered alerts),
  that will require an EAS/dev-client build, not Expo Go. All notification calls are
  also guarded with `Platform.OS === 'web'` no-ops since scheduling isn't reliably
  supported by `react-native-web`.
- Report translation (`src/utils/translate.ts`): uses the free, keyless MyMemory API
  (~5000 words/day per IP on the anonymous tier). This sandbox's network egress
  allowlist blocks `api.mymemory.translated.net`, so a live translate call always fails
  here with a cert/network error — that's expected and is exactly the graceful-failure
  path being exercised (toast + no crash), not a real bug. The actual success path can
  only be confirmed on a device with normal internet access. Deliberately avoided the
  unofficial/scraped Google Translate endpoint some libraries use — its own maintainers
  flag it as not-fully-legal for anything beyond prototyping, which doesn't fit a real
  app someone keeps using.
- Service year (`src/utils/dates.ts`: `serviceYearLabel`/`serviceYearRange`): JW service
  years run Sep 1 – Aug 31 and are labeled by the year they *end* in (Sep 2025–Aug 2026
  is "service year 2026"). Pioneer hour goals live in `src/utils/goals.ts` — auxiliary
  pioneer is 30 hrs/calendar-month, regular pioneer is 600 hrs/service-year. Publisher
  and special pioneer intentionally have no goal defined (`pioneerGoalFor` returns
  `null`) since no target was ever specified for them — don't invent one. A regular
  pioneer can back-fill hours already done before they started using the app via
  `serviceYearStartingHours`/`serviceYearStartingHoursYear` (Settings, shown only for
  that role) — the year tag is what makes the offset stop applying once a new service
  year begins, so don't strip that tagging logic out even though it looks redundant.
