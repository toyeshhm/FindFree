import { useQuery } from '@tanstack/react-query';
import { itemsService } from '@/services/items';

export function useItemDetail(itemId: string) {
  return useQuery({
    queryKey: ['item', itemId],
    queryFn:  () => itemsService.getById(itemId),
    staleTime: 5 * 60 * 1000,
  });
}
