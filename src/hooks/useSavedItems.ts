import { useQuery } from '@tanstack/react-query';
import { itemsService } from '@/services/items';

export function useSavedItems(userId: string | undefined) {
  return useQuery({
    queryKey: ['items', 'saved', userId],
    queryFn:  () => itemsService.getSaved(userId!),
    enabled:  !!userId,
    staleTime: 60 * 1000,
  });
}
