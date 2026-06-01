import { create } from 'zustand';

interface SavedStore {
  savedIds:    Set<string>;
  setSavedIds: (ids: string[]) => void;
  toggle:      (itemId: string) => void;
  isSaved:     (itemId: string) => boolean;
}

export const useSavedStore = create<SavedStore>((set, get) => ({
  savedIds: new Set(),
  setSavedIds: (ids) => set({ savedIds: new Set(ids) }),
  toggle: (itemId) =>
    set((s) => {
      const next = new Set(s.savedIds);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return { savedIds: next };
    }),
  isSaved: (itemId) => get().savedIds.has(itemId),
}));
