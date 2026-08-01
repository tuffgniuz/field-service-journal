import * as Location from 'expo-location';

/**
 * Requests foreground location permission, reads the device's current
 * position, and reverse-geocodes it into a short human-readable address
 * ("123 Main St, Springfield"). Returns null if permission is denied or no
 * address could be resolved — callers should fall back to letting the user
 * type the address by hand either way.
 */
export async function fetchCurrentAddress(): Promise<string | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const [place] = await Location.reverseGeocodeAsync({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });
  if (!place) return null;

  const streetLine = [place.streetNumber, place.street].filter(Boolean).join(' ');
  const parts = [streetLine, place.city, place.region].filter((p): p is string => Boolean(p && p.trim()));
  return parts.length ? parts.join(', ') : null;
}
