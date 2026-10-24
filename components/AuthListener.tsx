'use client';

import { useEffect } from 'react';
import { loadSupabase } from '@/lib/supabase-lazy';
import { useAuthStore } from '@/lib/auth-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { useAddressesStore } from '@/lib/addresses-store';

// Pages where the customer's session is needed straight away (they redirect, pre-fill or
// show account data), so there is no point waiting for the browser to go idle.
const NEEDS_AUTH_NOW = /^\/(profile|login|signup|checkout|orders)(\/|$)/;

/**
 * Keeps `useAuthStore` (and, as a side effect, the wishlist and saved-address caches) in sync with
 * the actual Supabase Auth session — mounted once in SiteShell. Renders
 * nothing; it's a listener, not UI.
 *
 * Supabase's browser library (about 60 KB compressed) is not part of a page's first JavaScript:
 * it is fetched once the page has finished its first render and the browser is idle (or at once
 * on the account pages above). Sign-in state therefore appears a moment after the page, which
 * is invisible on shop pages and instant where it matters.
 */
export default function AuthListener() {
  const setUser    = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const loadWishlist  = useWishlistStore((s) => s.load);
  const clearWishlist = useWishlistStore((s) => s.clear);
  const loadAddresses  = useAddressesStore((s) => s.load);
  const clearAddresses = useAddressesStore((s) => s.clear);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const syncUserData = (userId: string | undefined) => {
      if (userId) { loadWishlist(userId); loadAddresses(userId); }
      else { clearWishlist(); clearAddresses(); }
    };

    const start = async () => {
      let supabase;
      try {
        supabase = await loadSupabase();
      } catch {
        // Supabase env vars missing (e.g. a preview build without them) — treat
        // as logged out rather than crashing the whole site.
        if (!cancelled) setLoading(false);
        return;
      }
      if (cancelled) return;

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled) return;
        setUser(session?.user ?? null);
        setLoading(false);
        syncUserData(session?.user?.id);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        syncUserData(session?.user?.id);
      });
      unsubscribe = () => subscription.unsubscribe();
    };

    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const w = window as IdleWindow;

    let cancelWait: () => void;
    if (NEEDS_AUTH_NOW.test(window.location.pathname)) {
      void start();
      cancelWait = () => {};
    } else if (w.requestIdleCallback && w.cancelIdleCallback) {
      const id = w.requestIdleCallback(() => void start(), { timeout: 800 });
      cancelWait = () => w.cancelIdleCallback?.(id);
    } else {
      const id = window.setTimeout(() => void start(), 300);   // Safari has no requestIdleCallback
      cancelWait = () => window.clearTimeout(id);
    }

    return () => {
      cancelled = true;
      cancelWait();
      unsubscribe?.();
    };
  }, [setUser, setLoading, loadWishlist, clearWishlist, loadAddresses, clearAddresses]);

  return null;
}
