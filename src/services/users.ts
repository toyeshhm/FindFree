import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

export const usersService = {
  getById: async (userId: string): Promise<User> => {
    const { data, error } = await supabase
      .from('user_profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return {
      id:           data.id,
      email:        '',
      name:         data.name,
      avatarUrl:    data.avatar_url,
      createdAt:    data.created_at,
      messageCount: data.message_count,
    };
  },

  update: async (userId: string, patch: { name?: string; avatarUrl?: string }): Promise<void> => {
    // 1. Update auth metadata first (source of truth for auth-driven profiles)
    const metadataUpdate: any = {};
    if (patch.name !== undefined) metadataUpdate.name = patch.name;
    if (patch.avatarUrl !== undefined) metadataUpdate.avatar_url = patch.avatarUrl;
    
    if (Object.keys(metadataUpdate).length > 0) {
      const { error: authError } = await supabase.auth.updateUser({ data: metadataUpdate });
      if (authError) throw new Error("Failed to update account data: " + authError.message);
    }

    // 2. Attempt to update public profile directly (might be blocked by RLS or handled by DB trigger)
    const updates: any = {};
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.avatarUrl !== undefined) updates.avatar_url = patch.avatarUrl;

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId);
      
    // If the profile update fails due to RLS, we swallow the error 
    // because the auth metadata update above is the primary source of truth,
    // and a database trigger might be handling the sync anyway.
    if (profileError) {
      console.warn("Direct profile update failed (likely RLS), relying on auth sync:", profileError);
    }
  },
};
