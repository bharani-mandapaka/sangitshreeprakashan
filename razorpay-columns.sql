-- ── Razorpay payment tracing (real payment integration) ───────────────────────
-- Run this once in the Supabase SQL Editor (a fresh New Query tab — see the
-- note on isolated migrations in CLAUDE.md's Known Issues history).
--
-- These are populated by app/api/checkout/verify/route.ts once a payment is
-- signature-verified, replacing today's reality where orders.payment_method
-- is just a generic string with no way to trace a specific order back to a
-- specific Razorpay payment for a dispute.

alter table orders add column if not exists razorpay_order_id   text;
alter table orders add column if not exists razorpay_payment_id text;

comment on column orders.razorpay_order_id is
  'The Razorpay order id (order_...) created by POST /api/checkout/create-order for this purchase.';
comment on column orders.razorpay_payment_id is
  'The Razorpay payment id (pay_...) that successfully paid for this order, set only after '
  'POST /api/checkout/verify confirms the payment signature.';
