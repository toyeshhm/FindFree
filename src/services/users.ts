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
    const { error } = await supabase
      .from('user_profiles')
      .update({ name: patch.name, avatar_url: patch.avatarUrl })
      .eq('id', userId);
    if (error) throw error;
  },
};
