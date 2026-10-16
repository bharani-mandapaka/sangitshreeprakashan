import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fireNotifications } from '@/lib/notifications-sender';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Rough estimate shown to the customer — dispatch (2-4 business days, per the
// notification copy) plus typical transit time. Not tied to any courier API;
// just a friendly heads-up, not a guarantee.
const EXPECTED_DELIVERY_DAYS = 7;

export async function POST(req: NextRequest) {
  // Only used to verify the caller's bearer token below — a plain anon-key
  // client is fine for that, it's just checking a JWT's signature.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  // The actual inserts use the service-role client instead. insert_orders and
  // insert_order_items used to be `with check (true)` so the anon-key client
  // could write here — but that meant anyone could also POST straight to
  // Supabase's PostgREST API with the public anon key and forge orders into
  // another customer's history, bypassing this route (and its userId
  // verification above) entirely. Those permissive policies are now dropped;
  // only the service-role key can insert into these tables at all.
  const admin = getSupabaseAdmin();

  const body = await req.json();
  const { id, createdAt, customer, billingAddress, items, subtotal, paymentMethod } = body;

  // ── 0. Resolve the signed-in user from the request's own bearer token ──────
  // We never trust a userId sent in the body — the client-supplied value is
  // discarded (see checkout/page.tsx, which no longer sends one) and instead
  // we verify the session's access_token ourselves. Guests simply send no
  // Authorization header, which resolves to a null user_id below.
  let userId: string | null = null;
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length);
    const { data: { user: verifiedUser } } = await supabase.auth.getUser(token);
    userId = verifiedUser?.id ?? null;
  }

  const expectedDeliveryDate = new Date(createdAt);
  expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + EXPECTED_DELIVERY_DAYS);

  // ── 1. Save order to Supabase ───────────────────────────────────────────────
  const { error: orderError } = await admin.from('orders').insert({
    id,
    created_at:             createdAt,
    status:                 'confirmed',
    customer_name:          customer.name,
    customer_email:         customer.email,
    customer_phone:         customer.phone,
    address_line1:          billingAddress.line1,
    address_city:           billingAddress.city,
    address_state:          billingAddress.state,
    address_pincode:        billingAddress.pincode,
    subtotal,
    payment_method:         paymentMethod,
    user_id:                userId ?? null, // null for guest checkout (no account)
    expected_delivery_date: expectedDeliveryDate.toISOString(),
  });

  if (orderError) {
    console.error('[orders/create] order insert error:', orderError);
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // ── 2. Save order items to Supabase ─────────────────────────────────────────
  const orderItems = items.map((item: {
    bookId: string; sku: string; titleEnglish: string; titleHindi: string; qty: number; price: number;
  }) => ({
    order_id:      id,
    book_id:       item.bookId,
    sku:           item.sku,
    title_english: item.titleEnglish,
    title_hindi:   item.titleHindi,
    qty:           item.qty,
    price:         item.price,
  }));

  const { error: itemsError } = await admin.from('order_items').insert(orderItems);
  if (itemsError) console.error('[orders/create] items insert error:', itemsError);

  // ── 3. Build shared variables ───────────────────────────────────────────────
  const dateStr = new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const itemsListPlain = items
    .map((i: { titleEnglish: string; qty: number; price: number }) =>
      `• ${i.titleEnglish} × ${i.qty}  —  ₹${(i.price * i.qty).toLocaleString('en-IN')}`,
    )
    .join('\n');

  const expectedDeliveryStr = expectedDeliveryDate.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // Vars for notification templates — used by BOTH the customer-facing
  // "Order Confirmation" rule and any admin/staff rules configured for this
  // trigger. {{customer_email}} / {{customer_phone}} let a rule's
  // recipients/whatsapp_numbers dynamically resolve to this specific order's
  // customer (see lib/notifications-sender.ts) instead of a fixed address.
  const notifVars: Record<string, string> = {
    order_id:                id,
    order_date:               dateStr,
    customer_name:            customer.name,
    customer_email:           customer.email,
    customer_phone:           customer.phone,
    items_list:               itemsListPlain,
    shipping_address:         `${billingAddress.line1}, ${billingAddress.city}, ${billingAddress.state} — ${billingAddress.pincode}`,
    order_total:              `₹${subtotal.toLocaleString('en-IN')}`,
    payment_method:           paymentMethod,
    expected_delivery_date:   expectedDeliveryStr,
  };

  // ── 4. Fire order-placed notifications ──────────────────────────────────────
  // This is now the ONLY thing that emails/WhatsApps the customer their order
  // confirmation — it used to be a second, hardcoded Resend call running
  // alongside this, which would now double-send once a customer-facing rule
  // exists for this trigger. See supabase/schema.sql for the seeded
  // "Order Confirmation (Customer)" rule.
  await fireNotifications('order_placed', notifVars)
    .catch((err) => console.error('[orders/create] notification error:', err));

  return NextResponse.json({ success: true, orderId: id });
}
