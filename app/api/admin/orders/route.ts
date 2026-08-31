import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isAdminRequest } from '@/lib/admin-auth';

const ALL_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

// Admin reads/writes go through here instead of the anon-key client directly,
// because orders/order_items SELECT is scoped to `auth.uid() = user_id` (see
// supabase/schema.sql) and insert/update no longer have permissive anon
// policies either — the admin panel has no Supabase Auth session of its own
// (it uses the separate signed-cookie admin session, see lib/admin-auth.ts),
// so this route uses the server-only service-role key, which bypasses RLS.
//
// Every handler below checks isAdminRequest() first — without that, this
// route would let anyone with the URL read or rewrite every customer's
// orders using the service-role key with no auth at all.
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

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

// Status updates (the order-detail dropdown in app/admin/orders/page.tsx)
// used to go straight to Supabase with the anon key, which required
// `update_orders using (true)` with no `with check` — meaning anyone with the
// anon key could rewrite ANY column of ANY order, including reassigning
// user_id to themselves and then reading it back through the SELECT policy.
// That policy is now dropped entirely; only this route (service-role,
// admin-gated) can update an order.
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = body?.id;
  const status = body?.status;

  if (typeof id !== 'string' || typeof status !== 'string' || !ALL_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'A valid order id and status are required.' }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from('orders')
    .update({ status })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
