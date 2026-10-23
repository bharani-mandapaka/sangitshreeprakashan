import { NextRequest, NextResponse } from 'next/server';
import { getBooksByIds } from '@/lib/books-data';

// Fresh stock status for the books in someone's cart, so a book that sold out after it was
// added (the cart is saved in the browser) is flagged before payment instead of at payment.
// Public and read-only: it only says whether a book is available and how many copies are
// left, which the shop pages already show.
//
//   GET /api/books/availability?ids=book-a,book-b
//   -> { "book-a": { inStock: true, stockQuantity: 3 }, "book-b": { inStock: false, stockQuantity: null } }
//
// A book id that doesn't exist any more is reported as not in stock.
const MAX_IDS = 50;

export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get('ids') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_IDS);
  if (ids.length === 0) return NextResponse.json({});

  const books = await getBooksByIds(ids);
  const byId = new Map(books.map((b) => [b.id, b]));
  const result: Record<string, { inStock: boolean; stockQuantity: number | null }> = {};
  for (const id of ids) {
    const b = byId.get(id);
    result[id] = { inStock: !!b && b.inStock !== false, stockQuantity: b?.stockQuantity ?? null };
  }
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
