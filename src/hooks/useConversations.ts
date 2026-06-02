import { useQuery } from '@tanstack/react-query';
import { messagesService } from '@/services/messages';

export function useConversations(userId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn:  () => messagesService.getConversations(userId!),
    enabled:  !!userId,
    staleTime: 30 * 1000,
  });
}
