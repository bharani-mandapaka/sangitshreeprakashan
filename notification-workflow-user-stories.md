# Order Notification Workflow — User Stories

**Product:** Sangit Shree Prakashan
**Feature:** Customer-facing order notifications (email + WhatsApp)
**Author:** Shreeyanshi Chandra

## Context

Every order captures the customer's email and phone number at checkout, so both
channels are always available to notify on. The site already has a
notification engine (`notification_rules` table, `/admin/notifications`,
`fireNotifications()`) that sends email via Resend and WhatsApp via the Meta
Cloud API, driven by admin-configured rules with a subject/body template and
`{{placeholder}}` interpolation.

Today that engine only fires on one event — `order_placed`, triggered from
checkout. Nothing fires when an order's status changes to `shipped` or
`delivered` in the admin panel; those are just column updates today. The three
stories below define what's needed to cover all three moments in the order
lifecycle.

---

## Story 1: Order Placed Notification

**Description:** As a customer, I want to receive an email and a WhatsApp
message as soon as I place an order, so that I have immediate confirmation
my order was received and know what I bought and where it's going.

**Design:** N/A — reuses the existing order-confirmation email template
(`app/api/orders/create/route.ts`) as the visual/content baseline; WhatsApp is
plain text.

**Acceptance Criteria:**
1. The moment an order is successfully saved (guest or signed-in checkout), the customer receives both an email and a WhatsApp message — not just one or the other.
2. The email includes the order ID, item list with quantities and prices, total, shipping address, and estimated dispatch window.
3. The WhatsApp message includes the order ID, item count, total, and a one-line "we'll notify you when it ships" note.
4. If the customer didn't provide an email (rare, since checkout requires one today) or the WhatsApp send fails, the other channel still sends — one channel failing never blocks the other.
5. A record of what was sent, to whom, and whether it succeeded is visible to admin (existing `notification_logs` table/UI).
6. This applies to every completed checkout, regardless of payment method or guest vs. signed-in status.

---

## Story 2: Order Dispatched Notification

**Description:** As a customer, I want to be notified by email and WhatsApp
the moment my order ships, so that I know it's on its way and roughly when to
expect it.

**Design:** N/A.

**Acceptance Criteria:**
1. When an admin changes an order's status to "Shipped" in `/admin/orders`, the customer automatically receives an email and a WhatsApp message — no manual step beyond changing the status.
2. The message includes the order ID and a plain-language dispatch confirmation (courier/tracking details included if and when that data exists; otherwise omitted rather than shown broken).
3. Changing the status to anything other than "Shipped" does not trigger this notification.
4. If the same order is somehow marked "Shipped" more than once (e.g. admin error, status reverted and reapplied), the customer is not spammed with duplicate notifications for the same shipment event — needs a defined rule (e.g. only fire on the first transition into "Shipped").
5. Delivery of this notification is logged the same way as Story 1, visible to admin.
6. If the customer has no email on file, WhatsApp still sends, and vice versa — same one-channel-failure isolation as Story 1.

---

## Story 3: Order Delivered Notification

**Description:** As a customer, I want to be notified by email and WhatsApp
when my order is marked delivered, so that I have a clear record it arrived
and can follow up quickly if it didn't.

**Design:** N/A.

**Acceptance Criteria:**
1. When an admin changes an order's status to "Delivered" in `/admin/orders`, the customer automatically receives an email and a WhatsApp message.
2. The message thanks the customer, confirms delivery, and includes a short prompt for support/feedback (e.g. a contact link) in case anything's wrong.
3. Only the transition into "Delivered" fires this — not every save of an order that happens to already be in "Delivered" status.
4. Same duplicate-prevention expectation as Story 2 for repeated status changes.
5. Delivery of this notification is logged the same way as Stories 1 and 2.
6. Cancelled orders never receive a "Delivered" notification, even if mistakenly marked so and then corrected.

---

## Open Questions (for whoever picks these up)

- The notification engine's `trigger` column currently only allows `order_placed`, `daily_digest`, `weekly_digest`, `cart_abandoned` — `order_dispatched` and `order_delivered` need to be added before Stories 2 and 3 can be wired up.
- Today, `notification_rules.recipients`/`whatsapp_numbers` are usually configured with fixed admin/staff addresses. Sending *to the customer* requires a rule configured with the dynamic placeholders (`{{customer_email}}` / `{{customer_phone}}`) as the recipient — the engine already supports this, but it should be confirmed/set up in `/admin/notifications` rather than assumed.
- Duplicate-notification prevention (ACs 2.4 and 3.4) needs a concrete rule before build — likely "only fire on the actual status transition, not on every update."
