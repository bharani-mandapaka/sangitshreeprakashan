'use client';

import { useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { useAddressesStore } from '@/lib/addresses-store';

/**
 * Keeps `useAuthStore` (and, as a side effect, the wishlist and saved-address caches) in sync with
 * the actual Supabase Auth session — mounted once in SiteShell. Renders
 * nothing; it's a listener, not UI.
 */
export default function AuthListener() {
  const setUser    = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const loadWishlist  = useWishlistStore((s) => s.load);
  const clearWishlist = useWishlistStore((s) => s.clear);
  const loadAddresses  = useAddressesStore((s) => s.load);
  const clearAddresses = useAddressesStore((s) => s.clear);

  useEffect(() => {
    let supabase;
    try {
      supabase = getSupabase();
    } catch {
      // Supabase env vars missing (e.g. a preview build without them) — treat
      // as logged out rather than crashing the whole site.
      setLoading(false);
      return;
    }

    const syncUserData = (userId: string | undefined) => {
      if (userId) { loadWishlist(userId); loadAddresses(userId); }
      else { clearWishlist(); clearAddresses(); }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      syncUserData(session?.user?.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      syncUserData(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, loadWishlist, clearWishlist, loadAddresses, clearAddresses]);

  return null;
}
