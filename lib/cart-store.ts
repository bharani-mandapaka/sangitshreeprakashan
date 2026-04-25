'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Book } from './books';

export interface CartItem {
  book: Book;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (book: Book) => void;
  removeItem: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (book) => {
        const existing = get().items.find((i) => i.book.id === book.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.book.id === book.id ? { ...i, quantity: i.quantity + 1 } : i,
            ),
          });
        } else {
          set({ items: [...get().items, { book, quantity: 1 }] });
        }
      },

      removeItem: (bookId) => {
        set({ items: get().items.filter((i) => i.book.id !== bookId) });
      },

      updateQuantity: (bookId, quantity) => {
        if (quantity < 1) {
          get().removeItem(bookId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.book.id === bookId ? { ...i, quantity } : i,
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      openCart:   () => set({ isOpen: true }),
      closeCart:  () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal:  () => get().items.reduce((sum, i) => sum + i.book.price * i.quantity, 0),
    }),
    { name: 'ssp-cart' },
  ),
);
