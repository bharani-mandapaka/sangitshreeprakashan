# Razorpay Payment Integration — User Stories

**Product:** Sangit Shree Prakashan
**Feature:** Real payment processing at checkout (replacing the current mock payment step)
**Author:** Shreeyanshi Chandra

## Context

Checkout today (`app/checkout/page.tsx`) has a payment step that looks real —
a UPI/card/netbanking picker styled like Razorpay's own checkout modal, a
"Secured by Razorpay" badge, a 2.8-second processing spinner — but no money
ever moves and no payment gateway is called. `handlePay()` waits out the
spinner, then unconditionally calls `POST /api/orders/create`, which saves the
order to Supabase and fires the "Order Placed" customer notification. This
happens the same way whether the mock payment "succeeds" or not, because
there's no real failure path to test.

This is the last blocker on Phase 1 (per `CLAUDE.md`): Razorpay account
approval needs Bharani's GST/PAN verification, which is still pending. These
stories describe the real integration so build work can start the moment the
Razorpay account is approved, without waiting on design beyond what already
exists in the current checkout UI.

The core shift: **today, "payment" is cosmetic and the order is always saved
regardless. With real Razorpay, the order must only be saved and the customer
only notified once payment is actually verified — not before.** That's a
meaningful behavior change from what exists now, not just a UI swap.

---

## Story 1: Start a Real Payment at Checkout

**Description:** As a customer, I want to pay for my order through Razorpay's
real checkout (UPI, card, or netbanking), so that my payment is actually
processed and secure, not just a UI animation.

**Design:** N/A — reuses the existing payment-method picker UI in
`app/checkout/page.tsx` as the visual baseline; the mock modal is replaced by
Razorpay's own hosted checkout widget once a real order is created.

**Acceptance Criteria:**
1. When the customer clicks to pay, the app calls a new `POST /api/checkout/create-order` route, which creates an order on Razorpay's servers (via their API, using account credentials) and returns a Razorpay order ID to the browser.
2. The browser then opens Razorpay's actual checkout widget (not the current hand-built mock UI) using that order ID, so the customer enters real payment details directly into Razorpay's secure form — the app never sees card numbers or UPI PINs.
3. The amount charged always matches the cart subtotal at the moment of clicking pay, calculated server-side (not trusted from the client), so a tampered client-side total can't under-charge.
4. If Razorpay's `create-order` call fails (network issue, invalid amount, account/config problem), the customer sees a clear "couldn't start payment, please try again" message and stays on the checkout page — the flow never silently proceeds as if payment succeeded.
5. This works identically for guest and signed-in checkout, matching how order creation works today.
6. No order is written to Supabase and no notification fires at this step — that only happens after payment is confirmed (see Story 2).

---

## Story 2: Confirm Order After Verified Payment

**Description:** As a customer, I want my order to be confirmed and saved
only after my payment is genuinely successful, so that I never get an "order
placed" confirmation for a payment that didn't actually go through.

**Design:** N/A.

**Acceptance Criteria:**
1. After the customer completes payment in Razorpay's widget, the browser sends Razorpay's payment ID, order ID, and signature to a new `POST /api/checkout/verify` route.
2. That route independently verifies the payment signature using Razorpay's secret key (server-side only, never exposed to the browser) before trusting that payment succeeded — a forged or replayed "success" callback from the client must be rejected.
3. Only after signature verification passes does the order get written to Supabase and the "Order Placed" email/WhatsApp notification fire (reusing the existing `order_placed` flow from `app/api/orders/create/route.ts`) — this replaces today's behavior of always saving regardless of payment outcome.
4. The saved order records the real Razorpay payment ID and order ID (not just a generic "payment_method" string like today), so a specific payment can be traced back to a specific order from the admin panel if there's a dispute.
5. If verification fails for any reason, the customer sees a clear error and the order is not created — they are not left thinking they've ordered something they haven't paid for.
6. The customer lands on the existing order-confirmation screen only once the order is actually confirmed by this route — not optimistically shown beforehand.

---

## Story 3: Handle Failed, Cancelled, or Abandoned Payments

**Description:** As a customer, if my payment fails or I back out of paying,
I want to see what happened and be able to try again, so that I'm not stuck
or confused about whether I've ordered anything.

**Design:** N/A.

**Acceptance Criteria:**
1. If the customer closes Razorpay's checkout widget without completing payment (changes their mind, back button, etc.), they're returned to the checkout page with their cart intact — not the success screen, and not an error state either.
2. If Razorpay reports the payment itself failed (card declined, insufficient funds, etc.), the customer sees the specific reason when Razorpay provides one, with a clear way to retry the same order without re-entering their shipping details.
3. No order is created in Supabase and no customer notification fires for a failed or abandoned payment attempt — only Story 2's fully-verified path creates an order.
4. If a customer's payment succeeds on a retry after an earlier failed attempt, only one order is created (for the successful attempt) — the earlier failed attempt leaves no orphaned or duplicate record.
5. Repeated failed attempts are visible somewhere for troubleshooting (at minimum, server logs; a dedicated admin view is out of scope for this story) so support can help a customer who says "I paid but got no confirmation."
6. This applies the same way regardless of which payment method (UPI, card, netbanking) the customer chose.

---

## Open Questions (for whoever picks these up)

- **Blocked on account approval.** Real API keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) don't exist yet — Bharani's GST/PAN verification with Razorpay is still pending per `CLAUDE.md`. None of this can go live until that clears, though the routes can be built and tested against Razorpay's test-mode keys in the meantime.
- **Schema change needed.** `orders.payment_method` today just stores a string like `"upi"`. Story 2 (AC4) implies adding columns for the actual Razorpay order ID and payment ID — needs a migration similar to the tracking/notification columns added for the shipping-notification work.
- **Refunds are not covered here.** These three stories only cover the pay → confirm path. Cancellations/returns/refunds after an order is placed would be a separate set of stories once that policy exists.
- **Retry UX (Story 3, AC2)** needs a product decision on whether "retry" re-uses the same Razorpay order ID or creates a fresh one — affects whether `/api/checkout/create-order` needs idempotency handling.
