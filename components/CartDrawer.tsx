'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import BookCoverImage from './BookCoverImage';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#0F0000] border-l border-gold/15 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gold/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-gold" size={20} />
                <h2 className="font-cinzel text-cream font-semibold text-lg">Your Cart</h2>
                {items.length > 0 && (
                  <span className="bg-gold text-dark text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-2 text-cream/50 hover:text-cream transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-3">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-4">
                  <ShoppingBag size={48} className="text-gold/20" />
                  <p className="font-cinzel text-cream/40 text-sm">Your cart is empty</p>
                  <Link
                    href="/books"
                    onClick={closeCart}
                    className="text-gold hover:underline text-sm"
                  >
                    Browse our collection →
                  </Link>
                </div>
              ) : (
                items.map(({ book, quantity }) => (
                  <div
                    key={book.id}
                    className="flex gap-3 p-3 rounded-xl bg-white/3 border border-gold/8 hover:border-gold/20 transition-colors"
                  >
                    {/* Cover thumbnail */}
                    <div className="relative w-14 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                      <BookCoverImage book={book} size="sm" sizes="56px" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gold/60 uppercase tracking-wider mb-0.5">
                        {book.isBundle ? 'Bundle Set' : book.series || book.category}
                      </p>
                      <h4 className="font-cinzel text-cream text-xs font-semibold line-clamp-2 leading-snug mb-2">
                        {book.titleEnglish}
                      </h4>

                      {/* Qty controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(book.id, quantity - 1)}
                            className="w-6 h-6 rounded border border-gold/20 flex items-center justify-center text-cream/60 hover:border-gold hover:text-gold transition-colors"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-cream text-sm font-medium w-5 text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(book.id, quantity + 1)}
                            className="w-6 h-6 rounded border border-gold/20 flex items-center justify-center text-cream/60 hover:border-gold hover:text-gold transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gold font-bold font-cinzel text-sm">
                            {formatPrice(book.price * quantity)}
                          </span>
                          <button
                            onClick={() => removeItem(book.id)}
                            className="text-cream/30 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gold/10 px-6 py-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-cream/60 text-sm">Subtotal</span>
                  <span className="font-cinzel text-gold font-bold text-xl">
                    {formatPrice(subtotal())}
                  </span>
                </div>
                <p className="text-cream/30 text-xs">Shipping calculated at checkout</p>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full text-center bg-gold text-dark font-cinzel font-bold py-3.5 rounded-xl hover:bg-gold-300 transition-colors"
                >
                  Proceed to Checkout
                </Link>
                <button
                  onClick={closeCart}
                  className="block w-full text-center text-cream/50 hover:text-cream text-sm transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
