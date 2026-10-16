/**
 * Live, Supabase-backed catalog reads — replaces the static `books` array in
 * `lib/books.ts` as the actual source of truth. That file's `Book` type,
 * `BookCategory`/`BookLevel`/`BookLanguage` types, and `categoryMeta` are
 * still the ones everything imports (no reason to duplicate them); only the
 * *data* moved to the `books` table so the admin panel can create/edit books
 * and bundles at runtime, which a hardcoded array baked into the build can't
 * support.
 *
 * The `books` table's RLS policy allows public SELECT (see
 * supabase/schema.sql), so both the anon browser client and this server-side
 * client can read it freely — only writes are gated behind the service-role
 * admin API routes (see app/api/admin/books/route.ts).
 */
import { getSupabaseServer } from '@/lib/supabase';
import type { Book, BookCategory } from '@/lib/books';

export interface DbBookRow {
  id: string;
  slug: string;
  title_hindi: string;
  title_english: string;
  price: number;
  category: string;
  level: string;
  language: string;
  authors: string[];
  description: string;
  description_hindi: string | null;
  cover_image: string | null;
  series: string | null;
  part: number | null;
  is_bundle: boolean;
  is_featured: boolean;
  in_stock: boolean;
  tags: string[];
  created_at?: string;
  updated_at?: string;
}

/** Pure row → Book mapper, safe to call from client or server code alike. */
export function mapDbBookToBook(row: DbBookRow): Book {
  return {
    id: row.id,
    slug: row.slug,
    titleHindi: row.title_hindi,
    titleEnglish: row.title_english,
    price: Number(row.price),
    category: row.category as Book['category'],
    level: row.level as Book['level'],
    language: row.language as Book['language'],
    authors: row.authors ?? [],
    description: row.description ?? '',
    descriptionHindi: row.description_hindi ?? undefined,
    coverImage: row.cover_image ?? undefined,
    series: row.series ?? undefined,
    part: row.part ?? undefined,
    isBundle: row.is_bundle,
    isFeatured: row.is_featured,
    tags: row.tags ?? [],
  };
}

// ── Server-side reads (Server Components, sitemap, generateMetadata) ───────────
// Each call gets its own throwaway anon-key client — see getSupabaseServer()'s
// own comment for why (avoids leaking session state between requests).

// Bundles first, then individual books grouped by series with parts in order
// (Swar Vadan Part 1, 2, 3... together, not scattered alphabetically), and
// anything without a series (one-off titles like "Malhar Darshan") falls to
// the end, sorted by title. Applied everywhere multiple books are listed so
// the catalog reads the same way it did as a hand-ordered static array.
export async function getAllBooks(): Promise<Book[]> {
  const { data, error } = await getSupabaseServer()
    .from('books')
    .select('*')
    .order('is_bundle', { ascending: false })
    .order('series', { ascending: true, nullsFirst: false })
    .order('part', { ascending: true, nullsFirst: false })
    .order('title_english', { ascending: true });
  if (error || !data) return [];
  return (data as DbBookRow[]).map(mapDbBookToBook);
}

export async function getBookBySlug(slug: string): Promise<Book | undefined> {
  const { data } = await getSupabaseServer()
    .from('books')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return data ? mapDbBookToBook(data as DbBookRow) : undefined;
}

export async function getBookById(id: string): Promise<Book | undefined> {
  const { data } = await getSupabaseServer()
    .from('books')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data ? mapDbBookToBook(data as DbBookRow) : undefined;
}

export async function getBooksByIds(ids: string[]): Promise<Book[]> {
  if (ids.length === 0) return [];
  const { data } = await getSupabaseServer().from('books').select('*').in('id', ids);
  return data ? (data as DbBookRow[]).map(mapDbBookToBook) : [];
}

export async function getBooksByCategory(category: BookCategory): Promise<Book[]> {
  const { data } = await getSupabaseServer()
    .from('books')
    .select('*')
    .eq('category', category)
    .order('is_bundle', { ascending: false })
    .order('series', { ascending: true, nullsFirst: false })
    .order('part', { ascending: true, nullsFirst: false })
    .order('title_english', { ascending: true });
  return data ? (data as DbBookRow[]).map(mapDbBookToBook) : [];
}

export async function getFeaturedBooks(): Promise<Book[]> {
  const { data } = await getSupabaseServer()
    .from('books')
    .select('*')
    .eq('is_featured', true)
    .order('is_bundle', { ascending: false })
    .order('series', { ascending: true, nullsFirst: false })
    .order('part', { ascending: true, nullsFirst: false })
    .order('title_english', { ascending: true });
  return data ? (data as DbBookRow[]).map(mapDbBookToBook) : [];
}
