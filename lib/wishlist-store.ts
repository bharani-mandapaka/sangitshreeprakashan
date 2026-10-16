'use client';

import { create } from 'zustand';
import { getWishlistBookIds, addToWishlist, removeFromWishlist } from './wishlist';

interface WishlistStore {
  bookIds: Set<string>;
  loaded: boolean;
  load: (userId: string) => Promise<void>;
  clear: () => void;
  has: (bookId: string) => boolean;
  toggle: (userId: string, bookId: string) => Promise<void>;
}

// Client-side cache of the signed-in user's wishlisted book ids, so BookCard /
// BookDetailClient can show a filled heart instantly without a fetch per card.
// Populated/cleared from AuthListener as the Supabase Auth session changes.
export const useWishlistStore = create<WishlistStore>((set, get) => ({
  bookIds: new Set(),
  loaded: false,

  load: async (userId) => {
    const ids = await getWishlistBookIds(userId);
    set({ bookIds: new Set(ids), loaded: true });
  },

  clear: () => set({ bookIds: new Set(), loaded: false }),

  has: (bookId) => get().bookIds.has(bookId),

  toggle: async (userId, bookId) => {
    const wasWishlisted = get().bookIds.has(bookId);

    // Optimistic update — flip immediately, revert only if the write fails.
    const optimistic = new Set(get().bookIds);
    if (wasWishlisted) optimistic.delete(bookId);
    else optimistic.add(bookId);
    set({ bookIds: optimistic });

    const { error } = wasWishlisted
      ? await removeFromWishlist(userId, bookId)
      : await addToWishlist(userId, bookId);

    if (error) {
      const reverted = new Set(get().bookIds);
      if (wasWishlisted) reverted.add(bookId);
      else reverted.delete(bookId);
      set({ bookIds: reverted });
    }
  },
}));
