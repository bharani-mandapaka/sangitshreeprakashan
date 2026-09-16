# Order Invoice (Bill of Supply) — User Stories

**Product:** Sangit Shree Prakashan
**Feature:** Printing/downloading a Bill of Supply for an order — admin and customer sides
**Author:** Shreeyanshi Chandra

*Originally scoped to the admin panel only (Story 1). Story 2 — customer-facing download from order history — has since shipped too. Checkout-success-screen access and guest-checkout access are still deferred; see Open Questions.*

## Context

Today, `/admin/orders` has no document to print for an order — admins can only view order details and update status/tracking. Nothing printable or downloadable exists anywhere in this codebase — no PDF, no print-styled page, no invoice.

The reference for this feature is a real Bill of Supply already issued by Sangit Shree Prakashan (Invoice #469, dated 02-09-2026) — not the earlier Amazon.in example. It's a plain, simple document:

- Header: business name, shop address, phone number.
- Title: "BILL OF SUPPLY".
- Date and a sequential Invoice # (plain integer — no year prefix, no state code).
- "Bill To" block: customer name, full address, phone.
- A line-item table: Description, Qty, Price, Total.
- Grand Total, Delivery Fee, Total Paid.
- Footer: "for Sangit Shree Prakashan" / "Authorised Signatory".

No GSTIN, no PAN, no HSN codes, and no tax breakdown appear anywhere on it — this confirms the target document is a Bill of Supply, not a GST Tax Invoice, and there's no tax computation to build. That removes most of the complexity the Amazon-example draft assumed (HSN codes, IGST/CGST/SGST logic) — none of that is needed here.

The "Delivery Fee: ₹0.00" line matches current reality: nothing in this codebase computes a shipping/delivery charge today (checkout has no such field), so that line will simply always read ₹0.00 unless a delivery-fee feature is built separately later.

Since Invoice #469 already exists, whatever currently produces this document isn't part of this Next.js codebase (`orders` has no `invoice_number` column today) — Story 1 below needs to account for continuing that existing sequence rather than restarting from 1 or colliding with it.

## Story 1: Admin Prints an Order's Bill of Supply

**Description:** As an admin preparing to ship an order (or handling a walk-in/phone order), I want to print a Bill of Supply for that order directly from the admin orders page, so I can include it in the parcel without recreating it by hand — matching the document Sangit Shree Prakashan already issues today (Invoice #469).

**Design:** N/A — a "Print Invoice" action per order in `/admin/orders`, opening a print-ready page at e.g. `/admin/orders/[id]/invoice` (or a modal/new tab), rendered server-side from `orders` + `order_items`.

**Acceptance Criteria:**
1. Seller letterhead details (business name, shop address, phone) are stored in one place — e.g. `lib/seller-details.ts` — sourced from Bharani, matching the real letterhead on Invoice #469, not invented.
2. `orders` gains an `invoice_number` column, assigned once at insert time in `POST /api/orders/create` as a plain incrementing integer, continuing from whatever number comes after the current process's last-issued number (needs that number from Bharani — see Open Questions) so the two sequences don't collide or restart.
3. The invoice page renders: business header, "BILL OF SUPPLY" title, Date + Invoice #, a "Bill To" block (customer name/address/phone from the order), a line-item table (book title, qty, price, line total), Grand Total, Delivery Fee (always ₹0.00 today — no shipping-charge feature exists anywhere in the codebase), Total Paid, and the "for Sangit Shree Prakashan / Authorised Signatory" footer.
4. No GSTIN/HSN/tax fields are shown anywhere, matching the real reference document.
5. The page has no site nav/header/footer and prints cleanly at A4 with correct margins.
6. The "Print Invoice" action and the invoice route itself are both gated by the existing admin-cookie check (`isAdminRequest()`), consistent with every other admin action — the route enforces this, not just the button being hidden in the UI.
7. Printing has no side effects (read-only render) — re-printing after a later status/tracking change reflects the latest data, since nothing is stored as a snapshot.
8. Available regardless of the order's current status, so admins can print ahead of marking an order "Shipped," not only after.
9. Out of scope for this story: any customer-facing access to their own invoice (order history, checkout success, guest lookup) — that's a separate, later story set once this admin-only version ships.

## Story 2: Customer Downloads Their Invoice from Order History

**Description:** As a logged-in customer, I want to download the Bill of Supply for any of my past orders from my Orders tab, so I have a copy for my own records without asking the business for one.

**Design:** N/A — a "Download Invoice" link per order in `/profile`'s Orders tab, opening `/orders/[id]/invoice` in a new tab. Same document as Story 1 (same `InvoiceSheet` component), reached a different way.

**Acceptance Criteria:**
1. `GET /api/orders/[id]/invoice` verifies the caller's Supabase Auth session via bearer token (same pattern as `POST /api/orders/create`) rather than the admin cookie — this is a customer route, not an admin one.
2. Returns the order only if `order.user_id` matches the verified caller; otherwise 404 (not 403, so a customer poking at other order ids can't tell which ones exist).
3. Lazily assigns `invoice_number` on first load, same as the admin route — a customer downloading first and an admin printing first both land on the same shared counter, whichever happens first.
4. "Download" is the browser's native Print dialog ("Save as PDF"), same UX as the admin flow — no server-generated PDF file exists in this codebase.
5. Out of scope for this story: the checkout-success screen and guest-checkout orders (no account, so nothing to log into and no session to verify against) — both remain open, see below.

## Open Questions (for whoever picks these up)

- **What's the last invoice number issued by the current process?** Needed to seed Story 1's counter so the website's new sequence continues from Invoice #469 (or whatever the latest actually is) instead of restarting or colliding.
- **What currently generates Invoice #469 today?** Worth knowing whether it's a manual template, a separate tool, or something on the existing `sangitshreeprakashan.com` site — affects whether that process needs to be retired once this ships, so two systems don't both claim the same numbers.
- **PDF vs. browser print:** is a print-styled HTML page (via the browser's own "Print to PDF") sufficient, or does the business want an actual server-generated PDF file?
- **Delivery Fee line:** confirm it should always read ₹0.00 for now (no shipping-charge feature exists anywhere in the codebase today), rather than this feature quietly needing to build one.
- **Checkout-success-screen access (still deferred):** a "Download Invoice" link on the "Order Confirmed!" screen right after checkout, for immediate access without digging through order history.
- **Guest-checkout access (still deferred):** guest orders have no `user_id`, so Story 2's bearer-token check doesn't apply — needs its own mechanism (e.g. a link mailed at order-placed time once Resend's domain issue resolves, or an order-lookup-by-ID-and-phone page) decided before it's built.
