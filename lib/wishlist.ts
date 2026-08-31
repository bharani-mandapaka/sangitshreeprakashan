import { getSupabase } from './supabase';

// book_id references the static lib/books.ts catalog, not a DB table — see the
// note in supabase/schema.sql.
export async function getWishlistBookIds(userId: string): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from('wishlist')
    .select('book_id')
    .eq('user_id', userId);

  if (error) {
    console.error('[wishlist] fetch error:', error);
    return [];
  }
  return (data ?? []).map((row) => row.book_id as string);
}

export async function addToWishlist(userId: string, bookId: string) {
  const { error } = await getSupabase()
    .from('wishlist')
    .insert({ user_id: userId, book_id: bookId });
  if (error) console.error('[wishlist] add error:', error);
  return { error: error?.message ?? null };
}

export async function removeFromWishlist(userId: string, bookId: string) {
  const { error } = await getSupabase()
    .from('wishlist')
    .delete()
    .eq('user_id', userId)
    .eq('book_id', bookId);
  if (error) console.error('[wishlist] remove error:', error);
  return { error: error?.message ?? null };
}
