import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';

/**
 * Copies the picked library asset into the app's document directory under a
 * unique filename, since the picker's own `uri` may point to a cache/temp
 * location that isn't guaranteed to survive an app restart.
 */
export async function pickAvatarImage(previousUri?: string): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const dest = new File(Paths.document, `avatar-${Date.now()}.jpg`);
  new File(result.assets[0].uri).copy(dest);

  if (previousUri) deleteAvatarImage(previousUri);
  return dest.uri;
}

export function deleteAvatarImage(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // no-op — file may already be gone
  }
}
