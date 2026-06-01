import { createClient } from '@supabase/supabase-js';
import { storage } from './storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: {
        getItem:    (key) => storage.getItem(key),
        setItem:    (key, value) => { storage.setItem(key, value); },
        removeItem: (key) => { storage.removeItem(key); },
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
