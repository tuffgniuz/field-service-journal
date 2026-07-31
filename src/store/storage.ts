import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState } from './types';

const STORAGE_KEY = 'field-service-journal.state.v1';

export async function loadState(): Promise<Partial<AppState> | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<AppState>;
  } catch {
    return null;
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // local-first, best-effort persistence — swallow write errors
  }
}

export async function clearState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
