import { Linking, Platform, Share } from 'react-native';

async function tryOpen(url: string): Promise<boolean> {
  // Prefer a direct openURL attempt over gating on canOpenURL: on Android,
  // canOpenURL under-reports custom schemes (whatsapp/tg) unless the host app
  // declares <queries> for them, even when the target app is installed and
  // opening would succeed. openURL still throws cleanly if nothing can handle it.
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function shareViaSystemSheet(text: string, title: string): Promise<'shared' | 'dismissed' | 'error'> {
  try {
    const result = await Share.share(Platform.OS === 'ios' ? { message: text } : { message: text, title });
    return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
  } catch {
    return 'error';
  }
}

export async function shareViaWhatsapp(text: string, phone?: string): Promise<boolean> {
  const digits = phone ? phone.replace(/[^\d+]/g, '') : '';
  const url = digits
    ? `whatsapp://send?phone=${encodeURIComponent(digits)}&text=${encodeURIComponent(text)}`
    : `whatsapp://send?text=${encodeURIComponent(text)}`;
  return tryOpen(url);
}

export async function shareViaTelegram(text: string): Promise<boolean> {
  const ok = await tryOpen(`tg://msg?text=${encodeURIComponent(text)}`);
  if (ok) return true;
  return tryOpen(`https://t.me/share/url?text=${encodeURIComponent(text)}`);
}

export async function shareViaSms(text: string, phone?: string): Promise<boolean> {
  const sep = Platform.OS === 'ios' ? '&' : '?';
  const url = `sms:${phone ?? ''}${sep}body=${encodeURIComponent(text)}`;
  return tryOpen(url);
}

export async function shareViaEmail(text: string, email?: string, subject = 'Field service report'): Promise<boolean> {
  const url = `mailto:${email ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  return tryOpen(url);
}
