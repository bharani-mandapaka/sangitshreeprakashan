'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCartStore } from '@/lib/cart-store';

// Checks the books in the cart against the shop's current stock (GET /api/books/availability),
// because the cart is saved in the browser and a book can sell out while it sits there.
// The server still refuses to start a payment for a sold-out book; this just tells the
// customer earlier, with a way to fix it.

export type CartStockIssue =
  | { kind: 'soldout' }
  | { kind: 'short'; left: number };

export function useCartStock(): { issues: Record<string, CartStockIssue>; hasIssues: boolean } {
  const items = useCartStore((s) => s.items);
  const [availability, setAvailability] = useState<Record<string, { inStock: boolean; stockQuantity: number | null }>>({});

  // Re-check whenever the set of books in the cart changes (not on every quantity change).
  const idsKey = useMemo(() => items.map((i) => i.book.id).sort().join(','), [items]);

  useEffect(() => {
    if (!idsKey) { setAvailability({}); return; }
    let cancelled = false;
    fetch(`/api/books/availability?ids=${encodeURIComponent(idsKey)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled && data) setAvailability(data); })
      .catch(() => {});   // can't check -> say nothing; the server still protects payment
    return () => { cancelled = true; };
  }, [idsKey]);

  const issues = useMemo(() => {
    const found: Record<string, CartStockIssue> = {};
    for (const { book, quantity } of items) {
      const a = availability[book.id];
      if (!a) continue;
      if (!a.inStock) found[book.id] = { kind: 'soldout' };
      else if (typeof a.stockQuantity === 'number' && quantity > a.stockQuantity) found[book.id] = { kind: 'short', left: a.stockQuantity };
    }
    return found;
  }, [items, availability]);

  return { issues, hasIssues: Object.keys(issues).length > 0 };
}
