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
  /** Copies left; null/missing = not tracked (only the In Stock switch applies). See stock-quantity.sql. */
  stock_quantity?: number | null;
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
    // Available only if the admin hasn't switched it off AND, when copies are counted, some are left.
    inStock: row.in_stock !== false && !(typeof row.stock_quantity === 'number' && row.stock_quantity <= 0),
    stockQuantity: typeof row.stock_quantity === 'number' ? row.stock_quantity : null,
    tags: row.tags ?? [],
  };
}

/**
 * Thrown by computeVerifiedSubtotal({ requireInStock: true }) so callers can answer 409
 * instead of 500. `titles` are the books the customer needs to fix in their cart.
 */
export class StockError extends Error {
  constructor(message: string, public titles: string[]) {
    super(message);
    this.name = 'StockError';
  }
}

/** One or more books are out of stock. */
export class OutOfStockError extends StockError {
  constructor(titles: string[]) {
    super(
      titles.length === 1
        ? `“${titles[0]}” is out of stock right now. Please remove it from your cart to continue.`
        : `These books are out of stock right now: ${titles.map((t) => `“${t}”`).join(', ')}. Please remove them from your cart to continue.`,
      titles,
    );
    this.name = 'OutOfStockError';
  }
}

/** The cart asks for more copies than are left of a book whose copies are counted. */
export class NotEnoughStockError extends StockError {
  constructor(shortages: { title: string; left: number }[]) {
    super(
      shortages.map((s) => `Only ${s.left} cop${s.left === 1 ? 'y' : 'ies'} of “${s.title}” left. Please lower the quantity in your cart.`).join(' '),
      shortages.map((s) => s.title),
    );
    this.name = 'NotEnoughStockError';
  }
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

/**
 * Recomputes a cart's subtotal from each book's real, current price in the
 * `books` table — used by the Razorpay checkout routes
 * (app/api/checkout/create-order and .../verify) so the amount actually
 * charged is never trusted from the client (a tampered `price` field in the
 * request body can't under-charge). Throws if any bookId doesn't exist or
 * any qty isn't a positive integer, rather than silently charging a partial
 * amount.
 *
 * `requireInStock` is for create-order only: it refuses to start a payment for a book
 * the admin marked out of stock. verify must NOT set it — a customer who already paid
 * for a book that sold out a moment later still has to get their order saved.
 */
export async function computeVerifiedSubtotal(
  items: { bookId: string; qty: number }[],
  { requireInStock = false }: { requireInStock?: boolean } = {},
): Promise<{ subtotal: number; priceByBookId: Record<string, number> }> {
  if (items.length === 0) {
    throw new Error('Cart is empty.');
  }
  const books = await getBooksByIds(items.map((i) => i.bookId));
  const priceByBookId: Record<string, number> = {};
  books.forEach((b) => { priceByBookId[b.id] = b.price; });

  if (requireInStock) {
    const soldOut = books.filter((b) => b.inStock === false).map((b) => b.titleEnglish);
    if (soldOut.length > 0) throw new OutOfStockError(soldOut);

    // Books whose copies are counted: the cart's total for each book (the same book can
    // appear on two lines) must not exceed what is left.
    const wanted: Record<string, number> = {};
    for (const item of items) wanted[item.bookId] = (wanted[item.bookId] ?? 0) + (Number.isInteger(item.qty) ? item.qty : 0);
    const short = books
      .filter((b) => typeof b.stockQuantity === 'number' && wanted[b.id] > b.stockQuantity)
      .map((b) => ({ title: b.titleEnglish, left: b.stockQuantity as number }));
    if (short.length > 0) throw new NotEnoughStockError(short);
  }

  let subtotal = 0;
  for (const item of items) {
    const price = priceByBookId[item.bookId];
    if (price === undefined) {
      throw new Error(`Book "${item.bookId}" no longer exists.`);
    }
    if (!Number.isInteger(item.qty) || item.qty <= 0) {
      throw new Error(`Invalid quantity for book "${item.bookId}".`);
    }
    subtotal += price * item.qty;
  }
  return { subtotal, priceByBookId };
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
