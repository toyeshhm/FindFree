import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { messagesService } from '@/services/messages';
import type { Message } from '@/types';

export function useChatThread(conversationId: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['chat', conversationId],
    queryFn:  () => messagesService.getMessages(conversationId),
    staleTime: Infinity,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          qc.setQueryData<Message[]>(['chat', conversationId], (prev = []) => [
            ...prev,
            {
              id:             payload.new.id,
              conversationId: payload.new.conversation_id,
              senderId:       payload.new.sender_id,
              body:           payload.new.body,
              createdAt:      payload.new.created_at,
            },
          ]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, qc]);

  return query;
}
