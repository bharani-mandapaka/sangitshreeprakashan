'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { type DbOrder } from '@/lib/supabase';
import { SELLER } from '@/lib/seller-details';
import { formatPrice } from '@/lib/utils';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Admin-only print page for a single order's Bill of Supply — see
// app/api/admin/orders/[id]/invoice/route.ts for the data fetch (which also
// lazily assigns the order's invoice_number on first load) and
// order-invoice-user-stories.md for the feature's scope. Deliberately styled
// plain black-on-white rather than the site's dark/gold theme, since this is
// a document meant to be printed on paper, not a site page — matches the
// look of the real Bill of Supply (Invoice #469) this replicates.
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

  const items = order.order_items ?? [];
  const grandTotal  = order.subtotal;
  const deliveryFee = 0; // No shipping-charge feature exists anywhere in the codebase today.
  const totalPaid   = grandTotal + deliveryFee;
  const invoiceDate = new Date(order.created_at).toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace(',', '');

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

      {/* Invoice sheet */}
      <div className="max-w-[800px] mx-auto my-8 print:my-0 bg-white text-black p-10 print:p-8 shadow-lg print:shadow-none">
        {/* Header: logo + business details on the left, title centered */}
        <div className="grid grid-cols-3 items-start mb-8">
          <div className="flex items-start gap-3 col-span-1">
            <div className="relative w-14 h-14 flex-shrink-0">
              <Image src="/logo.png" alt="" fill sizes="56px" className="object-contain" />
            </div>
            <div>
              <p className="font-bold text-base leading-tight">{SELLER.name}</p>
              <p className="text-[11px] text-black/70 leading-snug mt-1 max-w-[220px]">{SELLER.address}</p>
              <p className="text-[11px] text-black/70 mt-1">Phone: {SELLER.phone}</p>
            </div>
          </div>

          <div className="col-span-1 flex items-center justify-center">
            <h1 className="font-bold text-lg tracking-wide uppercase">Bill of Supply</h1>
          </div>

          <div className="col-span-1" />
        </div>

        {/* Date / Invoice # */}
        <div className="flex justify-between text-[11px] text-black/70 mb-6">
          <p>Date: {invoiceDate}</p>
          <p>Invoice #: {order.invoice_number}</p>
        </div>

        {/* Bill To */}
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-wide text-black/50 mb-1">Bill To:</p>
          <p className="text-sm font-semibold">{order.customer_name}</p>
          <p className="text-[12px] text-black/80 leading-snug">
            {order.address_line1}<br />
            {order.address_city}, {order.address_state} {order.address_pincode}
          </p>
          <p className="text-[12px] text-black/80 mt-0.5">Phone: {order.customer_phone}</p>
        </div>

        {/* Line items */}
        <table className="w-full border-collapse text-[12px] mb-6">
          <thead>
            <tr className="border-t-2 border-b-2 border-black">
              <th className="text-left py-2 font-bold">Description</th>
              <th className="text-right py-2 font-bold w-16">Qty</th>
              <th className="text-right py-2 font-bold w-24">Price</th>
              <th className="text-right py-2 font-bold w-24">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-black/15">
                <td className="py-2 pr-2">{item.title_english}</td>
                <td className="py-2 text-right">{item.qty}</td>
                <td className="py-2 text-right">{formatPrice(item.price)}</td>
                <td className="py-2 text-right">{formatPrice(item.price * item.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-10">
          <div className="w-56 text-[12px] space-y-1">
            <div className="flex justify-between">
              <span className="text-black/60">Grand Total:</span>
              <span className="font-semibold">{formatPrice(grandTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">Delivery Fee:</span>
              <span className="font-semibold">{formatPrice(deliveryFee)}</span>
            </div>
            <div className="flex justify-between border-t border-black/30 pt-1 mt-1">
              <span className="font-bold">Total Paid:</span>
              <span className="font-bold">{formatPrice(totalPaid)}</span>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="flex justify-end">
          <div className="text-center text-[12px]">
            <p>for {SELLER.name}</p>
            <p className="mt-8 pt-1 border-t border-black/40">Authorised Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
