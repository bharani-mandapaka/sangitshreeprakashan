import Image from 'next/image';
import { type DbOrder } from '@/lib/supabase';
import { SELLER } from '@/lib/seller-details';
import { formatPrice } from '@/lib/utils';

// The actual Bill of Supply document markup — extracted so both the
// single-order print page (app/admin/orders/[id]/invoice/page.tsx) and the
// bulk print page (app/admin/orders/print-batch/page.tsx) render identical
// invoices from one place. `order.invoice_number` must already be assigned
// by the time this renders (both API routes lazily assign it before
// returning the order) — this component doesn't fetch or mutate anything.
export function InvoiceSheet({ order }: { order: DbOrder }) {
  const items = order.order_items ?? [];
  const grandTotal  = order.subtotal;
  const deliveryFee = 0; // No shipping-charge feature exists anywhere in the codebase today.
  const totalPaid   = grandTotal + deliveryFee;
  const invoiceDate = new Date(order.created_at).toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace(',', '');

  return (
    <div className="max-w-[800px] mx-auto bg-white text-black p-10 print:p-8 font-sans">
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
  );
}
