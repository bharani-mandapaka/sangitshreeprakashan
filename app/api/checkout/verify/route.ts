import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fireNotifications } from '@/lib/notifications-sender';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { computeVerifiedSubtotal } from '@/lib/books-data';

// Story 2 (razorpay-integration-user-stories.md): the ONLY place an order
// actually gets written to Supabase and a customer notified, replacing
// app/api/orders/create/route.ts's old behavior of saving unconditionally.
// That route is left in place (nothing else calls it from the checkout flow
// anymore) rather than deleted, in case anything still references it.
//
// Mirrors app/api/orders/create/route.ts's insert + notification logic
// closely, with two differences: (1) the payment signature is verified
// first, and the whole thing 400s if it doesn't check out — a forged or
// replayed "success" from the client is rejected, not trusted (Story 2, AC2);
// (2) the subtotal is recomputed from real book prices here too, exactly
// like create-order did, rather than trusting whatever the client sends back
// after payment.
const EXPECTED_DELIVERY_DAYS = 7;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const {
    id, createdAt, customer, billingAddress, items, paymentMethod,
    razorpayOrderId, razorpayPaymentId, razorpaySignature,
  } = body ?? {};

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: 'Missing payment verification details.' }, { status: 400 });
  }

  // ── 1. Verify the payment signature server-side, before trusting anything ──
  let signatureValid = false;
  try {
    signatureValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  } catch (err) {
    console.error('[checkout/verify] signature check error:', err);
  }
  if (!signatureValid) {
    // Story 3, AC5 — visible in server logs for support to trace a "I paid
    // but got no confirmation" report, even without a dedicated admin view.
    console.error('[checkout/verify] REJECTED invalid signature', { razorpayOrderId, razorpayPaymentId });
    return NextResponse.json({ error: 'Payment could not be verified. If you were charged, please contact support.' }, { status: 400 });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'No items to order.' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const admin = getSupabaseAdmin();

  let userId: string | null = null;
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length);
    const { data: { user: verifiedUser } } = await supabase.auth.getUser(token);
    userId = verifiedUser?.id ?? null;
  }

  // ── 2. Recompute the trusted subtotal, same as create-order ────────────────
  let subtotal: number;
  let priceByBookId: Record<string, number>;
  try {
    const result = await computeVerifiedSubtotal(
      items.map((i: { bookId: string; qty: number }) => ({ bookId: i.bookId, qty: i.qty })),
    );
    subtotal = result.subtotal;
    priceByBookId = result.priceByBookId;
  } catch (err) {
    console.error('[checkout/verify] subtotal recompute error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not confirm the order total.' },
      { status: 400 },
    );
  }

  const expectedDeliveryDate = new Date(createdAt);
  expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + EXPECTED_DELIVERY_DAYS);

  // ── 3. Save order to Supabase — only now that payment is verified ──────────
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
    payment_method:         paymentMethod ?? 'razorpay',
    user_id:                userId ?? null,
    expected_delivery_date: expectedDeliveryDate.toISOString(),
    razorpay_order_id:      razorpayOrderId,
    razorpay_payment_id:    razorpayPaymentId,
  });

  if (orderError) {
    console.error('[checkout/verify] order insert error:', orderError);
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // ── 4. Save order items, with server-verified prices (not client-sent) ─────
  const orderItems = items.map((item: {
    bookId: string; sku: string; titleEnglish: string; titleHindi: string; qty: number;
  }) => ({
    order_id:      id,
    book_id:       item.bookId,
    sku:           item.sku,
    title_english: item.titleEnglish,
    title_hindi:   item.titleHindi,
    qty:           item.qty,
    price:         priceByBookId[item.bookId],
  }));

  const { error: itemsError } = await admin.from('order_items').insert(orderItems);
  if (itemsError) console.error('[checkout/verify] items insert error:', itemsError);

  // ── 5. Fire the order-placed notification — same as app/api/orders/create ──
  const dateStr = new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const itemsListPlain = items
    .map((i: { bookId: string; titleEnglish: string; qty: number }) =>
      `• ${i.titleEnglish} × ${i.qty}  —  ₹${(priceByBookId[i.bookId] * i.qty).toLocaleString('en-IN')}`,
    )
    .join('\n');
  const expectedDeliveryStr = expectedDeliveryDate.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const notifVars: Record<string, string> = {
    order_id:              id,
    order_date:            dateStr,
    customer_name:         customer.name,
    customer_email:        customer.email,
    customer_phone:        customer.phone,
    items_list:            itemsListPlain,
    shipping_address:      `${billingAddress.line1}, ${billingAddress.city}, ${billingAddress.state} — ${billingAddress.pincode}`,
    order_total:           `₹${subtotal.toLocaleString('en-IN')}`,
    payment_method:        paymentMethod ?? 'razorpay',
    expected_delivery_date: expectedDeliveryStr,
  };

  await fireNotifications('order_placed', notifVars)
    .catch((err) => console.error('[checkout/verify] notification error:', err));

  return NextResponse.json({ success: true, orderId: id });
}
