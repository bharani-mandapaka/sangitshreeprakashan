'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Download, MapPin, Phone, Mail, Package, RefreshCw, Truck } from 'lucide-react';
import { type DbOrder } from '@/lib/supabase';
import { type OrderStatus } from '@/lib/orders-store';
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

// ── Order row ──────────────────────────────────────────────────────────────────
function OrderRow({
  order,
  onStatusChange,
}: {
  order: DbOrder;
  onStatusChange: (id: string, status: OrderStatus, extra?: Partial<DbOrder>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  // The backend (app/api/admin/orders/route.ts) requires a tracking ID +
  // courier name the first time an order moves to "shipped" — it uses them
  // in the customer's shipped notification. Rather than let that come back
  // as a 400, we ask for them inline before submitting.
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [courierInput, setCourierInput] = useState('');
  const [shipError, setShipError] = useState('');

  const submitStatus = async (newStatus: OrderStatus, extra?: { trackingId?: string; courierService?: string }) => {
    setUpdating(true);
    setShipError('');
    // Goes through the admin API route (service-role, cookie-gated) instead
    // of the anon client — see app/api/admin/orders/route.ts.
    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: order.id,
        status: newStatus,
        ...(extra?.trackingId ? { trackingId: extra.trackingId } : {}),
        ...(extra?.courierService ? { courierService: extra.courierService } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const patch: Partial<DbOrder> | undefined =
        newStatus === 'shipped'
          ? {
              shipped_at:      order.shipped_at ?? new Date().toISOString(),
              tracking_id:     extra?.trackingId ?? order.tracking_id,
              courier_service: extra?.courierService ?? order.courier_service,
            }
          : newStatus === 'delivered'
          ? { delivered_at: order.delivered_at ?? new Date().toISOString() }
          : undefined;
      onStatusChange(order.id, newStatus, patch);
      setShipModalOpen(false);
      setTrackingIdInput('');
      setCourierInput('');
    } else {
      setShipError(data.error ?? 'Failed to update status.');
    }
    setUpdating(false);
  };

  const handleStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const newStatus = e.target.value as OrderStatus;
    if (newStatus === 'shipped' && !order.shipped_at) {
      // First-time shipment — collect tracking info before calling the API.
      // The <select> stays controlled to the unchanged `status` prop below,
      // so it visually reverts until this is confirmed.
      setShipError('');
      setShipModalOpen(true);
      return;
    }
    submitStatus(newStatus);
  };

  const confirmShip = () => {
    if (!trackingIdInput.trim() || !courierInput.trim()) {
      setShipError('Tracking ID and courier service are both required.');
      return;
    }
    submitStatus('shipped', { trackingId: trackingIdInput.trim(), courierService: courierInput.trim() });
  };

  const cancelShip = () => {
    setShipModalOpen(false);
    setTrackingIdInput('');
    setCourierInput('');
    setShipError('');
  };

  const items  = order.order_items ?? [];
  const status = order.status as OrderStatus;

  return (
    <>
      <tr
        className="border-b border-gold/5 hover:bg-white/2 transition-colors cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <td className="px-4 py-3">
          <p className="font-cinzel text-gold text-xs font-bold">{order.id}</p>
          <p className="text-cream/35 text-[10px] mt-0.5">{fmtDate(order.created_at)}</p>
        </td>
        <td className="px-4 py-3">
          <p className="text-cream text-xs font-cinzel font-semibold">{order.customer_name}</p>
          <p className="text-cream/45 text-[10px] mt-0.5">{order.customer_email}</p>
        </td>
        <td className="px-4 py-3 hidden sm:table-cell">
          <p className="text-cream/70 text-xs">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </td>
        <td className="px-4 py-3">
          <p className="font-cinzel text-gold font-bold text-sm">{formatPrice(order.subtotal)}</p>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <span className={`text-[10px] font-cinzel font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_COLORS[status] ?? STATUS_COLORS.pending}`}>
            {status}
          </span>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell">
          <span className="text-cream/40 text-xs uppercase">{order.payment_method}</span>
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
                <p className="text-cream/80 text-xs">{order.customer_name}</p>
                <a href={`mailto:${order.customer_email}`} className="text-gold/70 hover:text-gold text-xs transition-colors block mt-0.5">
                  {order.customer_email}
                </a>
                <a href={`tel:${order.customer_phone}`} className="text-cream/50 hover:text-cream text-xs transition-colors flex items-center gap-1 mt-0.5">
                  <Phone size={10} /> {order.customer_phone}
                </a>
              </div>

              {/* Shipping address */}
              <div>
                <p className="text-gold/70 text-[10px] font-cinzel uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <MapPin size={10} /> Shipping Address
                </p>
                <p className="text-cream/70 text-xs leading-relaxed">
                  {order.address_line1}<br />
                  {order.address_city}, {order.address_state}<br />
                  PIN: {order.address_pincode}
                </p>
              </div>

              {/* Items */}
              <div className="sm:col-span-2 lg:col-span-1">
                <p className="text-gold/70 text-[10px] font-cinzel uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Package size={10} /> Items Ordered
                </p>
                {items.length === 0 ? (
                  <p className="text-cream/30 text-xs">No items recorded</p>
                ) : (
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-cream/80 text-xs leading-snug">{item.title_english}</p>
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
                )}
              </div>

              {/* Status update */}
              <div>
                <p className="text-gold/70 text-[10px] font-cinzel uppercase tracking-widest mb-2">Update Status</p>
                <div className="relative">
                  <select
                    value={status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={handleStatus}
                    disabled={updating}
                    className="input-gold text-xs py-1.5 w-full cursor-pointer disabled:opacity-50"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                  {updating && (
                    <RefreshCw size={11} className="absolute right-8 top-1/2 -translate-y-1/2 text-gold animate-spin" />
                  )}
                </div>

                {/* Inline tracking-info prompt — required the first time an
                    order is marked shipped, since that's what goes into the
                    customer's "Order Shipped" notification. */}
                {shipModalOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 border border-gold/20 rounded-lg p-3 bg-black/30 space-y-2"
                  >
                    <p className="text-gold/70 text-[10px] font-cinzel uppercase tracking-widest flex items-center gap-1.5">
                      <Truck size={10} /> Shipping Details
                    </p>
                    <input
                      className="input-gold text-xs py-1.5 w-full"
                      placeholder="Tracking ID"
                      value={trackingIdInput}
                      onChange={(e) => setTrackingIdInput(e.target.value)}
                      autoComplete="off"
                    />
                    <input
                      className="input-gold text-xs py-1.5 w-full"
                      placeholder="Courier service (e.g. India Post)"
                      value={courierInput}
                      onChange={(e) => setCourierInput(e.target.value)}
                      autoComplete="off"
                    />
                    {shipError && <p className="text-red-400 text-[10px]">{shipError}</p>}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={confirmShip}
                        disabled={updating}
                        className="flex-1 bg-gold/20 hover:bg-gold/30 text-gold font-cinzel text-[10px] uppercase tracking-widest py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {updating ? 'Saving…' : 'Confirm'}
                      </button>
                      <button
                        onClick={cancelShip}
                        disabled={updating}
                        className="flex-1 border border-cream/15 hover:border-cream/30 text-cream/50 hover:text-cream font-cinzel text-[10px] uppercase tracking-widest py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Once set, show the shipping info that's already on file. */}
                {!shipModalOpen && order.tracking_id && (
                  <div className="mt-3 text-[10px] text-cream/40 leading-relaxed flex items-start gap-1.5">
                    <Truck size={10} className="mt-0.5 flex-shrink-0" />
                    <span>
                      {order.courier_service} · {order.tracking_id}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders,  setOrders]  = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [query,   setQuery]   = useState('');
  const [status,  setStatus]  = useState<OrderStatus | 'all'>('all');
  const [sort,    setSort]    = useState<'newest' | 'oldest' | 'highest'>('newest');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Reads go through a server route backed by the service-role key —
      // orders SELECT is now scoped to auth.uid() via RLS, so the anon-key
      // client used elsewhere on this page (e.g. status updates) can no
      // longer see every order on its own. See app/api/admin/orders/route.ts.
      const res = await fetch('/api/admin/orders');
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? 'Failed to load orders.');
      } else {
        setOrders((body.orders as DbOrder[]) ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to the database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Optimistic status update (no re-fetch needed). `extra` carries the
  // shipped_at/delivered_at/tracking fields the PATCH route just set, so the
  // duplicate-notification guard (order.shipped_at / order.delivered_at)
  // works immediately without a re-fetch.
  const handleStatusChange = (id: string, newStatus: OrderStatus, extra?: Partial<DbOrder>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus, ...extra } : o))
    );
  };

  const filtered = useMemo(() => {
    let list = orders.filter((o) => {
      const q = query.toLowerCase();
      const matchQ =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q) ||
        (o.address_city ?? '').toLowerCase().includes(q);
      const matchS = status === 'all' || o.status === status;
      return matchQ && matchS;
    });

    if (sort === 'newest')  list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (sort === 'oldest')  list = [...list].sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (sort === 'highest') list = [...list].sort((a, b) => b.subtotal - a.subtotal);
    return list;
  }, [orders, query, status, sort]);

  const totalRevenue = useMemo(
    () => filtered.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.subtotal, 0),
    [filtered],
  );

  // CSV export
  const handleExport = () => {
    const rows = [
      ['Order ID', 'Date', 'Name', 'Email', 'Phone', 'Address', 'City', 'State', 'PIN', 'Items', 'Total', 'Status', 'Payment'],
      ...filtered.map((o) => [
        o.id,
        fmtDate(o.created_at),
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.address_line1 ?? '',
        o.address_city ?? '',
        o.address_state ?? '',
        o.address_pincode ?? '',
        (o.order_items ?? []).map((i) => `${i.title_english} x${i.qty}`).join(' | '),
        o.subtotal.toString(),
        o.status,
        o.payment_method,
      ]),
    ];
    const csv  = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
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
            {loading ? 'Loading…' : `${filtered.length} orders · ${formatPrice(totalRevenue)} revenue`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 border border-gold/15 hover:border-gold/30 text-cream/50 hover:text-cream font-cinzel text-xs px-3 py-2 rounded-xl transition-all disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 border border-gold/25 hover:border-gold/50 text-gold/70 hover:text-gold font-cinzel text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-40"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm font-cinzel">
          Database error: {error}. Check Supabase connection.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[180px]">
          <input
            className="input-gold text-sm py-2"
            placeholder="Search order ID, name, city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
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
        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw size={22} className="text-gold/40 animate-spin mx-auto mb-3" />
            <p className="font-cinzel text-cream/30 text-sm">Loading orders…</p>
          </div>
        ) : (
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
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Package size={28} className="text-cream/10 mx-auto mb-3" />
                      <p className="font-cinzel text-cream/30 text-sm">
                        {orders.length === 0 ? 'No orders yet — place an order from the storefront to see it here.' : 'No orders match your filters.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => (
                    <OrderRow key={order.id} order={order} onStatusChange={handleStatusChange} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
