'use client';

import { useEffect, useState } from 'react';
import { type DbOrder } from '@/lib/supabase';
import { InvoiceSheet } from '@/components/admin/InvoiceSheet';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Admin-only print page for a single order's Bill of Supply — see
// app/api/admin/orders/[id]/invoice/route.ts for the data fetch (which also
// lazily assigns the order's invoice_number on first load) and
// order-invoice-user-stories.md for the feature's scope. The actual document
// markup lives in components/admin/InvoiceSheet.tsx, shared with the bulk
// print page at app/admin/orders/print-batch/page.tsx.
//
// Next.js 14 params are a plain sync object (see CLAUDE.md's "Next.js 14
// params" note) — but this is a client component reading a route param, so
// it comes through as a prop here rather than via next/headers.
export default function AdminOrderInvoicePage({ params }: { params: { id: string } }) {
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
        const res = await fetch(`/api/admin/orders/${id}/invoice`);
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(body.error ?? 'Failed to load this order.');
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
        <Link href="/admin/orders" className="text-sm underline">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8e8e8] print:bg-white font-sans">
      {/* Screen-only toolbar — hidden entirely when printing */}
      <div className="print:hidden sticky top-0 bg-white border-b border-black/10 px-6 py-3 flex items-center justify-between">
        <Link href="/admin/orders" className="flex items-center gap-1.5 text-black/60 hover:text-black text-sm">
          <ArrowLeft size={15} /> Back to Orders
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-black/80 transition-colors"
        >
          <Printer size={15} /> Print
        </button>
      </div>

      <div className="my-8 print:my-0 max-w-[800px] mx-auto shadow-lg print:shadow-none">
        <InvoiceSheet order={order} />
      </div>
    </div>
  );
}
