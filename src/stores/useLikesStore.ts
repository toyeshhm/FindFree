import { create } from 'zustand';

interface LikesStore {
  likedIds: Set<string>;
  toggle:  (itemId: string) => void;
  isLiked: (itemId: string) => boolean;
}

export const useLikesStore = create<LikesStore>((set, get) => ({
  likedIds: new Set(),
  toggle: (itemId) =>
    set((s) => {
      const next = new Set(s.likedIds);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return { likedIds: next };
    }),
  isLiked: (itemId) => get().likedIds.has(itemId),
}));
