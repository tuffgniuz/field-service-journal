import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUi } from '../store/ui-context';
import { fetchCurrentAddress } from '../utils/location';

export function useCurrentLocation(setAddress: (address: string) => void) {
  const { t } = useTranslation();
  const { showToast } = useUi();
  const [locating, setLocating] = useState(false);

  const fetchLocation = async () => {
    setLocating(true);
    try {
      const result = await fetchCurrentAddress();
      if (result) setAddress(result);
      else showToast(t('addContact.locationFailed'));
    } catch {
      showToast(t('addContact.locationFailed'));
    } finally {
      setLocating(false);
    }
  };

  return { locating, fetchLocation };
}
