# Field Service Journal

A mobile field service journal for Jehovah's Witnesses to log time, track bible
studies, and generate monthly field service reports. Built with Expo (React
Native) and works on iOS, Android, and web.

## Features

- **Time logging** — log hours via a built-in timer or manual entry, with a
  monthly chart and heatmap view of activity.
- **Bible studies** — keep a contact list of studies with visit history and
  notes per contact.
- **Monthly reports** — auto-generated report summaries with history of past
  months, and optional report translation.
- **Roles & goals** — supports publisher, auxiliary pioneer, regular pioneer,
  and special pioneer roles, each with the correct hour goals (auxiliary
  pioneer: 30 hrs/month, regular pioneer: 600 hrs/service year). Regular
  pioneers can back-fill hours from before they started using the app.
- **Reminders** — local monthly notification reminding you to submit your
  report (works fully offline in Expo Go — no server push involved).
- **Localization** — available in English, Dutch, and Indonesian, following
  the device language by default.
- **Light/dark theme** — follows system appearance or can be set manually.

## Tech stack

- [Expo](https://docs.expo.dev/versions/v54.0.0/) SDK 54 / React Native
- TypeScript
- React Navigation (bottom tabs + native stack)
- `react-i18next` for localization
- `AsyncStorage` for on-device persistence

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/) `10.33.0` (see `packageManager` in `package.json`)
- The [Expo Go](https://expo.dev/go) app on your phone, **matching SDK 54**
  (check the SDK version shown in Expo Go's Profile tab — this project is
  intentionally pinned to SDK 54 and not the latest Expo release)

## Getting started

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm start
```

Then scan the QR code with Expo Go (Android) or the Camera app (iOS), or run
directly on a platform:

```bash
pnpm android   # open on a connected Android device/emulator
pnpm ios       # open on an iOS simulator
pnpm web       # open in a browser
```

## Project structure

```
src/
├── components/   # shared UI components
├── i18n/         # translations (en, nl, id) and locale helpers
├── navigation/    # React Navigation stacks/tabs
├── screens/      # feature screens (log, report, studies, profile, onboarding)
├── store/        # app-wide context/state (AppContext, UiContext)
├── theme/        # light/dark theme definitions
└── utils/        # dates, goals, notifications, report translation, etc.
```

## License

MIT
