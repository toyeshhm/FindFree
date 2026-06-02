import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import type { LatLng } from '@/types';

export function useLocation() {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [denied,   setDenied]   = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setDenied(true); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    })();
  }, []);

  return { location, denied };
}
