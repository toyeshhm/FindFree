import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthStore {
  session: Session | null;
  user: User | null;
  isGuest: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setGuest: (isGuest: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  session:  null,
  user:     null,
  isGuest:  false,
  setSession: (session) => set({ session }),
  setUser:    (user) => set({ user }),
  setGuest:   (isGuest) => set({ isGuest }),
  signOut: async () => {
    try { await supabase.auth.signOut(); }
    finally { set({ session: null, user: null, isGuest: false }); }
  },
}));
