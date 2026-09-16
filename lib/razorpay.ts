import { createHmac, timingSafeEqual } from 'crypto';

// Talks to Razorpay's REST API directly via fetch — same lean-dependency
// pattern as lib/notifications-sender.ts's WhatsApp integration (raw fetch to
// Meta's Cloud API rather than pulling in an SDK). Razorpay's Orders API only
// needs HTTP Basic Auth (key_id:key_secret) for order creation, and payment
// signature verification is a single HMAC check — neither needs their Node
// SDK.
//
// RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET come from the Razorpay dashboard.
// Test-mode keys (rzp_test_...) are available immediately on signup, before
// any GST/PAN business verification completes — only *live* keys
// (rzp_live_...) require that approval. See the Open Questions in
// razorpay-integration-user-stories.md.

function getCredentials(): { keyId: string; keySecret: string } {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set — cannot talk to Razorpay.');
  }
  return { keyId, keySecret };
}

export interface RazorpayOrder {
  id: string;
  amount: number;   // paise
  currency: string;
}

export interface RazorpayOrderStatus {
  id: string;
  amount: number;       // paise — what the order was created for
  amount_paid: number;  // paise — what has actually been paid against it
  status: string;        // 'created' | 'attempted' | 'paid'
}

/**
 * Creates an order on Razorpay's servers (Story 1, AC1) — this is what the
 * browser's checkout widget needs before it can open. `amountPaise` must
 * already be the server-verified amount (see
 * app/api/checkout/create-order/route.ts, which computes it from real book
 * prices rather than trusting the client) — this function does not
 * recompute or validate it.
 */
export async function createRazorpayOrder(amountPaise: number, receipt: string): Promise<RazorpayOrder> {
  const { keyId, keySecret } = getCredentials();
  const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.description ?? `Razorpay order creation failed (${res.status}).`);
  }
  return { id: data.id, amount: data.amount, currency: data.currency };
}

/**
 * Fetches an order's real state directly from Razorpay — used by
 * app/api/checkout/verify/route.ts to confirm that what's about to be saved
 * (the cart submitted in the verify request) actually matches what was
 * charged for that specific order. The signature check alone only proves
 * "this payment_id/order_id/signature triple is authentic" — it says
 * nothing about whether the order being saved matches what was paid for,
 * since a genuinely-valid payment for a cheap order could otherwise be
 * replayed against verify with a different, more expensive cart.
 */
export async function getRazorpayOrder(orderId: string): Promise<RazorpayOrderStatus> {
  const { keyId, keySecret } = getCredentials();
  const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: { Authorization: `Basic ${basicAuth}` },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.description ?? `Could not fetch Razorpay order (${res.status}).`);
  }
  return { id: data.id, amount: data.amount, amount_paid: data.amount_paid, status: data.status };
}

/**
 * Independently verifies a completed payment's signature (Story 2, AC2)
 * server-side, using the secret key — never trust a client-reported
 * "payment succeeded" on its own. Per Razorpay's documented scheme:
 * signature = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret).
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): boolean {
  const { keySecret } = getCredentials();
  const expected = createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const a = Buffer.from(razorpaySignature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
