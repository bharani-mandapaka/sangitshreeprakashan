'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, ShoppingCart, Package, TrendingUp, ArrowRight, Circle, RefreshCw, AlertCircle } from 'lucide-react';
import type { AnalyticsSummary } from '@/lib/analytics-server';   // type only: nothing server-side is bundled
import { type DbOrder } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  confirmed: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  shipped:   'bg-purple-500/15 text-purple-300 border-purple-500/30',
  delivered: 'bg-green-500/15 text-green-300 border-green-500/30',
  returned:  'bg-orange-500/15 text-orange-300 border-orange-500/30',
  cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
};

export default function AdminDashboard() {
  const [orders,  setOrders]  = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState('');

  // Real visitor numbers from the server (anonymous, see lib/analytics-server.ts).
  const [days, setDays] = useState<7 | 30>(7);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSummary(null);
    fetch(`/api/admin/analytics?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => { if (!cancelled && s) setSummary(s); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [days]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setDbError('');
      try {
        // Reads go through a server route backed by the service-role key —
        // orders SELECT is now scoped to auth.uid() via RLS, so the anon-key
        // client can no longer see every order on its own. See
        // app/api/admin/orders/route.ts.
        const res = await fetch('/api/admin/orders');
        const body = await res.json();
        if (!res.ok) setDbError(body.error ?? 'Failed to load orders.');
        setOrders((body.orders as DbOrder[]) ?? []);
      } catch (err) {
        setDbError(err instanceof Error ? err.message : 'Failed to connect to the database.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.subtotal, 0),
    [orders],
  );

  const recentOrders = orders.slice(0, 5);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => { counts[o.status] = (counts[o.status] ?? 0) + 1; });
    return counts;
  }, [orders]);

  const topBooks  = summary?.topBooks ?? [];
  const maxViews  = topBooks[0]?.views ?? 1;
  const daily     = summary?.daily ?? [];
  const maxDay    = Math.max(...daily.map((d) => d.pageViews), 1);
  const num       = (n: number | undefined) => (summary ? (n ?? 0).toLocaleString('en-IN') : '—');
  const period    = `Last ${days} days`;

  const statCards = [
    {
      label: 'Page Views',
      value: num(summary?.totals.pageViews),
      icon:  Eye,
      color: 'text-blue-400',
      bg:    'bg-blue-400/10',
      sub:   period,
    },
    {
      label: 'Visitors',
      value: num(summary?.totals.visitors),
      icon:  TrendingUp,
      color: 'text-purple-400',
      bg:    'bg-purple-400/10',
      sub:   'Daily unique',
    },
    {
      label: 'Add to Cart',
      value: num(summary?.totals.cartAdds),
      icon:  ShoppingCart,
      color: 'text-gold',
      bg:    'bg-gold/10',
      sub:   summary ? `${num(summary.totals.checkoutStarts)} at checkout` : period,
    },
    {
      label: 'Total Orders',
      value: loading ? '—' : orders.length.toLocaleString('en-IN'),
      icon:  Package,
      color: 'text-green-400',
      bg:    'bg-green-400/10',
      sub:   loading ? 'Loading…' : formatPrice(totalRevenue) + ' revenue',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-cream">Dashboard</h1>
          <p className="text-cream/40 text-sm mt-1">Overview of your store performance</p>
        </div>
        {loading && <RefreshCw size={15} className="text-gold/40 animate-spin" />}
      </div>

      {dbError && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-cinzel px-4 py-3 rounded-xl">
          <AlertCircle size={14} /> Database error: {dbError}
        </div>
      )}

      {summary?.tableMissing && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs px-4 py-3 rounded-xl">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>
            Visitor tracking isn’t switched on yet, so visits and clicks show as 0. Run <code>analytics.sql</code> once in the
            Supabase SQL editor. Orders and revenue below are real and don’t need it.
          </span>
        </div>
      )}

      {/* Period for the visitor numbers */}
      <div className="flex items-center gap-2 text-xs font-cinzel">
        <span className="text-cream/40">Visitor numbers:</span>
        {([7, 30] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 rounded-full border transition-colors ${days === d ? 'border-gold/50 text-gold bg-gold/10' : 'border-gold/10 text-cream/50 hover:text-cream'}`}
          >
            Last {d} days
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-[#0A0000] border border-gold/10 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={18} className={s.color} />
              </div>
              <span className="text-cream/25 text-[10px] font-cinzel uppercase tracking-widest">{s.sub}</span>
            </div>
            <p className={`font-cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-cream/50 text-xs font-cinzel mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Visits chart */}
        <div className="lg:col-span-2 bg-[#0A0000] border border-gold/10 rounded-2xl p-5">
          <h2 className="font-cinzel text-cream font-semibold text-sm mb-6">Daily Page Views (Last {days} Days)</h2>
          {!summary ? (
            <div className="h-36 rounded-lg bg-white/5 animate-pulse" />
          ) : (
            <div className="flex items-end gap-1 sm:gap-2 h-36">
              {daily.map((d, i) => {
                const heightPct = Math.round((d.pageViews / maxDay) * 100);
                const date = new Date(`${d.date}T00:00:00`);
                // 7 days: weekday under every bar. 30 days: a date under every 5th bar, so labels don't collide.
                const label = days === 7
                  ? date.toLocaleDateString('en-IN', { weekday: 'short' })
                  : (i % 5 === 0 ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');
                return (
                  <div key={d.date} className="flex-1 h-full flex flex-col items-center gap-1.5 min-w-0" title={`${d.date}: ${d.pageViews} views, ${d.visitors} visitors`}>
                    {days === 7 && <span className="text-cream/40 text-[9px] font-cinzel">{d.pageViews}</span>}
                    {/* The bar sits in a box that fills the space between the number and the label, so its % height has something to be a % of. */}
                    <div className="flex-1 w-full flex items-end min-h-0">
                      <div className="w-full rounded-t-md bg-gold/15 hover:bg-gold/30 transition-colors relative" style={{ height: `${Math.max(heightPct, 4)}%` }}>
                        <div className="absolute inset-x-0 bottom-0 rounded-t-md bg-gradient-to-t from-gold/60 to-gold/20" style={{ height: '100%' }} />
                      </div>
                    </div>
                    <span className="text-cream/40 text-[9px] font-cinzel whitespace-nowrap">{label || ' '}</span>
                  </div>
                );
              })}
            </div>
          )}
          {summary?.truncated && (
            <p className="text-cream/30 text-[10px] mt-3">This period has more activity than can be counted here, so these numbers are a minimum.</p>
          )}
        </div>

        {/* Order status breakdown */}
        <div className="bg-[#0A0000] border border-gold/10 rounded-2xl p-5">
          <h2 className="font-cinzel text-cream font-semibold text-sm mb-6">Order Status</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <p className="text-cream/25 text-sm font-cinzel text-center py-6">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className={`text-[10px] font-cinzel font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_COLORS[status]}`}>
                    {status}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gold/50"
                        style={{ width: `${Math.round((count / orders.length) * 100)}%` }}
                      />
                    </div>
                    <span className="font-cinzel text-cream text-sm font-bold w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-gold/10">
            <p className="text-cream/40 text-xs font-cinzel">Total Revenue</p>
            <p className="font-cinzel text-gold font-bold text-xl mt-1">
              {loading ? '—' : formatPrice(totalRevenue)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top books by clicks */}
        <div className="bg-[#0A0000] border border-gold/10 rounded-2xl p-5">
          <h2 className="font-cinzel text-cream font-semibold text-sm mb-5">Most Viewed Books ({period})</h2>
          {topBooks.length === 0 ? (
            <p className="text-cream/25 text-sm font-cinzel text-center py-6">{summary ? 'No book views recorded yet' : 'Loading…'}</p>
          ) : (
            <div className="space-y-3">
              {topBooks.map(({ slug, views }, i) => (
                <div key={slug} className="flex items-center gap-3">
                  <span className="font-cinzel text-gold/40 text-xs w-4">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-cream/80 text-xs font-cinzel truncate">
                      {slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                    <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold/30"
                        style={{ width: `${Math.round((views / maxViews) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-cinzel text-cream/60 text-xs w-8 text-right">{views}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="bg-[#0A0000] border border-gold/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-cinzel text-cream font-semibold text-sm">Recent Orders</h2>
            <Link href="/admin/orders" className="text-gold/60 hover:text-gold text-xs font-cinzel flex items-center gap-1 transition-colors">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package size={24} className="text-cream/15 mx-auto mb-2" />
              <p className="text-cream/25 text-sm font-cinzel">No orders yet</p>
              <p className="text-cream/15 text-xs mt-1">Orders placed on the site will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 py-2 border-b border-gold/5 last:border-0">
                  <Circle
                    size={7}
                    className={`flex-shrink-0 ${
                      o.status === 'delivered' ? 'text-green-400 fill-green-400' :
                      o.status === 'cancelled' ? 'text-red-400 fill-red-400' :
                      'text-gold fill-gold'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-cinzel text-cream text-xs font-semibold truncate">{o.id}</p>
                    <p className="text-cream/40 text-[10px] truncate">{o.customer_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-cinzel text-gold text-xs font-bold">{formatPrice(o.subtotal)}</p>
                    <span className={`text-[9px] font-cinzel font-bold uppercase px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[o.status]}`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
