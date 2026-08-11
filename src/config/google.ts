// Google Drive sync is currently disabled — see src/screens/profile/settings-screen.tsx.
/*
// Google OAuth client IDs for "Sync with Google" (Settings > Sync with Google),
// which backs up the app's data to a hidden file in the signed-in user's
// Google Drive (the "appDataFolder" — invisible in the regular Drive UI, and
// scoped so this app can only see files it created itself).
//
// ── Where to get these ──
// 1. Go to https://console.cloud.google.com/ and create (or select) a project.
// 2. "APIs & Services" > "Library" — search for and enable the "Google Drive API".
// 3. "APIs & Services" > "OAuth consent screen" — configure it (External is
//    fine for testing; add yourself as a test user while it's in "Testing"
//    status) and add this scope under "Data access":
//      https://www.googleapis.com/auth/drive.appdata
// 4. "APIs & Services" > "Credentials" > "Create Credentials" > "OAuth client ID".
//    Create one client ID per platform you actually ship — you only need the
//    ones matching the platforms below:
//      - "Web application" — used for the Expo web build. Add both
//        `https://auth.expo.io/@your-expo-username/your-app-slug` (for
//        testing in Expo Go / the AuthSession proxy) and your production web
//        origin as authorized redirect URIs.
//      - "iOS" — bundle ID must exactly match `expo.ios.bundleIdentifier` in
//        app.json.
//      - "Android" — package name must match `expo.android.package` in
//        app.json, and you'll need to register your build's SHA-1
//        certificate fingerprint.
// 5. Paste the resulting client ID(s) below, replacing the "YOUR_..." placeholders.
//    You don't need a client secret — these are PKCE-based public clients.
export const GOOGLE_OAUTH_CLIENT_IDS = {
  ios: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  android: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  web: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
};

// True once at least one placeholder above has been replaced with a real client ID.
export function isGoogleSyncConfigured(): boolean {
  return Object.values(GOOGLE_OAUTH_CLIENT_IDS).some((id) => Boolean(id) && !id.startsWith('YOUR_'));
}
*/
