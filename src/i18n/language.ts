import * as Localization from 'expo-localization';
import type { AppLanguage } from '../store/types';

export const SUPPORTED_LANGUAGES: AppLanguage[] = ['en', 'nl', 'id'];

export const LANGUAGE_NATIVE_NAMES: Record<AppLanguage, string> = {
  en: 'English',
  nl: 'Nederlands',
  id: 'Bahasa Indonesia',
};

/** BCP-47 tags used for date/number formatting per language. */
export const INTL_LOCALE_TAGS: Record<AppLanguage, string> = {
  en: 'en-US',
  nl: 'nl-NL',
  id: 'id-ID',
};

/** Picks the first supported language out of an ordered locale list, or 'en' if none match. */
export function pickSupportedLanguage(locales: { languageCode: string | null }[]): AppLanguage {
  for (const locale of locales) {
    const code = locale.languageCode?.toLowerCase();
    const match = SUPPORTED_LANGUAGES.find((lang) => lang === code);
    if (match) return match;
  }
  return 'en';
}

/** Reads the device's locale list and returns the first supported language, or 'en' if none match. */
export function resolveDeviceLanguage(): AppLanguage {
  return pickSupportedLanguage(Localization.getLocales());
}
