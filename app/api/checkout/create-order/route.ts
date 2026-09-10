import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/razorpay';
import { computeVerifiedSubtotal } from '@/lib/books-data';

// Story 1 (razorpay-integration-user-stories.md): starts a real payment.
// Deliberately does NOT touch Supabase's orders table at all — no order
// exists until app/api/checkout/verify/route.ts confirms the payment
// actually succeeded (Story 2). This route only asks Razorpay to open a tab
// for a payment and hands back what the browser's checkout widget needs.
//
// Works identically for guest and signed-in checkout (Story 1, AC5) — no
// auth check here, same as how the amount is computed the same way
// regardless of who's paying.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const items = body?.items;
  const clientOrderId = body?.orderId; // SSP's own id (generateOrderId()), used only as Razorpay's `receipt` for reconciliation — never trusted for the amount.

  if (!Array.isArray(items) || items.length === 0 || typeof clientOrderId !== 'string') {
    return NextResponse.json({ error: 'Cart items and an order id are required.' }, { status: 400 });
  }

  try {
    // The amount charged always matches real book prices at this moment,
    // computed here — never the client-supplied subtotal (Story 1, AC3).
    const { subtotal } = await computeVerifiedSubtotal(
      items.map((i: { bookId: string; qty: number }) => ({ bookId: i.bookId, qty: i.qty })),
    );

    const amountPaise = Math.round(subtotal * 100);
    const razorpayOrder = await createRazorpayOrder(amountPaise, clientOrderId);

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      amount:          razorpayOrder.amount,
      currency:        razorpayOrder.currency,
      keyId:           process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    // Story 1, AC4 — a clear failure the customer sees, never a silent
    // proceed-as-if-it-worked.
    console.error('[checkout/create-order] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not start payment. Please try again.' },
      { status: 500 },
    );
  }
}
