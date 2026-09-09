'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, ArrowLeft } from 'lucide-react';
import { getSupabase, type DbOrder } from '@/lib/supabase';
import { InvoiceSheet } from '@/components/admin/InvoiceSheet';

// Customer-facing "Download Invoice" page, linked from /profile's Orders tab.
// See app/api/orders/[id]/invoice/route.ts for the data fetch (bearer-token
// auth, ownership-checked, lazily assigns invoice_number on first load).
// Reuses the same InvoiceSheet the admin panel prints from — same document,
// same numbering — just reached a different way.
//
// "Download" here means the browser's native Print dialog (destination:
// "Save as PDF"), same as the admin flow — no server-generated PDF file
// exists in this codebase; see the "PDF vs. browser print" open question in
// order-invoice-user-stories.md.
//
// Next.js 14 params are a plain sync object — see CLAUDE.md's note.
export default function CustomerOrderInvoicePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [order, setOrder]     = useState<DbOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data: { session } } = await getSupabase().auth.getSession();
        if (!session) {
          if (!cancelled) {
            setError('Please sign in to view this invoice.');
            setLoading(false);
          }
          return;
        }
        const res = await fetch(`/api/orders/${id}/invoice`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(body.error ?? 'Failed to load this invoice.');
        } else {
          setOrder(body.order as DbOrder);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to connect.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-black/40 font-sans text-sm">Loading invoice…</div>;
  }
  if (error || !order) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 text-black font-sans">
        <p className="text-sm text-red-600">{error || 'Order not found.'}</p>
        <Link href="/profile" className="text-sm underline">Back to My Orders</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8e8e8] print:bg-white font-sans">
      {/* Screen-only toolbar */}
      <div className="print:hidden sticky top-0 bg-white border-b border-black/10 px-6 py-3 flex items-center justify-between">
        <Link href="/profile" className="flex items-center gap-1.5 text-black/60 hover:text-black text-sm">
          <ArrowLeft size={15} /> Back to My Orders
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-black/80 transition-colors"
        >
          <Download size={15} /> Download Invoice
        </button>
      </div>

      <div className="my-8 print:my-0 max-w-[800px] mx-auto shadow-lg print:shadow-none">
        <InvoiceSheet order={order} />
      </div>
    </div>
  );
}
