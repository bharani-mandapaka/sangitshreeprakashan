'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Download, MapPin, Phone, Mail, Package } from 'lucide-react';
import { useOrdersStore, type Order, type OrderStatus } from '@/lib/orders-store';
import { formatPrice } from '@/lib/utils';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:   'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  confirmed: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  shipped:   'bg-purple-500/15 text-purple-300 border-purple-500/30',
  delivered: 'bg-green-500/15 text-green-300 border-green-500/30',
  cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
};

const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const { updateStatus } = useOrdersStore();

  return (
    <>
      <tr
        className="border-b border-gold/5 hover:bg-white/2 transition-colors cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <td className="px-4 py-3">
          <p className="font-cinzel text-gold text-xs font-bold">{order.id}</p>
          <p className="text-cream/35 text-[10px] mt-0.5">{fmtDate(order.createdAt)}</p>
        </td>
        <td className="px-4 py-3">
          <p className="text-cream text-xs font-cinzel font-semibold">{order.customer.name}</p>
          <p className="text-cream/45 text-[10px] mt-0.5">{order.customer.email}</p>
        </td>
        <td className="px-4 py-3 hidden sm:table-cell">
          <p className="text-cream/70 text-xs">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
        </td>
        <td className="px-4 py-3">
          <p className="font-cinzel text-gold font-bold text-sm">{formatPrice(order.subtotal)}</p>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <span className={`text-[10px] font-cinzel font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.status]}`}>
            {order.status}
          </span>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell">
          <span className="text-cream/40 text-xs uppercase">{order.paymentMethod}</span>
        </td>
        <td className="px-4 py-3 text-right">
          {expanded
            ? <ChevronUp size={14} className="text-gold/50 inline" />
            : <ChevronDown size={14} className="text-cream/30 inline" />
          }
        </td>
      </tr>

      {expanded && (
        <tr className="bg-[#060000]">
          <td colSpan={7} className="px-4 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-sm">

              {/* Customer */}
              <div>
                <p className="text-gold/70 text-[10px] font-cinzel uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Mail size={10} /> Customer
                </p>
                <p className="text-cream/80 text-xs">{order.customer.name}</p>
                <a href={`mailto:${order.customer.email}`} className="text-gold/70 hover:text-gold text-xs transition-colors block mt-0.5">
                  {order.customer.email}
                </a>
                <a href={`tel:${order.customer.phone}`} className="text-cream/50 hover:text-cream text-xs transition-colors flex items-center gap-1 mt-0.5">
                  <Phone size={10} /> {order.customer.phone}
                </a>
              </div>

              {/* Shipping address */}
              <div>
                <p className="text-gold/70 text-[10px] font-cinzel uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <MapPin size={10} /> Shipping Address
                </p>
                <p className="text-cream/70 text-xs leading-relaxed">
                  {order.billingAddress.line1}<br />
                  {order.billingAddress.city}, {order.billingAddress.state}<br />
                  PIN: {order.billingAddress.pincode}
                </p>
              </div>

              {/* Items */}
              <div className="sm:col-span-2 lg:col-span-1">
                <p className="text-gold/70 text-[10px] font-cinzel uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Package size={10} /> Items Ordered
                </p>
                <div className="space-y-1.5">
                  {order.items.map((item) => (
                    <div key={item.sku} className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-cream/80 text-xs leading-snug">{item.titleEnglish}</p>
                        <p className="text-cream/35 text-[10px]">SKU: {item.sku} · Qty: {item.qty}</p>
                      </div>
                      <p className="text-gold text-xs font-cinzel font-bold flex-shrink-0">
                        {formatPrice(item.price * item.qty)}
                      </p>
                    </div>
                  ))}
                  <div className="border-t border-gold/10 pt-1.5 flex justify-between">
                    <span className="text-cream/40 text-[10px] font-cinzel uppercase">Total</span>
                    <span className="font-cinzel text-gold font-bold text-sm">{formatPrice(order.subtotal)}</span>
                  </div>
                </div>
              </div>

              {/* Status update */}
              <div>
                <p className="text-gold/70 text-[10px] font-cinzel uppercase tracking-widest mb-2">Update Status</p>
                <select
                  value={order.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateStatus(order.id, e.target.value as OrderStatus);
                  }}
                  className="input-gold text-xs py-1.5 w-full cursor-pointer"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function OrdersPage() {
  const orders = useOrdersStore((s) => s.orders);
  const [query, setQuery]   = useState('');
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [sort, setSort]     = useState<'newest' | 'oldest' | 'highest'>('newest');

  const filtered = useMemo(() => {
    let list = orders.filter((o) => {
      const q = query.toLowerCase();
      const matchQ =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        o.billingAddress.city.toLowerCase().includes(q);
      const matchS = status === 'all' || o.status === status;
      return matchQ && matchS;
    });

    if (sort === 'newest')  list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === 'oldest')  list = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (sort === 'highest') list = [...list].sort((a, b) => b.subtotal - a.subtotal);
    return list;
  }, [orders, query, status, sort]);

  const totalRevenue = useMemo(
    () => filtered.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.subtotal, 0),
    [filtered]
  );

  // CSV export
  const handleExport = () => {
    const rows = [
      ['Order ID', 'Date', 'Name', 'Email', 'Phone', 'Address', 'City', 'State', 'PIN', 'Items', 'Total', 'Status', 'Payment'],
      ...filtered.map((o) => [
        o.id,
        fmtDate(o.createdAt),
        o.customer.name,
        o.customer.email,
        o.customer.phone,
        o.billingAddress.line1,
        o.billingAddress.city,
        o.billingAddress.state,
        o.billingAddress.pincode,
        o.items.map((i) => `${i.titleEnglish} x${i.qty}`).join(' | '),
        o.subtotal.toString(),
        o.status,
        o.paymentMethod,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ssp-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-cream">Orders</h1>
          <p className="text-cream/40 text-sm mt-1">
            {filtered.length} orders · {formatPrice(totalRevenue)} revenue
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 border border-gold/25 hover:border-gold/50 text-gold/70 hover:text-gold font-cinzel text-xs px-4 py-2 rounded-xl transition-all"
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/40" />
          <input
            className="input-gold pl-8 text-sm py-2"
            placeholder="Search order ID, name, city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | 'all')}
          className="input-gold text-sm py-2 pr-8 min-w-[140px] cursor-pointer"
        >
          <option value="all">All Status</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="input-gold text-sm py-2 pr-8 min-w-[140px] cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Value</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#0A0000] border border-gold/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold/10">
                {['Order ID / Date', 'Customer', 'Items', 'Total', 'Status', 'Payment', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-cinzel uppercase tracking-widest text-cream/35">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-cream/30 font-cinzel text-sm">
                    No orders match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => <OrderRow key={order.id} order={order} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
