import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/lib/storage';
import type { FilterState, ItemCategory } from '@/types';

interface FilterStore {
  filters: FilterState;
  setRadius:   (km: number) => void;
  setCategory: (category?: ItemCategory) => void;
  setMaxAge:   (hours?: number) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: FilterState = { radiusKm: 10 };

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      filters: DEFAULT_FILTERS,
      setRadius:   (radiusKm) => set((s) => ({ filters: { ...s.filters, radiusKm } })),
      setCategory: (category) => set((s) => ({ filters: { ...s.filters, category } })),
      setMaxAge:   (maxAgeHours) => set((s) => ({ filters: { ...s.filters, maxAgeHours } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
    }),
    {
      name:    'ff-filters',
      storage: createJSONStorage(() => storage),
    }
  )
);
