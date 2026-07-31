import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { AppState } from '../store/types';

export async function exportAppData(state: AppState, dialogTitle: string): Promise<boolean> {
  const json = JSON.stringify(state, null, 2);
  const file = new File(Paths.cache, `field-service-journal-export-${Date.now()}.json`);
  try {
    if (file.exists) file.delete();
    file.create();
    file.write(json);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle });
    }
    return true;
  } catch {
    return false;
  }
}
