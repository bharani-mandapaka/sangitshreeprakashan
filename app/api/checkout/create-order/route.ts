import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/razorpay';
import { computeVerifiedSubtotal } from '@/lib/books-data';
import { validateCheckoutDetails } from '@/lib/checkout-validation';
import { lookupPincode } from '@/lib/pincode-lookup';
import { logError } from '@/lib/error-log';

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

  // Check the shipping details *before* a payment exists. Rejecting them later,
  // in verify, would leave a customer charged with no order saved.
  const { errors } = validateCheckoutDetails({ ...body?.customer, ...body?.billingAddress, address: body?.billingAddress?.line1 });
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: 'Please correct your shipping details and try again.', fieldErrors: errors },
      { status: 400 },
    );
  }

  // The PIN has the right shape — now check it exists in the bundled official
  // directory. A PIN that isn't listed is refused unless the customer ticked "My PIN
  // code is correct" (the directory is refreshed about yearly, so it can lag behind
  // brand-new PINs).
  const pincode = String(body?.billingAddress?.pincode ?? '').trim();
  const pin = lookupPincode(pincode);
  if (pin.status === 'invalid' && body?.pincodeConfirmed !== true) {
    return NextResponse.json(
      {
        error: 'Please correct your shipping details and try again.',
        fieldErrors: { pincode: 'We couldn’t find this PIN code. Please check it, or tick “My PIN code is correct” if you’re sure.' },
      },
      { status: 400 },
    );
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
    await logError('checkout/create-order', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not start payment. Please try again.' },
      { status: 500 },
    );
  }
}
