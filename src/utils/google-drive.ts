// Google Drive sync is currently disabled — see src/screens/profile/settings-screen.tsx.
/*
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Google Drive sync (Settings > Sync with Google): backs up the app's data
 * as a single JSON file in the signed-in user's Drive "appDataFolder" — a
 * hidden, per-app storage space (invisible in the regular Drive UI, and
 * scoped so this app can only ever see files it created itself).
 *
 * OAuth token exchange itself lives in `hooks/use-google-drive-sync.ts`
 * (it needs `expo-auth-session`'s React hook); this file only holds the
 * REST calls made once we already have an access token, plus token storage.
 *

// expo-secure-store has no web implementation at all (its web module is a
// no-op stub), so every call throws there. There's no OS keychain in a
// browser anyway, so fall back to AsyncStorage on web and keep the real
// secure keychain/keystore on native.
const tokenStore = Platform.OS === 'web'
  ? { getItemAsync: AsyncStorage.getItem, setItemAsync: AsyncStorage.setItem, deleteItemAsync: AsyncStorage.removeItem }
  : SecureStore;

const TOKENS_KEY = 'google_drive_tokens';
const BACKUP_FILENAME = 'field-service-journal-backup.json';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';
const DRIVE_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files';
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  // Epoch ms the access token expires at.
  expiresAt: number;
}

export async function storeTokens(accessToken: string, refreshToken: string, expiresInSec: number): Promise<void> {
  const tokens: StoredTokens = { accessToken, refreshToken, expiresAt: Date.now() + expiresInSec * 1000 };
  await tokenStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
}

async function readTokens(): Promise<StoredTokens | null> {
  const raw = await tokenStore.getItemAsync(TOKENS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await tokenStore.deleteItemAsync(TOKENS_KEY);
}

// Best-effort revoke with Google, so the app also disappears from the user's "third-party access" list. Safe to ignore failures — we clear local tokens regardless.
export async function revokeTokens(): Promise<void> {
  const tokens = await readTokens();
  if (!tokens) return;
  try {
    await fetch(`${REVOKE_ENDPOINT}?token=${encodeURIComponent(tokens.refreshToken)}`, { method: 'POST' });
  } catch {
    // no-op — local disconnect still proceeds
  }
}

async function refreshAccessToken(clientId: string, refreshToken: string): Promise<StoredTokens | null> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const tokens: StoredTokens = {
    accessToken: json.access_token,
    refreshToken, // Google doesn't reissue the refresh token on refresh
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  await tokenStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
  return tokens;
}

// A valid (non-expired) access token, refreshing first if needed. Null if never connected or the refresh failed (e.g. access was revoked externally).
export async function getValidAccessToken(clientId: string): Promise<string | null> {
  const tokens = await readTokens();
  if (!tokens) return null;
  // Refresh a little before actual expiry so an in-flight request doesn't land right as it lapses.
  if (Date.now() < tokens.expiresAt - 60_000) return tokens.accessToken;
  const refreshed = await refreshAccessToken(clientId, tokens.refreshToken);
  return refreshed?.accessToken ?? null;
}

export async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  const res = await fetch(USERINFO_ENDPOINT, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.email ?? null;
}

async function findBackupFileId(accessToken: string): Promise<string | null> {
  const query = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name = '${BACKUP_FILENAME}'`,
    fields: 'files(id)',
  });
  const res = await fetch(`${DRIVE_FILES_ENDPOINT}?${query.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to look up existing backup');
  const json = await res.json();
  return json.files?.[0]?.id ?? null;
}

// Uploads `data` as the backup file, creating it in the appDataFolder on first sync or overwriting it on later ones.
export async function uploadBackup(accessToken: string, data: unknown): Promise<void> {
  const body = JSON.stringify(data);
  const existingId = await findBackupFileId(accessToken);

  if (existingId) {
    const res = await fetch(`${DRIVE_UPLOAD_ENDPOINT}/${existingId}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body,
    });
    if (!res.ok) throw new Error('Failed to update backup');
    return;
  }

  const boundary = 'fsj-backup-boundary';
  const metadata = JSON.stringify({ name: BACKUP_FILENAME, parents: ['appDataFolder'] });
  const multipartBody =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n` +
    `--${boundary}--`;

  const res = await fetch(`${DRIVE_UPLOAD_ENDPOINT}?uploadType=multipart`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipartBody,
  });
  if (!res.ok) throw new Error('Failed to create backup');
}

// The backed-up data, or null if nothing has been synced from any device yet.
export async function downloadBackup(accessToken: string): Promise<unknown | null> {
  const fileId = await findBackupFileId(accessToken);
  if (!fileId) return null;
  const res = await fetch(`${DRIVE_FILES_ENDPOINT}/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to download backup');
  return res.json();
}
*/
