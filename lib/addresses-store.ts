'use client';

import { create } from 'zustand';
import {
  getSavedAddresses, insertAddress, deleteAddress, setDefaultAddress, sameAddress,
  MAX_SAVED_ADDRESSES, type SavedAddress, type NewAddress,
} from './addresses';

interface AddressesStore {
  addresses: SavedAddress[];
  loaded: boolean;
  load: (userId: string) => Promise<void>;
  clear: () => void;
  /** Saves an address unless the same one is already saved or the limit is reached. */
  add: (userId: string, address: NewAddress) => Promise<{ saved: boolean; reason?: 'duplicate' | 'limit' | 'error' }>;
  remove: (userId: string, id: string) => Promise<void>;
  makeDefault: (userId: string, id: string) => Promise<void>;
}

// Client-side copy of the signed-in customer's saved addresses, so checkout and the
// profile page can show them instantly. Loaded/cleared from AuthListener as the
// Supabase Auth session changes (same approach as the wishlist store).
export const useAddressesStore = create<AddressesStore>((set, get) => ({
  addresses: [],
  loaded: false,

  load: async (userId) => {
    const addresses = await getSavedAddresses(userId);
    set({ addresses, loaded: true });
  },

  clear: () => set({ addresses: [], loaded: false }),

  add: async (userId, address) => {
    const { addresses } = get();
    if (addresses.some((a) => sameAddress(a, address))) return { saved: false, reason: 'duplicate' };
    if (addresses.length >= MAX_SAVED_ADDRESSES) return { saved: false, reason: 'limit' };

    // The first address a customer saves becomes their default.
    const { address: created, error } = await insertAddress(userId, address, addresses.length === 0);
    if (error || !created) return { saved: false, reason: 'error' };
    set({ addresses: [...get().addresses, created].sort((a, b) => Number(b.is_default) - Number(a.is_default)) });
    return { saved: true };
  },

  remove: async (userId, id) => {
    const removed = get().addresses.find((a) => a.id === id);
    set({ addresses: get().addresses.filter((a) => a.id !== id) });
    const { error } = await deleteAddress(userId, id);
    if (error) { await get().load(userId); return; }

    // If the default was deleted, the newest remaining address takes over.
    if (removed?.is_default) {
      const next = get().addresses[0];
      if (next) await get().makeDefault(userId, next.id);
    }
  },

  makeDefault: async (userId, id) => {
    set({ addresses: get().addresses.map((a) => ({ ...a, is_default: a.id === id })).sort((a, b) => Number(b.is_default) - Number(a.is_default)) });
    const { error } = await setDefaultAddress(userId, id);
    if (error) await get().load(userId);
  },
}));
