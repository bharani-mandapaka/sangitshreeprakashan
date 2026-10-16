'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X, ArrowUpDown, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BookCard from '@/components/BookCard';
import {
  categoryMeta,
  type Book,
  type BookCategory,
  type BookLevel,
  type BookLanguage,
} from '@/lib/books';

const ALL_CATEGORIES: BookCategory[] = [
  'instrumental',
  'vocal',
  'raag-theory',
  'kathak',
  'research',
  'cbse',
  'bundle',
];

const LEVELS: { value: BookLevel | 'all'; label: string }[] = [
  { value: 'all',         label: 'All Levels' },
  { value: 'beginner',    label: 'Beginner' },
  { value: 'intermediate',label: 'Intermediate' },
  { value: 'advanced',    label: 'Advanced' },
  { value: 'research',    label: 'Research' },
  { value: 'bundle',      label: 'Bundle' },
];

const LANGUAGES: { value: BookLanguage | 'all'; label: string }[] = [
  { value: 'all',      label: 'All Languages' },
  { value: 'hindi',    label: 'Hindi' },
  { value: 'english',  label: 'English' },
  { value: 'bilingual',label: 'Bilingual' },
];

// Category links from the homepage (e.g. /books?category=instrumental) were
// navigating here but landing on the unfiltered "All Books" view — this page
// never read the URL, it only tracked filters in local state. Reading the
// `category` param on mount (via useSearchParams, which requires the
// Suspense wrapper below) fixes that.
function BooksListContent({ initialBooks }: { initialBooks: Book[] }) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') as BookCategory | null;
  const initialCategory: BookCategory | 'all' =
    categoryParam && ALL_CATEGORIES.includes(categoryParam) ? categoryParam : 'all';

  const [query,    setQuery]    = useState('');
  const [category, setCategory] = useState<BookCategory | 'all'>(initialCategory);
  const [level,    setLevel]    = useState<BookLevel | 'all'>('all');
  const [language, setLanguage] = useState<BookLanguage | 'all'>('all');
  const [sortBy,   setSortBy]   = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [filtersOpen, setFiltersOpen] = useState(initialCategory !== 'all');

  const filtered = useMemo(() => {
    let result = [...initialBooks];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (b) =>
          b.titleEnglish.toLowerCase().includes(q) ||
          b.titleHindi.includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.tags.some((t) => t.includes(q)),
      );
    }

    if (category !== 'all') result = result.filter((b) => b.category === category);
    if (level    !== 'all') result = result.filter((b) => b.level    === level);
    if (language !== 'all') result = result.filter((b) => b.language === language);

    if (sortBy === 'price-asc')  result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);

    return result;
  }, [initialBooks, query, category, level, language, sortBy]);

  const clearFilters = () => {
    setQuery(''); setCategory('all'); setLevel('all');
    setLanguage('all'); setSortBy('default');
  };

  const hasFilters =
    query || category !== 'all' || level !== 'all' || language !== 'all' || sortBy !== 'default';

  return (
    <div className="min-h-screen bg-dark pt-20 lg:pt-24">
      {/* Page header */}
      <div className="bg-gradient-to-b from-[#0F0000] to-dark py-14 px-4 sm:px-6 lg:px-8 border-b border-gold/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="font-cinzel text-gold/70 text-xs uppercase tracking-[0.3em] mb-3">
            Our Library
          </p>
          <h1 className="font-cinzel text-4xl sm:text-5xl font-bold text-cream mb-3">
            All Books
          </h1>
          <p className="font-devanagari text-gold/60 text-xl">सभी पुस्तकें</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search books, ragas, series…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-gold"
              autoComplete="off"
            />
          </div>

          {/* Sort */}
          <div className="relative w-full sm:w-48">
            <ArrowUpDown size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/60 pointer-events-none z-10" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="input-gold w-full text-sm font-cinzel !text-cream/60"
              style={{ paddingLeft: '2.25rem' }}
            >
              <option value="default">Sort</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center justify-between gap-2 w-full sm:w-48 px-4 py-2.5 rounded-lg border transition-colors text-sm font-cinzel ${
              filtersOpen || hasFilters
                ? 'border-gold text-gold bg-gold/5'
                : 'border-gold/30 text-cream/60 hover:border-gold/40'
            }`}
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal size={15} />
              Filters
              {hasFilters && (
                <span className="bg-gold text-dark text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  !
                </span>
              )}
            </span>
            <ChevronDown
              size={15}
              className={`text-gold/70 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Expanded filters */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-5 rounded-xl border border-gold/10 bg-[#0A0000]">
                {/* Category */}
                <div>
                  <p className="text-cream/50 text-xs uppercase tracking-widest mb-2 font-cinzel">Category</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCategory('all')}
                      className={`px-3 py-1 rounded-full text-xs font-cinzel transition-colors ${
                        category === 'all' ? 'bg-gold text-dark' : 'border border-gold/20 text-cream/60 hover:border-gold/40'
                      }`}
                    >
                      All
                    </button>
                    {ALL_CATEGORIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`px-3 py-1 rounded-full text-xs font-cinzel transition-colors ${
                          category === c ? 'bg-gold text-dark' : 'border border-gold/20 text-cream/60 hover:border-gold/40'
                        }`}
                      >
                        {categoryMeta[c].icon} {categoryMeta[c].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level */}
                <div>
                  <p className="text-cream/50 text-xs uppercase tracking-widest mb-2 font-cinzel">Level</p>
                  <div className="flex flex-wrap gap-2">
                    {LEVELS.map((l) => (
                      <button
                        key={l.value}
                        onClick={() => setLevel(l.value as typeof level)}
                        className={`px-3 py-1 rounded-full text-xs font-cinzel transition-colors ${
                          level === l.value ? 'bg-gold text-dark' : 'border border-gold/20 text-cream/60 hover:border-gold/40'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <p className="text-cream/50 text-xs uppercase tracking-widest mb-2 font-cinzel">Language</p>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.value}
                        onClick={() => setLanguage(l.value as typeof language)}
                        className={`px-3 py-1 rounded-full text-xs font-cinzel transition-colors ${
                          language === l.value ? 'bg-gold text-dark' : 'border border-gold/20 text-cream/60 hover:border-gold/40'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count + clear */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-cream/40 text-sm">
            {filtered.length} book{filtered.length !== 1 ? 's' : ''} found
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-cream/40 hover:text-gold text-xs transition-colors"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-cinzel text-cream/30 text-lg mb-2">No books found</p>
            <button onClick={clearFilters} className="text-gold hover:underline text-sm">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {filtered.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Named for what it does now that it lives outside app/books/page.tsx —
// receives the books fetched server-side (see lib/books-data.ts) as a prop
// instead of importing the static array itself.
export default function BooksListClient({ initialBooks }: { initialBooks: Book[] }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark pt-20 lg:pt-24" />}>
      <BooksListContent initialBooks={initialBooks} />
    </Suspense>
  );
}
