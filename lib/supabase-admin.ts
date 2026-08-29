import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Server-only client, built with the Supabase SERVICE ROLE key instead of the
// public anon key. The service role key bypasses Row Level Security entirely,
// so this file must NEVER be imported from a 'use client' component or any
// code that ends up in the browser bundle — it belongs in API routes only.
//
// SUPABASE_SERVICE_ROLE_KEY is intentionally NOT prefixed NEXT_PUBLIC_, which
// keeps Next.js from inlining it into client JS. Set it in .env.local and in
// Vercel (Production + Preview + Development), server-only scope.
let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — the admin API routes cannot read orders without them.',
      );
    }
    adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}
