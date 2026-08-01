'use client';

import Link from 'next/link';
import { ShoppingCart, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import BookCoverImage from './BookCoverImage';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import type { Book } from '@/lib/books';
import { categoryMeta } from '@/lib/books';

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const addItem  = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(book);
    openCart();
  };

  const meta = categoryMeta[book.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="h-full"
    >
      <div className="gold-border rounded-xl overflow-hidden bg-[#0F0000] hover:bg-[#150000] transition-all duration-300 hover:shadow-gold-sm flex flex-col h-full group">

        {/* Cover — clicking navigates to detail page */}
        <Link href={`/books/${book.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-black flex-shrink-0">
          <BookCoverImage book={book} size="md" />
          {/* Subtle hover tint */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />
          {/* Badges */}
          {book.isBundle && (
            <span className="absolute top-2 left-2 bg-gold text-dark text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider z-10">
              Set
            </span>
          )}
          {book.language === 'english' && (
            <span className="absolute top-2 right-2 bg-blue-900/80 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider z-10">
              EN
            </span>
          )}
        </Link>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1 gap-1">
          <p className="text-[10px] text-gold/70 uppercase tracking-widest">
            {meta.label}{book.part ? ` · Part ${book.part}` : ''}
          </p>
          <p className="font-devanagari text-cream/70 text-xs leading-snug truncate">
            {book.titleHindi}
          </p>
          <h3 className="font-cinzel text-cream font-semibold text-sm leading-tight line-clamp-2 group-hover:text-gold transition-colors flex-1">
            {book.titleEnglish}
          </h3>

          <p className="font-cinzel text-gold font-bold text-base mt-1">
            {formatPrice(book.price)}
          </p>

          {/* Action buttons — always visible */}
          <div className="flex gap-2 mt-2">
            <Link
              href={`/books/${book.slug}`}
              className="flex-1 flex items-center justify-center gap-1.5 border border-gold/25 hover:border-gold/60 text-cream/70 hover:text-gold font-cinzel text-[11px] py-2 rounded-lg transition-all duration-200"
            >
              <Eye size={12} />
              View
            </Link>
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gold/10 hover:bg-gold text-gold hover:text-dark font-cinzel text-[11px] py-2 rounded-lg transition-all duration-200 border border-gold/25 hover:border-gold font-semibold"
            >
              <ShoppingCart size={12} />
              Add
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
