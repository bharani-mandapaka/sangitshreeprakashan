import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Admin reads now go through here instead of the anon-key client directly,
// because orders/order_items SELECT is scoped to `auth.uid() = user_id` (see
// supabase/schema.sql) — the admin panel has no Supabase Auth session of its
// own (still the localStorage password gate, see CLAUDE.md Phase 2), so the
// anon key alone can no longer see every order. This route uses the
// server-only service-role key, which bypasses RLS, to fetch the full list.
//
// Known limitation: this route itself isn't gated behind real admin auth yet
// (matching the existing localStorage-password admin panel) — replacing that
// with proper Supabase Auth admin accounts is tracked as Phase 2 work.
export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ orders: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load orders.' },
      { status: 500 },
    );
  }
}
