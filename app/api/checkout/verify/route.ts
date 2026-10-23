import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fireNotifications } from '@/lib/notifications-sender';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyRazorpaySignature, getRazorpayOrder } from '@/lib/razorpay';
import { computeVerifiedSubtotal } from '@/lib/books-data';
import { logError } from '@/lib/error-log';
import { takeStockForOrder } from '@/lib/stock';

// Story 2 (razorpay-integration-user-stories.md): the ONLY place an order
// actually gets written to Supabase and a customer notified. The old
// app/api/orders/create/route.ts, which saved unconditionally with no
// payment involved at all, has been deleted — it was a complete bypass
// around this entire flow and nothing called it anymore.
//
// Three checks stand between "the client says this succeeded" and actually
// saving an order:
//   1. The payment signature is genuine for the given order/payment id pair
//      (rejects a forged or fabricated "success").
//   2. What was actually paid on Razorpay's side for that specific order id
//      matches the subtotal recomputed from the cart submitted *here* — not
//      just that a signature is valid for *some* real payment. Without this,
//      a genuinely-valid signature from paying for a cheap cart could be
//      replayed against this endpoint with a different, more expensive
//      cart, and it would save as confirmed with nothing paid for the
//      difference.
//   3. That specific razorpay_payment_id hasn't already been used to create
//      an order — otherwise the same successful payment could be resubmitted
//      repeatedly to create any number of orders from a single charge.
const EXPECTED_DELIVERY_DAYS = 7;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const {
    id, createdAt, customer, billingAddress, items, paymentMethod,
    razorpayOrderId, razorpayPaymentId, razorpaySignature,
  } = body ?? {};

  // What an admin needs to look a customer up and fix things by hand if this goes wrong
  // (shown in Admin -> System via lib/error-log.ts).
  const context = () => ({
    orderId: id,
    razorpayOrderId,
    razorpayPaymentId,
    customer: { name: customer?.name, phone: customer?.phone, email: customer?.email },
    items: Array.isArray(items)
      ? items.map((i: { bookId?: string; qty?: number }) => ({ bookId: i.bookId, qty: i.qty }))
      : undefined,
  });

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: 'Missing payment verification details.' }, { status: 400 });
  }

  // ── 1. Verify the payment signature server-side, before trusting anything ──
  let signatureValid = false;
  try {
    signatureValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  } catch (err) {
    await logError('checkout/verify', `Signature check failed to run: ${err instanceof Error ? err.message : err}`, { details: context() });
  }
  if (!signatureValid) {
    // Story 3, AC5 — kept in Admin -> System (and the server logs) so support can trace an
    // "I paid but got no confirmation" report.
    await logError('checkout/verify', 'Rejected: payment signature is invalid', { details: context() });
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

  // ── 2. Reject a replayed payment — this exact payment id already paid for
  //      an order, so it can't pay for a new one. A plain pre-check like this
  //      still has a race window between two near-simultaneous requests for
  //      the same payment id; the unique constraint on
  //      orders.razorpay_payment_id (razorpay-columns.sql) is what actually
  //      closes that, this just gives a clean error instead of a raw
  //      constraint-violation for the common case. ──────────────────────────
  const { data: existingOrder } = await admin
    .from('orders')
    .select('id')
    .eq('razorpay_payment_id', razorpayPaymentId)
    .maybeSingle();
  if (existingOrder) {
    await logError('checkout/verify', 'Rejected: this payment id was already used for an order', {
      severity: 'warning',
      details: { ...context(), existingOrderId: existingOrder.id },
    });
    return NextResponse.json({ error: 'This payment has already been used for an order.' }, { status: 409 });
  }

  let userId: string | null = null;
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length);
    const { data: { user: verifiedUser } } = await supabase.auth.getUser(token);
    userId = verifiedUser?.id ?? null;
  }

  // ── 3. Recompute the trusted subtotal, same as create-order ────────────────
  let subtotal: number;
  let priceByBookId: Record<string, number>;
  try {
    const result = await computeVerifiedSubtotal(
      items.map((i: { bookId: string; qty: number }) => ({ bookId: i.bookId, qty: i.qty })),
    );
    subtotal = result.subtotal;
    priceByBookId = result.priceByBookId;
  } catch (err) {
    await logError('checkout/verify', `Could not recompute the order total: ${err instanceof Error ? err.message : err}`, {
      details: context(),
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not confirm the order total.' },
      { status: 400 },
    );
  }

  // ── 4. Confirm the cart being saved actually matches what was paid —
  //      the signature only proves the payment is real, not that it paid
  //      for *this* cart. Without this, a genuinely-valid payment for a
  //      cheap order could be replayed here with a different (pricier) cart
  //      and it would save as confirmed with nothing paid for the gap. ──────
  let razorpayOrder;
  try {
    razorpayOrder = await getRazorpayOrder(razorpayOrderId);
  } catch (err) {
    await logError('checkout/verify', `PAYMENT NOT CONFIRMED: could not fetch the order from Razorpay (${err instanceof Error ? err.message : err})`, {
      severity: 'critical',
      details: context(),
    });
    return NextResponse.json({ error: 'Could not confirm the payment. If you were charged, please contact support.' }, { status: 502 });
  }
  const expectedAmountPaise = Math.round(subtotal * 100);
  if (razorpayOrder.status !== 'paid' || razorpayOrder.amount_paid !== expectedAmountPaise) {
    await logError('checkout/verify', 'PAYMENT NOT ACCEPTED: amount paid does not match the order total', {
      severity: 'critical',
      details: {
        ...context(),
        razorpayStatus: razorpayOrder.status,
        amountPaidPaise: razorpayOrder.amount_paid,
        expectedAmountPaise,
      },
    });
    return NextResponse.json({ error: 'The amount paid does not match this order. If you were charged, please contact support.' }, { status: 400 });
  }

  const expectedDeliveryDate = new Date(createdAt);
  expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + EXPECTED_DELIVERY_DAYS);

  // ── 5. Save order to Supabase — only now that payment is verified ──────────
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
    await logError('checkout/verify', `PAID BUT ORDER NOT SAVED: ${orderError.message}`, {
      severity: 'critical',
      details: { ...context(), subtotal },
    });
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // ── 6. Save order items, with server-verified prices (not client-sent) ─────
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
  if (itemsError) {
    await logError('checkout/verify', `ORDER SAVED WITHOUT ITS ITEMS: ${itemsError.message}`, {
      severity: 'critical',
      details: { ...context(), subtotal },
    });
  }

  // ── 6b. Take the copies off the shelf (books whose copies are counted) ──────
  // The customer has already paid, so this never fails the order. If two people paid for the
  // last copy at once, the shortfall is recorded as critical so the shop can sort it out.
  const stock = await takeStockForOrder(
    items.map((i: { bookId: string; qty: number }) => ({ bookId: i.bookId, qty: i.qty })),
  );
  if (stock.shortfalls.length > 0) {
    await logError('checkout/verify', 'OVERSOLD: the customer paid for more copies than were in stock', {
      severity: 'critical',
      details: { ...context(), shortfalls: stock.shortfalls },
    });
  }
  if (stock.failed) {
    await logError('checkout/verify', 'Order saved, but its stock count could not be updated', {
      severity: 'warning',
      details: { orderId: id },
    });
  }

  // ── 7. Fire the order-placed notification ───────────────────────────────────
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
    .catch((err) => logError('checkout/verify', `Order saved but its notification failed: ${err instanceof Error ? err.message : err}`, {
      severity: 'warning',
      details: { orderId: id },
    }));

  return NextResponse.json({ success: true, orderId: id });
}
