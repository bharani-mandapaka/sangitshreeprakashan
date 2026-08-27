'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, MessageCircle, Package, BookOpen, Award, Globe, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '@/lib/cart-store';
import { useAuthStore } from '@/lib/auth-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { getBooksByCategory, categoryMeta } from '@/lib/books';
import { formatPrice, WHATSAPP_NUMBER } from '@/lib/utils';
import BookCoverImage from '@/components/BookCoverImage';
import BookCard from '@/components/BookCard';
import type { Book } from '@/lib/books';

const levelLabels: Record<string, string> = {
  beginner:     'Beginner',
  intermediate: 'Intermediate',
  advanced:     'Advanced',
  research:     'Research / Scholarly',
  bundle:       'Complete Bundle',
};

const langLabels: Record<string, string> = {
  hindi:     'Hindi (हिंदी)',
  english:   'English',
  bilingual: 'Bilingual (Hindi + English)',
};

export default function BookDetailClient({ book }: { book: Book }) {
  const router   = useRouter();
  const addItem  = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const user     = useAuthStore((s) => s.user);
  const isWishlisted   = useWishlistStore((s) => s.has(book.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const handleAddToCart = () => {
    addItem(book);
    openCart();
  };

  const handleWishlist = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    toggleWishlist(user.id, book.id);
  };

  const whatsappMsg = encodeURIComponent(
    `Hello! I am interested in the book: "${book.titleEnglish}" (${formatPrice(book.price)}). Please provide more details.`,
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`;
  const meta        = categoryMeta[book.category];

  const related = getBooksByCategory(book.category)
    .filter((b) => b.id !== book.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-dark pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Back */}
        <Link
          href="/books"
          className="inline-flex items-center gap-2 text-cream/40 hover:text-gold text-sm transition-colors mb-8 font-cinzel"
        >
          <ArrowLeft size={15} /> Back to Books
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">

          {/* Left: Cover */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="perspective-1000 w-full max-w-xs">
              <motion.div
                animate={{ rotateY: [0, 4, 0, -4, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="preserve-3d w-full"
              >
                <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.8),0_0_40px_rgba(139,0,0,0.3)]">
                  <BookCoverImage book={book} size="lg" sizes="(max-width: 1024px) 90vw, 400px" priority />
                </div>
              </motion.div>
            </div>

            {/* Quick specs */}
            <div className="w-full grid grid-cols-2 gap-3 max-w-xs">
              {[
                { icon: <BookOpen size={14} />, label: 'Category', value: meta.label },
                { icon: <Award size={14} />,    label: 'Level',    value: levelLabels[book.level] ?? book.level },
                { icon: <Globe size={14} />,    label: 'Language', value: langLabels[book.language] ?? book.language },
                { icon: <Package size={14} />,  label: 'Type',     value: book.isBundle ? 'Complete Set' : 'Individual Book' },
              ].map((spec) => (
                <div key={spec.label} className="p-3 rounded-xl bg-[#0A0000] border border-gold/10">
                  <div className="flex items-center gap-1.5 text-gold/60 mb-1">
                    {spec.icon}
                    <p className="text-[10px] uppercase tracking-widest font-cinzel">{spec.label}</p>
                  </div>
                  <p className="text-cream text-xs font-medium leading-snug">{spec.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-cream/30 text-xs font-cinzel flex-wrap">
              <Link href="/books" className="hover:text-gold transition-colors">Books</Link>
              <span>/</span>
              <Link href={`/books?category=${book.category}`} className="hover:text-gold transition-colors">
                {meta.label}
              </Link>
              {book.part && (
                <>
                  <span>/</span>
                  <span className="text-cream/50">Part {book.part}</span>
                </>
              )}
            </div>

            {/* Category badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">{meta.icon}</span>
              <span className="text-gold text-xs font-cinzel uppercase tracking-widest">{meta.label}</span>
              {book.isBundle && (
                <span className="bg-gold text-dark text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  Bundle Set
                </span>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-cream leading-tight mb-2">
                {book.titleEnglish}
              </h1>
              <p className="font-devanagari text-gold/70 text-xl">{book.titleHindi}</p>
            </div>

            {/* Authors */}
            {book.authors.length > 0 && (
              <div>
                <p className="text-cream/40 text-xs uppercase tracking-widest mb-1 font-cinzel">
                  Author{book.authors.length > 1 ? 's' : ''}
                </p>
                {book.authors.map((a) => (
                  <p key={a} className="font-devanagari text-cream/80 text-sm">{a}</p>
                ))}
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-cinzel text-gold font-bold text-4xl">{formatPrice(book.price)}</span>
              <span className="text-cream/30 text-sm">Incl. of all taxes</span>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2.5 bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold py-4 rounded-xl transition-colors text-base"
              >
                <ShoppingCart size={20} />
                Add to Cart
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2.5 border border-gold/30 hover:border-gold text-cream hover:text-gold font-cinzel py-4 rounded-xl transition-all text-base"
              >
                <MessageCircle size={20} />
                Enquire on WhatsApp
              </a>
              <button
                onClick={handleWishlist}
                title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                className={`flex items-center justify-center gap-2.5 sm:w-14 py-4 rounded-xl border transition-all text-base font-cinzel ${
                  isWishlisted
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-gold/30 text-cream/60 hover:border-gold hover:text-gold'
                }`}
              >
                <Heart size={20} className={isWishlisted ? 'fill-gold' : ''} />
                <span className="sm:hidden">{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
              </button>
            </div>

            {/* Description */}
            <div>
              <div className="divider-gold mb-5" />
              <h2 className="font-cinzel text-cream font-semibold text-base mb-3">About This Book</h2>
              <p className="text-cream/65 text-sm leading-relaxed">{book.description}</p>
            </div>

            {/* Tags */}
            {book.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {book.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full border border-gold/15 text-cream/40 text-[11px] font-cinzel"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Related books */}
        {related.length > 0 && (
          <div className="mt-20">
            <div className="divider-gold mb-12" />
            <h2 className="font-cinzel text-2xl font-bold text-cream mb-8">More in {meta.label}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((b) => <BookCard key={b.id} book={b} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
