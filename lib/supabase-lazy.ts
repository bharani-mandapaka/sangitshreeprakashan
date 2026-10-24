'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * The browser Supabase client, loaded the first time it's needed instead of being bundled
 * into every page.
 *
 * Supabase's browser library is about 60 KB (compressed) and was part of the first
 * JavaScript every visitor downloaded, even though nothing on a page needs it until
 * the auth listener runs or a customer signs in, saves an address or wishlists a book.
 * Importing it dynamically keeps it out of that first download. It is still the same
 * singleton (getSupabase() in lib/supabase.ts), just fetched on demand.
 */
export async function loadSupabase(): Promise<SupabaseClient> {
  const { getSupabase } = await import('./supabase');
  return getSupabase();
}
