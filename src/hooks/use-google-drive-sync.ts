// Google Drive sync is currently disabled — see src/screens/profile/settings-screen.tsx.
/*
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useApp } from '../store/app-context';
import { GOOGLE_OAUTH_CLIENT_IDS, isGoogleSyncConfigured } from '../config/google';
import {
  clearTokens,
  downloadBackup,
  fetchGoogleEmail,
  getValidAccessToken,
  revokeTokens,
  storeTokens,
  uploadBackup,
} from '../utils/google-drive';

// Required once at module load so the OAuth browser tab/sheet can hand control back to the app.
WebBrowser.maybeCompleteAuthSession();

const DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// appdata-only: this app can only ever see files it created itself, never the
// user's other Drive contents. userinfo.email is just to show which account is connected.
const SCOPES = ['https://www.googleapis.com/auth/drive.appdata', 'https://www.googleapis.com/auth/userinfo.email'];

function clientIdForPlatform(): string {
  return (
    Platform.select({
      ios: GOOGLE_OAUTH_CLIENT_IDS.ios,
      android: GOOGLE_OAUTH_CLIENT_IDS.android,
      default: GOOGLE_OAUTH_CLIENT_IDS.web,
    }) ?? GOOGLE_OAUTH_CLIENT_IDS.web
  );
}

export type GoogleSyncStatus = 'idle' | 'connecting' | 'syncing';

// Drives the whole "Sync with Google" feature: connecting a Google account
// (OAuth + Drive appdata scope), manual sync-now, and disconnecting. Backup
// content is the app's full local state, JSON-encoded — same shape as the
// existing local "Export data" feature.
export function useGoogleDriveSync() {
  const { state, actions } = useApp();
  const [status, setStatus] = useState<GoogleSyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] = useState<unknown | null>(null);
  const clientId = clientIdForPlatform();
  const redirectUri = AuthSession.makeRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      // Forces Google to reissue a refresh token every time, not just on the very first-ever consent.
      extraParams: { access_type: 'offline', prompt: 'consent' },
    },
    DISCOVERY
  );

  const syncNow = useCallback(async () => {
    setStatus('syncing');
    setError(null);
    try {
      const token = await getValidAccessToken(clientId);
      if (!token) throw new Error('not-connected');
      await uploadBackup(token, state);
      actions.setLastGoogleSyncAt(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStatus('idle');
    }
  }, [clientId, state, actions]);

  // Guards against re-handling the same OAuth response across re-renders.
  const handledCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!response || response.type !== 'success') return;
    const code = response.params.code;
    if (!code || handledCodeRef.current === code) return;
    handledCodeRef.current = code;

    (async () => {
      setStatus('connecting');
      setError(null);
      try {
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId,
            code,
            redirectUri,
            extraParams: request?.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
          },
          DISCOVERY
        );
        if (!tokenResult.accessToken || !tokenResult.refreshToken) {
          throw new Error('missing-refresh-token');
        }
        await storeTokens(tokenResult.accessToken, tokenResult.refreshToken, tokenResult.expiresIn ?? 3600);
        const email = await fetchGoogleEmail(tokenResult.accessToken);
        actions.setGoogleAccount({ email: email ?? '', connectedAt: new Date().toISOString() });

        // If a backup already exists (e.g. from another device), let the caller decide
        // whether to restore it rather than silently overwriting it with local data.
        const existing = await downloadBackup(tokenResult.accessToken);
        if (existing) setPendingRestore(existing);
        else await syncNow();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setStatus('idle');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const connect = useCallback(async () => {
    if (!isGoogleSyncConfigured()) {
      setError('not-configured');
      return;
    }
    setError(null);
    await promptAsync();
  }, [promptAsync]);

  const disconnect = useCallback(async () => {
    try {
      await revokeTokens();
      await clearTokens();
    } catch {
      // Falls through — the user should always be able to disconnect locally
      // even if the network revoke or token-store cleanup unexpectedly fails.
    }
    actions.setGoogleAccount(null);
    actions.setLastGoogleSyncAt(null);
  }, [actions]);

  const restoreFromDrive = useCallback(() => {
    if (pendingRestore) actions.restoreFromGoogleBackup(pendingRestore);
    setPendingRestore(null);
  }, [pendingRestore, actions]);

  const keepLocalData = useCallback(async () => {
    setPendingRestore(null);
    await syncNow();
  }, [syncNow]);

  return {
    configured: isGoogleSyncConfigured(),
    connected: Boolean(state.googleAccount),
    account: state.googleAccount,
    lastSyncedAt: state.lastGoogleSyncAt,
    status,
    error,
    pendingRestore,
    connect,
    syncNow,
    disconnect,
    restoreFromDrive,
    keepLocalData,
  };
}
*/
