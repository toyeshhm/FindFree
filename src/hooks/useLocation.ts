import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import type { LatLng } from '@/types';

export function useLocation() {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [denied,   setDenied]   = useState(false);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDenied(true);
        return;
      }

      // Get initial position immediately
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);
        
        // Background sync location to database for Push Notification calculations
        const session = useAuthStore.getState().session;
        if (session?.user?.id) {
          supabase.from('user_profiles').update({ lat: coords.lat, lng: coords.lng }).eq('id', session.user.id).then();
        }
      } catch (e) {
        console.warn('Could not get initial position:', e);
      }

      // Start watching position for auto updates in real-time
      try {
        sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 5000,    // Update every 5 seconds
            distanceInterval: 10,  // Or every 10 meters
          },
          (pos) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          }
        );
      } catch (e) {
        console.warn('Could not watch position:', e);
      }
    })();

    return () => {
      if (sub) sub.remove();
    };
  }, []);

  // Fetch current position on demand
  const requestLocation = async (): Promise<LatLng | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDenied(true);
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLocation(coords);
      return coords;
    } catch (e) {
      console.warn('Error fetching manual location:', e);
      return null;
    }
  };

  return { location, denied, requestLocation };
}
