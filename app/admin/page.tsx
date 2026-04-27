'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Eye, ShoppingCart, Package, TrendingUp, ArrowRight, Circle } from 'lucide-react';
import { useOrdersStore } from '@/lib/orders-store';
import { useAnalyticsStore, getTotals } from '@/lib/analytics-store';
import { formatPrice } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  confirmed: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  shipped:   'bg-purple-500/15 text-purple-300 border-purple-500/30',
  delivered: 'bg-green-500/15 text-green-300 border-green-500/30',
  cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
};

export default function AdminDashboard() {
  const orders    = useOrdersStore((s) => s.orders);
  const analytics = useAnalyticsStore();
  const totals    = getTotals(analytics);

  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.subtotal, 0),
    [orders]
  );

  const recentOrders = orders.slice(0, 5);

  // Top books by clicks
  const topBooks = useMemo(() => {
    return Object.entries(analytics.bookClicks)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([slug, clicks]) => ({ slug, clicks }));
  }, [analytics.bookClicks]);

  // Order status breakdown
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => { counts[o.status] = (counts[o.status] ?? 0) + 1; });
    return counts;
  }, [orders]);

  const maxClicks = topBooks[0]?.clicks ?? 1;

  const statCards = [
    {
      label: 'Page Visits',
      value: totals.visits.toLocaleString('en-IN'),
      icon: Eye,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      sub: 'All time',
    },
    {
      label: 'Unique Visitors',
      value: totals.unique.toLocaleString('en-IN'),
      icon: TrendingUp,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      sub: `${Math.round((totals.unique / totals.visits) * 100)}% of visits`,
    },
    {
      label: 'Add to Cart',
      value: totals.cartAdds.toLocaleString('en-IN'),
      icon: ShoppingCart,
      color: 'text-gold',
      bg: 'bg-gold/10',
      sub: `${Math.round((totals.cartAdds / totals.visits) * 100)}% conversion`,
    },
    {
      label: 'Total Orders',
      value: orders.length.toLocaleString('en-IN'),
      icon: Package,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      sub: formatPrice(totalRevenue) + ' revenue',
    },
  ];

  const maxDay = Math.max(...analytics.dailyData.map((d) => d.visits));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-cinzel text-2xl font-bold text-cream">Dashboard</h1>
        <p className="text-cream/40 text-sm mt-1">Overview of your store performance</p>
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
          <h2 className="font-cinzel text-cream font-semibold text-sm mb-6">Daily Visits (Last 7 Days)</h2>
          <div className="flex items-end gap-2 h-36">
            {analytics.dailyData.map((d) => {
              const heightPct = Math.round((d.visits / maxDay) * 100);
              const label = new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' });
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-cream/40 text-[9px] font-cinzel">{d.visits}</span>
                  <div className="w-full rounded-t-md bg-gold/15 hover:bg-gold/30 transition-colors relative" style={{ height: `${heightPct}%` }}>
                    <div className="absolute inset-x-0 bottom-0 rounded-t-md bg-gradient-to-t from-gold/60 to-gold/20" style={{ height: '100%' }} />
                  </div>
                  <span className="text-cream/40 text-[9px] font-cinzel">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order status */}
        <div className="bg-[#0A0000] border border-gold/10 rounded-2xl p-5">
          <h2 className="font-cinzel text-cream font-semibold text-sm mb-6">Order Status</h2>
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
          <div className="mt-6 pt-4 border-t border-gold/10">
            <p className="text-cream/40 text-xs font-cinzel">Total Revenue</p>
            <p className="font-cinzel text-gold font-bold text-xl mt-1">{formatPrice(totalRevenue)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top books */}
        <div className="bg-[#0A0000] border border-gold/10 rounded-2xl p-5">
          <h2 className="font-cinzel text-cream font-semibold text-sm mb-5">Top Books by Clicks</h2>
          <div className="space-y-3">
            {topBooks.map(({ slug, clicks }, i) => (
              <div key={slug} className="flex items-center gap-3">
                <span className="font-cinzel text-gold/40 text-xs w-4">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-cream/80 text-xs font-cinzel truncate">
                    {slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                  <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold/30"
                      style={{ width: `${Math.round((clicks / maxClicks) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="font-cinzel text-cream/60 text-xs w-8 text-right">{clicks}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-[#0A0000] border border-gold/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-cinzel text-cream font-semibold text-sm">Recent Orders</h2>
            <Link href="/admin/orders" className="text-gold/60 hover:text-gold text-xs font-cinzel flex items-center gap-1 transition-colors">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 py-2 border-b border-gold/5 last:border-0">
                <Circle size={7} className={`flex-shrink-0 ${o.status === 'delivered' ? 'text-green-400 fill-green-400' : o.status === 'cancelled' ? 'text-red-400 fill-red-400' : 'text-gold fill-gold'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-cinzel text-cream text-xs font-semibold truncate">{o.id}</p>
                  <p className="text-cream/40 text-[10px] truncate">{o.customer.name}</p>
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
        </div>
      </div>
    </div>
  );
}
