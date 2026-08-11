import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { getContentUriAsync } from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import type { ServiceAreaFile } from '../store/types';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

function extensionFor(name: string, mimeType: string | null | undefined): 'pdf' | 'jpg' | 'png' {
  const fromName = name.split('.').pop()?.toLowerCase();
  if (fromName === 'pdf' || fromName === 'jpg' || fromName === 'png') return fromName;
  if (fromName === 'jpeg') return 'jpg';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'image/png') return 'png';
  return 'jpg';
}

function mimeTypeFor(extension: string): string {
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'png') return 'image/png';
  return 'image/jpeg';
}

/**
 * Opens the OS file picker restricted to PDF/JPG/PNG and reads the picked
 * file's content into a `ServiceAreaFile` with the raw bytes base64-encoded
 * inline (see the field's doc comment in store/types.ts for why: filesystem/
 * blob URIs the picker returns aren't guaranteed to still resolve later).
 *
 * Reading the bytes is platform-split because `expo-file-system`'s `File`
 * class has no web implementation at all (it's a no-op stub there — see
 * node_modules/expo-file-system/src/ExpoFileSystem.web.ts), while
 * expo-document-picker's web picker conveniently already hands back a
 * `base64` data URI directly (via `FileReader.readAsDataURL`) since it reads
 * through the browser's native `<input type="file">` instead.
 */
export async function pickServiceAreaFile(): Promise<ServiceAreaFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ALLOWED_MIME_TYPES,
    copyToCacheDirectory: true,
    base64: true, // web-only option; harmless elsewhere
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const extension = extensionFor(asset.name, asset.mimeType);
  const mimeType = asset.mimeType || mimeTypeFor(extension);

  const base64 =
    Platform.OS === 'web' && asset.base64
      ? asset.base64.split(',').pop() ?? asset.base64 // strip the "data:<mime>;base64," prefix readAsDataURL adds
      : await new File(asset.uri).base64();

  return { base64, mimeType, extension, name: asset.name, uploadedAt: new Date().toISOString() };
}

/** A `data:` URI for direct display — works for both `<Image source={{uri}}>` and an inline web `<iframe>`. */
export function serviceAreaDataUri(file: ServiceAreaFile): string {
  return `data:${file.mimeType};base64,${file.base64}`;
}

/**
 * Native only (the `File`/`Paths` API doesn't exist on web — see the note
 * above). Writes the file to a fresh temp cache file, since previewing it
 * needs a real file/content URI rather than a `data:` URI — WebView's `uri`
 * loader isn't guaranteed to accept arbitrarily large data URIs, and Android
 * VIEW intents require a content:// URI regardless.
 */
function writeServiceAreaTempFile(file: ServiceAreaFile): File {
  const temp = new File(Paths.cache, `service-area-view-${Date.now()}.${file.extension}`);
  if (temp.exists) temp.delete();
  temp.create();
  temp.write(file.base64, { encoding: 'base64' });
  return temp;
}

/**
 * iOS only. WKWebView (which `react-native-webview` wraps) renders PDFs
 * natively when pointed at a local file, so the screen just embeds a WebView
 * with this as its `source.uri` — a real inline preview, not a share sheet.
 */
export function serviceAreaTempFileUri(file: ServiceAreaFile): string {
  return writeServiceAreaTempFile(file).uri;
}

/**
 * Android only. The stock Android WebView has no built-in PDF renderer (it's
 * a well-known gap — unlike iOS's WKWebView), so instead of embedding one, we
 * hand the file to the OS with a VIEW intent — the same "open with a viewer
 * app" flow used system-wide, distinct from (and more useful than) a share
 * sheet since it actually previews the document.
 */
export async function viewServiceAreaFileAndroid(file: ServiceAreaFile): Promise<void> {
  const temp = writeServiceAreaTempFile(file);
  const contentUri = await getContentUriAsync(temp.uri);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
    type: file.mimeType,
  });
}
