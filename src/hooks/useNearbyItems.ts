import { useQuery } from '@tanstack/react-query';
import { itemsService } from '@/services/items';
import type { LatLng, FilterState } from '@/types';

export function useNearbyItems(location: LatLng | null, filters: FilterState) {
  return useQuery({
    queryKey: ['items', 'nearby', location, filters],
    queryFn:  () => itemsService.getNearby(location!, filters),
    enabled:  !!location,
    staleTime: 2 * 60 * 1000,
    gcTime:   10 * 60 * 1000,
    retry:    2,
  });
}
