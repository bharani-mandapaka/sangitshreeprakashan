'use client';

import Link from 'next/link';
import { ShoppingCart, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import BookCover from './BookCover';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import type { Book } from '@/lib/books';
import { categoryMeta } from '@/lib/books';

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const addItem = useCartStore((s) => s.addItem);
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
    >
      <Link href={`/books/${book.slug}`} className="group block">
        <div className="gold-border rounded-xl overflow-hidden bg-[#0F0000] transition-all duration-300 group-hover:bg-[#150000] group-hover:shadow-gold-sm">
          {/* Cover */}
          <div className="relative aspect-[3/4] overflow-hidden bg-black">
            <BookCover
              titleEnglish={book.titleEnglish}
              titleHindi={book.titleHindi}
              category={book.category}
              level={book.level}
              part={book.part}
              series={book.series}
              isBundle={book.isBundle}
              size="md"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
              <button
                onClick={handleAddToCart}
                className="bg-gold text-dark font-semibold px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-gold-300 transition-colors"
              >
                <ShoppingCart size={15} />
                Add to Cart
              </button>
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg">
                <Eye size={18} className="text-cream" />
              </div>
            </div>
            {/* Bundle badge */}
            {book.isBundle && (
              <span className="absolute top-2 left-2 bg-gold text-dark text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Set
              </span>
            )}
            {/* Language badge */}
            {book.language === 'english' && (
              <span className="absolute top-2 right-2 bg-blue-900/80 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                EN
              </span>
            )}
          </div>

          {/* Info */}
          <div className="p-3">
            {/* Category */}
            <p className="text-[10px] text-gold/70 uppercase tracking-widest mb-1">
              {meta.label}
              {book.part ? ` · Part ${book.part}` : ''}
            </p>
            {/* Hindi title */}
            <p className="font-devanagari text-cream/80 text-xs leading-snug mb-0.5 truncate">
              {book.titleHindi}
            </p>
            {/* English title */}
            <h3 className="font-cinzel text-cream font-semibold text-sm leading-tight line-clamp-2 mb-2 group-hover:text-gold transition-colors">
              {book.titleEnglish}
            </h3>
            {/* Price + CTA row */}
            <div className="flex items-center justify-between">
              <span className="text-gold font-bold text-base font-cinzel">
                {formatPrice(book.price)}
              </span>
              <button
                onClick={handleAddToCart}
                className="bg-crimson/80 hover:bg-crimson text-cream p-1.5 rounded-lg transition-colors group-hover:bg-gold group-hover:text-dark"
                title="Add to Cart"
              >
                <ShoppingCart size={14} />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
