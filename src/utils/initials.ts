/** First letter of the first two words (e.g. "Priya Sharma" -> "PS", "Apt 4B" -> "A4"), or the first two characters of a single-word name. */
export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
