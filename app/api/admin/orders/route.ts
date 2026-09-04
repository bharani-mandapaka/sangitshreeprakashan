import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isAdminRequest } from '@/lib/admin-auth';
import { fireNotifications } from '@/lib/notifications-sender';
import { CONTACT } from '@/lib/utils';

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

function itemsListFrom(items: { title_english: string; qty: number; price: number }[]): string {
  return items
    .map((i) => `• ${i.title_english} × ${i.qty}  —  ₹${(i.price * i.qty).toLocaleString('en-IN')}`)
    .join('\n');
}

// Status updates (the order-detail dropdown in app/admin/orders/page.tsx)
// used to go straight to Supabase with the anon key, which required
// `update_orders using (true)` with no `with check` — meaning anyone with the
// anon key could rewrite ANY column of ANY order, including reassigning
// user_id to themselves and then reading it back through the SELECT policy.
// That policy is now dropped entirely; only this route (service-role,
// admin-gated) can update an order.
//
// This also fires the order_shipped/order_delivered customer notifications
// (see supabase/schema.sql for the seeded rules) — but only the first time an
// order transitions into that status. shipped_at/delivered_at start null and
// only ever get set once, which both supplies the "date & time" shown to the
// customer and guards against re-sending if the status is later toggled
// around (the "no duplicate notifications" requirement from the story doc).
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = body?.id;
  const status = body?.status;
  const trackingId = typeof body?.trackingId === 'string' ? body.trackingId.trim() : '';
  const courierService = typeof body?.courierService === 'string' ? body.courierService.trim() : '';

  if (typeof id !== 'string' || typeof status !== 'string' || !ALL_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'A valid order id and status are required.' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: existing, error: fetchError } = await admin
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ error: fetchError?.message ?? 'Order not found.' }, { status: 404 });
  }

  const firstShip = status === 'shipped' && !existing.shipped_at;
  const firstDeliver = status === 'delivered' && !existing.delivered_at;

  if (firstShip && (!trackingId || !courierService)) {
    return NextResponse.json(
      { error: 'Tracking ID and courier service are required to mark an order as shipped.' },
      { status: 400 },
    );
  }

  const patch: Record<string, unknown> = { status };
  if (firstShip) {
    patch.shipped_at = new Date().toISOString();
    patch.tracking_id = trackingId;
    patch.courier_service = courierService;
  } else if (status === 'shipped' && (trackingId || courierService)) {
    // Already shipped once — allow correcting tracking info without treating
    // it as a brand-new shipment (no re-notification).
    if (trackingId) patch.tracking_id = trackingId;
    if (courierService) patch.courier_service = courierService;
  }
  if (firstDeliver) {
    patch.delivered_at = new Date().toISOString();
  }

  const { error: updateError } = await admin.from('orders').update(patch).eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // ── Fire the relevant customer notification, only on first transition ──────
  const notifyError = (err: unknown) => console.error('[admin/orders PATCH] notification error:', err);

  if (firstShip) {
    fireNotifications('order_shipped', {
      order_id: id,
      customer_name: existing.customer_name,
      customer_email: existing.customer_email,
      customer_phone: existing.customer_phone,
      tracking_id: trackingId,
      courier_service: courierService,
    }).catch(notifyError);
  }

  if (firstDeliver) {
    const deliveredAtStr = new Date(patch.delivered_at as string).toLocaleString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    fireNotifications('order_delivered', {
      order_id: id,
      customer_name: existing.customer_name,
      customer_email: existing.customer_email,
      customer_phone: existing.customer_phone,
      items_list: itemsListFrom(existing.order_items ?? []),
      delivered_at: deliveredAtStr,
      support_email: CONTACT.email1,
      support_phone: CONTACT.phone1,
    }).catch(notifyError);
  }

  return NextResponse.json({ success: true });
}
