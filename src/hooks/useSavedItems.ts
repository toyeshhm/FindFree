import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { itemsService } from '@/services/items';
import { useSavedStore } from '@/stores/useSavedStore';

export function useSavedItems(userId: string | undefined) {
  const query = useQuery({
    queryKey: ['items', 'saved', userId],
    queryFn:  () => itemsService.getSaved(userId!),
    enabled:  !!userId,
    staleTime: 60 * 1000,
  });

  const setSavedIds = useSavedStore((s) => s.setSavedIds);

  useEffect(() => {
    if (query.data) {
      setSavedIds(query.data.map(item => item.id));
    }
  }, [query.data, setSavedIds]);

  return query;
}
