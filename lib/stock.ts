import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Takes the copies in a paid order off the shelf, for books whose copies are counted
// (books.stock_quantity, see stock-quantity.sql). Runs after a payment is verified, so it
// must never fail the order: the customer has paid, and the worst case is the shop
// has to sort out a shortage by hand.

export interface Shortfall {
  bookId: string;
  /** How many copies the customer paid for that weren't in stock. */
  short: number;
}

export async function takeStockForOrder(
  items: { bookId: string; qty: number }[],
): Promise<{ shortfalls: Shortfall[]; failed: boolean }> {
  // The same book can be on two lines of a cart; take it off once.
  const wanted: Record<string, number> = {};
  for (const i of items) wanted[i.bookId] = (wanted[i.bookId] ?? 0) + i.qty;

  const shortfalls: Shortfall[] = [];
  let failed = false;

  try {
    const db = getSupabaseAdmin();
    for (const [bookId, qty] of Object.entries(wanted)) {
      const { data, error } = await db.rpc('take_stock', { p_book_id: bookId, p_qty: qty });
      if (error) {
        // The function doesn't exist until stock-quantity.sql has been run: counting is simply
        // switched off, which is not a failure.
        if (error.code === 'PGRST202' || error.code === '42883') continue;
        failed = true;
        continue;
      }
      // null = this book's copies aren't counted; a number > 0 = that many were short.
      if (typeof data === 'number' && data > 0) shortfalls.push({ bookId, short: data });
    }
  } catch {
    failed = true;
  }
  return { shortfalls, failed };
}
