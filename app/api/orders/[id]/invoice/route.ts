import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getSupabaseServer } from '@/lib/supabase';

// Customer-facing "Download Invoice" route — /profile's Orders tab, logged-in
// customers only (guest orders aren't listed there today, so there's nothing
// to link from for them yet; see order-invoice-user-stories.md Story 8 for
// that separate, still-open problem).
//
// Deliberately NOT admin-cookie gated like app/api/admin/orders/[id]/invoice
// — this checks the *customer's* own Supabase Auth session instead, the same
// way app/api/orders/create/route.ts verifies the caller's bearer token
// rather than trusting anything in the request body. orders/order_items SELECT
// is RLS-scoped to auth.uid() = user_id, so in principle the anon-key client
// could be used directly here too -- using the service-role client plus an
// explicit ownership check instead keeps this route symmetric with the admin
// one (same invoice_number-assignment logic) and means the lazy invoice-number
// write goes through the same server-only path.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }
  const token = authHeader.slice('Bearer '.length);
  const { data: { user } } = await getSupabaseServer().auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: 'Your session has expired — please sign in again.' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { id } = params;

  const { data: order, error: fetchError } = await admin
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  // Same 404 whether the order doesn't exist or belongs to someone else —
  // doesn't leak which orders exist to a customer poking at other ids.
  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  if (order.invoice_number == null) {
    const { data: nextNumber, error: rpcError } = await admin.rpc('next_invoice_number');
    if (rpcError) {
      return NextResponse.json({ error: `Failed to assign an invoice number: ${rpcError.message}` }, { status: 500 });
    }
    const { error: updateError } = await admin
      .from('orders')
      .update({ invoice_number: nextNumber })
      .eq('id', id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    order.invoice_number = nextNumber;
  }

  return NextResponse.json({ order });
}
