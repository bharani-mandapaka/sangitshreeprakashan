'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Heart, Package, LogOut, Loader2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/lib/auth-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { getSupabase, type DbOrder } from '@/lib/supabase';
import { getBookById } from '@/lib/books';
import { formatPrice } from '@/lib/utils';
import BookCard from '@/components/BookCard';

type Tab = 'overview' | 'wishlist' | 'orders';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ProfilePage() {
  const router = useRouter();
  const user        = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const signOut     = useAuthStore((s) => s.signOut);
  const wishlistIds = useWishlistStore(useShallow((s) => Array.from(s.bookIds)));

  const [tab, setTab] = useState<Tab>('overview');
  const [orders,        setOrders]        = useState<DbOrder[]>([]);
  const [ordersLoading,  setOrdersLoading] = useState(true);
  const [ordersError,    setOrdersError]   = useState('');

  // Not signed in — send to login once we're sure (avoid bouncing during the
  // initial session check).
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setOrdersLoading(true);
    getSupabase()
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setOrdersError(error.message);
        else setOrders((data as DbOrder[]) ?? []);
        setOrdersLoading(false);
      });
    return () => { cancelled = true; };
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-dark pt-20 lg:pt-24 flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={28} />
      </div>
    );
  }

  const wishlistBooks = wishlistIds
    .map(getBookById)
    .filter((b): b is NonNullable<typeof b> => !!b);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const name = (user.user_metadata?.full_name as string | undefined) || user.email?.split('@')[0] || 'Account';

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview',                       icon: <User size={14} /> },
    { id: 'wishlist', label: `Wishlist (${wishlistBooks.length})`, icon: <Heart size={14} /> },
    { id: 'orders',   label: `Orders (${orders.length})`,        icon: <Package size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-dark pt-20 lg:pt-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#0F0000] to-dark py-12 px-4 sm:px-6 lg:px-8 border-b border-gold/10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
            <User size={28} className="text-gold" />
          </div>
          <div>
            <h1 className="font-cinzel text-2xl font-bold text-cream">{name}</h1>
            <p className="text-cream/50 text-sm">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gold/10 mb-8 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 font-cinzel text-sm whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-gold text-gold'
                  : 'border-transparent text-cream/50 hover:text-cream'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="max-w-md space-y-6">
            <div className="gold-border rounded-2xl p-6 bg-[#0A0000] space-y-4">
              <div>
                <p className="text-cream/40 text-xs uppercase tracking-widest font-cinzel mb-1">Name</p>
                <p className="text-cream">{name}</p>
              </div>
              <div>
                <p className="text-cream/40 text-xs uppercase tracking-widest font-cinzel mb-1">Email</p>
                <p className="text-cream">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 border border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 font-cinzel text-sm px-5 py-3 rounded-xl transition-all"
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        )}

        {/* Wishlist */}
        {tab === 'wishlist' && (
          wishlistBooks.length === 0 ? (
            <div className="text-center py-16">
              <Heart size={32} className="text-cream/20 mx-auto mb-4" />
              <p className="text-cream/50 mb-4">Your wishlist is empty.</p>
              <Link href="/books" className="text-gold hover:text-gold-300 font-cinzel text-sm transition-colors">
                Browse Books →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {wishlistBooks.map((b) => <BookCard key={b.id} book={b} />)}
            </div>
          )
        )}

        {/* Orders */}
        {tab === 'orders' && (
          <div>
            {ordersLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-gold" size={24} />
              </div>
            ) : ordersError ? (
              <p className="text-red-400 text-sm text-center py-16">
                Couldn&apos;t load orders: {ordersError}
              </p>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <Package size={32} className="text-cream/20 mx-auto mb-4" />
                <p className="text-cream/50 mb-4">No orders yet.</p>
                <Link href="/books" className="text-gold hover:text-gold-300 font-cinzel text-sm transition-colors">
                  Browse Books →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="gold-border rounded-2xl p-5 bg-[#0A0000]">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div>
                        <p className="font-cinzel text-gold text-sm font-bold">{order.id}</p>
                        <p className="text-cream/40 text-xs mt-0.5">{fmtDate(order.created_at)}</p>
                      </div>
                      <span className="text-[10px] font-cinzel font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-gold/20 text-gold/80">
                        {order.status}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {(order.order_items ?? []).map((item) => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span className="text-cream/70">{item.title_english} × {item.qty}</span>
                          <span className="text-cream/50">{formatPrice(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gold/10 pt-2 flex justify-between">
                      <span className="text-cream/40 text-xs font-cinzel uppercase">Total</span>
                      <span className="font-cinzel text-gold font-bold text-sm">{formatPrice(order.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
