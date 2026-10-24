'use client';

import { AlertTriangle } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import type { CartStockIssue } from '@/lib/use-cart-stock';

/**
 * Tells the customer which books in their cart are sold out or have fewer copies than
 * they asked for, with one-tap fixes. Renders nothing when everything is fine.
 */
export default function CartStockNotice({ issues }: { issues: Record<string, CartStockIssue> }) {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const rows = items.filter(({ book }) => issues[book.id]);
  if (rows.length === 0) return null;

  return (
    <div role="alert" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <p className="flex items-center gap-2 text-amber-300 font-cinzel font-semibold mb-2">
        <AlertTriangle size={16} /> Please check your cart
      </p>
      <ul className="space-y-2">
        {rows.map(({ book }) => {
          const issue = issues[book.id];
          return (
            <li key={book.id} className="text-cream/80">
              <span className="font-semibold">{book.titleEnglish}</span>
              {issue.kind === 'soldout' ? ' is out of stock right now.' : ` — only ${issue.left} cop${issue.left === 1 ? 'y' : 'ies'} left.`}{' '}
              {issue.kind === 'short' && issue.left > 0 && (
                <button type="button" onClick={() => updateQuantity(book.id, issue.left)} className="underline text-gold hover:text-gold-300 mr-2">
                  Lower to {issue.left}
                </button>
              )}
              <button type="button" onClick={() => removeItem(book.id)} className="underline text-gold hover:text-gold-300">
                Remove
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
