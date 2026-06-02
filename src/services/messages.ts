import { supabase } from '@/lib/supabase';
import type { Conversation, Message } from '@/types';

export const messagesService = {
  getConversations: async (userId: string): Promise<Conversation[]> => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id, item_id, requester_id, poster_id,
        last_message, last_message_at, unread_count, updated_at,
        item:items(title, photo_urls),
        requester:user_profiles!conversations_requester_id_fkey(id, name, avatar_url),
        poster:user_profiles!conversations_poster_id_fkey(id, name, avatar_url)
      `)
      .or(`requester_id.eq.${userId},poster_id.eq.${userId}`)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data as any[]).map((row) => {
      const otherUser = row.requester_id === userId ? row.poster : row.requester;
      return {
        id:             row.id,
        itemId:         row.item_id,
        item:           { title: row.item?.title, photoUrls: row.item?.photo_urls ?? [] },
        otherUser:      { id: otherUser.id, name: otherUser.name, avatarUrl: otherUser.avatar_url },
        participantIds: [row.requester_id, row.poster_id],
        lastMessage:    row.last_message,
        lastMessageAt:  row.last_message_at,
        unreadCount:    row.unread_count,
        updatedAt:      row.updated_at,
      };
    });
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data as any[]).map((row) => ({
      id:             row.id,
      conversationId: row.conversation_id,
      senderId:       row.sender_id,
      body:           row.body,
      createdAt:      row.created_at,
    }));
  },

  sendMessage: async (conversationId: string, senderId: string, body: string): Promise<Message> => {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, body })
      .select().single();
    if (error) throw error;
    return { id: data.id, conversationId, senderId, body: data.body, createdAt: data.created_at };
  },

  getOrCreateConversation: async (
    itemId: string, requesterId: string, posterId: string
  ): Promise<Conversation> => {
    const { data: existing } = await supabase
      .from('conversations')
      .select('id, updated_at')
      .eq('item_id', itemId)
      .eq('requester_id', requesterId)
      .single();

    if (existing) return { id: existing.id } as Conversation;

    const { data, error } = await supabase
      .from('conversations')
      .insert({ item_id: itemId, requester_id: requesterId, poster_id: posterId })
      .select('id').single();
    if (error) throw error;
    return { id: data.id } as Conversation;
  },
};
