/**
 * Free machine translation via the MyMemory API (no API key, ~5000 words/day
 * per IP on the anonymous tier — plenty for occasionally translating a short
 * report preview). https://mymemory.translated.net/
 */
export async function translateText(text: string, from: string, to: string): Promise<string> {
  const langpair = `${from}|${to}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translation request failed (${res.status})`);
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  if (typeof translated !== 'string' || !translated.trim()) throw new Error('No translation returned');
  return translated;
}
