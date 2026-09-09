'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Printer, ArrowLeft } from 'lucide-react';
import { type DbOrder } from '@/lib/supabase';
import { InvoiceSheet } from '@/components/admin/InvoiceSheet';

// Bulk "Print Selected" flow — reached from the checkboxes on
// app/admin/orders/page.tsx. Renders every selected order's invoice
// (components/admin/InvoiceSheet.tsx, same one the single-order page uses)
// one after another with a page break between them, then opens the browser
// print dialog automatically so the whole batch prints in one go.
//
// useSearchParams() requires a Suspense boundary in the App Router even in a
// fully client-rendered page like this one, hence the wrapper component below.
function PrintBatchContent() {
  const searchParams = useSearchParams();
  const ids = (searchParams.get('ids') ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  const [orders, setOrders]   = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    if (ids.length === 0) {
      setError('No orders were selected.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/admin/orders/invoice-batch?ids=${encodeURIComponent(ids.join(','))}`);
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(body.error ?? 'Failed to load the selected orders.');
        } else {
          setOrders((body.orders as DbOrder[]) ?? []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to connect.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // ids is derived fresh from searchParams every render, but its contents
    // only actually change when the URL does — join it so the effect doesn't
    // re-fire on every render from a new array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')]);

  // Auto-open the print dialog once every selected invoice has loaded, so
  // "Print Selected" really does go straight to one print preview covering
  // all of them — the manual Print button below is just a fallback in case
  // the browser blocks the automatic call.
  useEffect(() => {
    if (!loading && !error && orders.length > 0 && !printed) {
      setPrinted(true);
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [loading, error, orders, printed]);

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-black/40 font-sans text-sm">Loading {ids.length} invoice{ids.length !== 1 ? 's' : ''}…</div>;
  }
  if (error || orders.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 text-black font-sans">
        <p className="text-sm text-red-600">{error || 'No orders found.'}</p>
        <Link href="/admin/orders" className="text-sm underline">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8e8e8] print:bg-white font-sans">
      {/* Screen-only toolbar */}
      <div className="print:hidden sticky top-0 bg-white border-b border-black/10 px-6 py-3 flex items-center justify-between">
        <Link href="/admin/orders" className="flex items-center gap-1.5 text-black/60 hover:text-black text-sm">
          <ArrowLeft size={15} /> Back to Orders
        </Link>
        <p className="text-black/50 text-sm">{orders.length} invoice{orders.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-black/80 transition-colors"
        >
          <Printer size={15} /> Print All
        </button>
      </div>

      {/* One sheet per order, each starting on its own printed page */}
      {orders.map((order, i) => (
        <div
          key={order.id}
          className="my-8 print:my-0 max-w-[800px] mx-auto shadow-lg print:shadow-none"
          style={i < orders.length - 1 ? { breakAfter: 'page' } : undefined}
        >
          <InvoiceSheet order={order} />
        </div>
      ))}
    </div>
  );
}

export default function PrintBatchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-black/40 font-sans text-sm">Loading…</div>}>
      <PrintBatchContent />
    </Suspense>
  );
}
