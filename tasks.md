# Tasks — Sangit Shree Prakashan

> This file tracks overall project status across all branches/PRs, not just what's checked out
> right now. Where an item's code lives on a different branch than the one currently checked
> out, that's noted inline (e.g. "built on feature/admin-catalog-management, not yet on this
> branch") — this branch (`feature/whatsapp-otp`) itself only contains the phone-auth/WhatsApp-OTP
> work plus what it inherited from `feature/order-notifications` (the OTP security fix).

## Done

### Foundation
- [x] Project setup — Next.js 14, Tailwind, Framer Motion, Zustand
- [x] Book catalog with category filter and search
- [x] Shopping cart with localStorage persist
- [x] Checkout page with order summary and payment flow (payment step goes through Razorpay's real widget on `feature/razorpay-integration` — see Phase 1's Payments section; not yet on this branch)
- [x] Homepage with gallery slideshow
- [x] About page with auto-scrolling founder timeline
- [x] Contact page
- [x] Replace all emojis — Devanagari letters for categories, Lucide icons for timeline
- [x] BookCard — persistent View + Add to Cart buttons always visible
- [x] Book detail pages — server component + BookDetailClient, 3D cover animation, specs, related books
- [x] Add missing books to catalog (Swar Vadan Part 1, Raag Shastra Parichay Part 3, Concepts of Vocal Music Class 9–12, Concepts of Instrumental Music Class 9–12, Sangit Saar Class 11, Bal Sangit Parts 1–3, Treasure of Raags & Taals) — 36 unique books
- [x] Real book cover images for all 36 books, prices verified against the print catalogue
- [x] SEO metadata + OG tags on all pages, dynamic per-book metadata, sitemap.xml
- [x] CLAUDE.md and tasks.md
- [x] GitHub repo + Vercel deployment

### Orders & database
- [x] Supabase project + schema (orders, order_items, RLS policies)
- [x] `POST /api/orders/create` — saves order to Supabase, sends confirmation notification on checkout
- [x] Resend domain verification completed once (status has since regressed — see Known Issues in `CLAUDE.md`)
- [x] Vercel env vars wired

### Customer accounts (phone-first, replacing the original email/password + Google plan)
- [x] Phone number + OTP as the sole sign-up/login method — synthetic email + HMAC-derived password under Supabase Auth, mock OTP shown on screen (`lib/phone-auth.ts`, `app/api/auth/phone/*`)
- [x] Separate `/login` (existing users) and `/signup` (new users, required Full Name + optional email) pages, sharing `components/PhoneAuthForm.tsx`
- [x] Forgot/reset-password flow was built, then removed as moot once phone+OTP replaced password auth entirely
- [x] `/profile` page — account overview, Wishlist tab, Orders tab
- [x] Wishlist — heart icon on book cards and detail pages, `wishlist` Supabase table, scoped to the signed-in user via RLS
- [x] Order history — `orders.user_id` (nullable — guest checkout still works), `/profile` Orders tab filtered by it
- [x] Checkout prefill never leaks the synthetic phone-auth email; uses the optional real email instead

### Security hardening (from Bharani's two PR #8 reviews)
- [x] Order creation verifies `userId` server-side from the request's bearer token — never trusts a client-supplied value
- [x] `orders`/`order_items` RLS: dropped permissive insert/update policies entirely; SELECT scoped to `auth.uid() = user_id`. All writes now go through service-role-backed routes.
- [x] Admin API routes gated behind a signed httpOnly session cookie (`lib/admin-auth.ts`) instead of a client-side-only localStorage flag — the admin password now lives only in the server-side `ADMIN_PASSWORD` env var, never committed to the repo
- [x] Admin order-status updates moved from the anon-key client to a service-role API route (`app/api/admin/orders` PATCH)
- [x] Fixed the `useShallow` wishlist-selector re-render bug, the lost-wishlist-click-through-login redirect, the wrong post-signup copy, and the `app/books/layout.tsx` title-template regression
- [x] **Phone-login OTP no longer leaks the code to anyone who asks for it in production** (from PR #9's review, code lives on `feature/order-notifications`, inherited here) — `send-otp` used to return the OTP in its response unconditionally, meaning anyone submitting any phone number got that number's login code back, enough to log into or create that account without owning the number. Now fails closed with a 503 in real production instead; still returns the code for on-screen display in dev/preview. Checks `VERCEL_ENV` rather than `NODE_ENV` alone, since Vercel sets `NODE_ENV=production` for Preview deployments too.

### Order-lifecycle notifications (email + WhatsApp)
- [x] `notification_rules.trigger` widened to include `order_shipped`/`order_delivered` (previously only `order_placed`)
- [x] New `orders` columns: `tracking_id`, `courier_service`, `shipped_at`, `delivered_at`, `expected_delivery_date`
- [x] Three customer-facing rules seeded (`audience = 'customer'`) with warm, branded copy — order placed, shipped, delivered — each interpolating `{{customer_email}}`/`{{customer_phone}}` dynamically per order
- [x] Split the email HTML wrapper in `lib/notifications-sender.ts` into admin-facing vs customer-facing, so customer emails no longer render an "ADMIN NOTIFICATION" label
- [x] `app/api/admin/orders` PATCH requires Tracking ID + Courier the first time an order is marked "Shipped"; admin UI (`app/admin/orders/page.tsx`) prompts inline for both before submitting
- [x] Duplicate-send guard: notifications for shipped/delivered only fire the first time `shipped_at`/`delivered_at` moves from null to set, however many times the status is later toggled
- [x] Removed the old hardcoded duplicate order-confirmation email in `app/api/orders/create` — `fireNotifications()` is now the sole sender
- [x] Fixed a real bug found during testing: `resend.emails.send()` doesn't throw on API-level failures, so a rejected send was being logged as `status: 'sent'` with no error — now checked and surfaced
- [x] `notification-workflow-user-stories.md` and product-manager framing written before the build
- [x] **Customer OTP delivery via WhatsApp** (this branch, `feature/whatsapp-otp`) — `lib/whatsapp-otp.ts`, wired into `POST /api/auth/phone/send-otp`, chosen over a paid SMS provider (MSG91/Twilio) since it reuses the same Meta Business verification already planned for order notifications instead of a second paid integration. Falls back to the existing on-screen mock (outside real production, per the security fix above) until `WHATSAPP_PHONE_NUMBER_ID`/`WHATSAPP_TOKEN` are set **and** an Authentication-category template is created + approved in Meta's WhatsApp Manager (name/language must match `WHATSAPP_OTP_TEMPLATE_NAME`/`WHATSAPP_OTP_TEMPLATE_LANG` in `.env.example`).

### Catalog management (books table + admin UI) — built on `feature/admin-catalog-management`, not yet on this branch
- [x] New Supabase `books` table (public SELECT, service-role-only writes) seeded with all 36 books migrated from the static `lib/books.ts` array
- [x] `lib/books-data.ts` — async, server-safe reads (`getAllBooks`, `getBookBySlug`, `getBookById`, `getBooksByIds`, `getBooksByCategory`, `getFeaturedBooks`)
- [x] `app/api/admin/books` (POST/PATCH/DELETE) — service-role, admin-cookie gated, validates category/level/language and catches duplicate-slug conflicts
- [x] Every storefront consumer switched from the static array to the live table: homepage, `/books` (split into a server component + `components/BooksListClient.tsx` since a `'use client'` page can't be async), book detail pages + related books, sitemap, profile wishlist tab
- [x] `/admin/books` — list with search/category/bundle-only filters, create/edit form (all fields including authors/tags as line/comma-separated text), delete with inline confirm. Bundles use the same form via the "Bundle Set" checkbox — no separate bundle UI needed.
- [x] `lib/books.ts` deliberately left in place (types + `categoryMeta` still imported everywhere) with its static array and helpers now dead code — not deleted, per the chosen migration approach
- [x] Default catalog ordering fixed — bundles first, then individual books grouped by series with parts in numeric order, instead of a flat alphabetical sort that scattered series and bundles randomly
- [x] Real cover-image upload — public Supabase Storage `covers` bucket, `POST /api/admin/books/upload-cover` (service-role, 5MB limit, JPG/PNG/WebP/AVIF), live thumbnail preview + upload button in the admin form, with the path/URL still directly editable for the legacy `/covers/*.jpg` books. `next.config.mjs` allow-lists `*.supabase.co` for `next/image`.
- [x] Fixed the admin book-form modal clipping at the top on shorter viewports (flexbox + `overflow-y-auto` scroll bug) — switched to a plain block layout with `mx-auto` centering that scrolls correctly
- [x] **Storefront now picks up catalog changes without a redeploy** (PR #9 review) — `/admin/books` writes call `revalidatePath()` for `/`, `/books`, the affected book's detail page, and `/sitemap.xml`, since those pages had no revalidate/dynamic export and were caching indefinitely.
- [x] **Admin edit-form staleness fix** (found while testing PR #9/#10) — opening a book's Edit form now refetches that book's current row fresh from Supabase, instead of trusting a possibly-stale in-memory list; the form always resends every field on save, so a stale cached row could silently revert changes made elsewhere.

### Admin invoice printing (Bill of Supply) — built on `feature/admin-invoice-printing`, not yet on this branch
Scoped to a single admin-panel-only story — see `order-invoice-user-stories.md`. Modeled on
the business's real existing invoice (Invoice #469), not the earlier Amazon.in example that
was ruled out — no GSTIN/HSN/tax fields, just a plain Bill of Supply.
- [x] `lib/seller-details.ts` — letterhead (name/address/phone), reusing `CONTACT` from `lib/utils.ts`
- [x] `orders.invoice_number` column + `orders_invoice_number_seq` sequence + `next_invoice_number()` RPC (`invoice-number-column.sql`, isolated per the transactional-rollback lesson from the books-table migration)
- [x] `GET /api/admin/orders/[id]/invoice` — service-role, admin-cookie gated; lazily assigns `invoice_number` on first print rather than at order-creation time
- [x] `/admin/orders/[id]/invoice` — print-ready page: logo + business details left, "BILL OF SUPPLY" centered, Bill To, line items, Grand Total/Delivery Fee (always ₹0 — no shipping-charge feature exists)/Total Paid, Authorised Signatory footer
- [x] "Print Invoice" link added to each order row on `/admin/orders`
- [x] Invoice markup extracted to `components/admin/InvoiceSheet.tsx` for reuse
- [x] Bulk printing: per-order checkboxes + header "select all" (scoped to the current filter) on `/admin/orders`, a "Print Selected (N)" button, `GET /api/admin/orders/invoice-batch` (sequential invoice-number assignment, preserves selection order), and `/admin/orders/print-batch` — renders every selected invoice with a page break between them and auto-opens the print dialog once loaded
- [x] `invoice-number-column.sql` run against the live database, sequence reset to start at **1** (business decision — this app's invoices are a separate number range from whatever the business's prior manual process used, so no collision risk)
- [x] Customer-facing "Download Invoice" — `/profile` Orders tab only (logged-in customers). `GET /api/orders/[id]/invoice` (bearer-token auth, ownership-checked, 404s rather than 403s on mismatch) + `/orders/[id]/invoice` page, both reusing `InvoiceSheet`.
- [x] Customer invoice page header-overlap fix (found while testing) — the page had no top padding accounting for the site's fixed Navbar, and its own toolbar was `sticky top-0`, both fighting for the same spot at the top of the viewport.
- [ ] Checkout-success-screen "Download Invoice" and guest-checkout access — deliberately not built yet (only order-history access was in scope for this round), see Open Questions in `order-invoice-user-stories.md`

---

## Phase 1 — Customer-facing (make it real for buyers)

> Goal: a customer can browse, pay, and receive confirmation. Orders land in a real database.
> Supabase ✓ · Customer accounts ✓ · Order-lifecycle notifications ✓ (code-complete, blocked on Resend domain) · Razorpay ✓ code-complete on `feature/razorpay-integration`, blocked on real keys.

### Payments — code-complete on `feature/razorpay-integration`, not yet on this branch; blocked on real API keys
All three stories in `razorpay-integration-user-stories.md` are built:
- [x] `orders.razorpay_order_id` / `orders.razorpay_payment_id` columns (`razorpay-columns.sql`) — run against the live database, confirmed; also includes a unique index on `razorpay_payment_id` (replay-block item below)
- [x] `lib/razorpay.ts` — order creation (raw fetch + Basic Auth, no new npm dependency) + signature verification (Node `crypto` HMAC) + `getRazorpayOrder()` (fetches the real order state, used by the amount-tie check below)
- [x] `lib/books-data.ts`'s `computeVerifiedSubtotal()` — recomputes the cart total from real book prices, used by both routes below so the client's price/subtotal is never trusted
- [x] `POST /api/checkout/create-order` (Story 1) — creates the Razorpay order, writes nothing to Supabase
- [x] `POST /api/checkout/verify` (Story 2) — verifies the signature server-side, only then saves the order + fires `order_placed`; rejects and logs an invalid/forged signature (Story 3, AC5)
- [x] `app/checkout/page.tsx` rewritten — real Razorpay checkout.js widget replaces the old mock UI entirely; handles success, `payment.failed` (Story 3, AC2), and widget dismissal/cancel (Story 3, AC1) without leaving the customer confused or creating orphaned orders
- [x] Retry behavior resolved: each retry creates a **fresh** Razorpay order (no reuse/idempotency) — since nothing is saved to Supabase until `verify` succeeds, this can't create duplicates (Story 3, AC4)
- [x] **Cart tied to the actual payment** (PR #11 review) — `verify` used to recompute the subtotal from whatever cart was submitted in the request, without checking it against what was actually charged for that Razorpay order. Now fetches the real order via `getRazorpayOrder()` and rejects unless `status === 'paid'` and `amount_paid` matches the recomputed subtotal exactly.
- [x] **Payment replay blocked** (PR #11 review) — `verify` rejects if `razorpay_payment_id` is already attached to an existing order, backed by a unique DB index.
- [x] **`POST /api/orders/create` deleted** (PR #11 review) — confirmed nothing called it anymore; it created a confirmed order unconditionally with no payment involved at all, a full bypass around the payment flow.
- [ ] **Before this can actually run:** `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` need to be real values in `.env.local`/Vercel — test-mode keys (available immediately from the Razorpay dashboard, no approval needed) are enough to test the whole flow now; live keys need Bharani's GST/PAN account verification to go live for real. Same Razorpay account as the existing sangitshreeprakashan.com site.
- [ ] End-to-end test once test-mode keys exist: pay with Razorpay's documented test card/UPI, confirm the order actually saves, then deliberately fail/cancel a payment and confirm no order is created — and specifically try to replay a payment or tamper with the cart to confirm the amount-tie/replay-block protections hold
- [ ] Blocked on PRs #9 and #10 merging first (that branch is stacked on top of both)

### Book content
- [ ] Final copy for descriptions, table of contents, author bios
- [ ] Book detail pages — richer layout with TOC, edition/ISBN, sample pages (currently description-only)
- [ ] Prerender book detail pages — add `generateStaticParams()` to `app/books/[slug]`; currently server-rendered per request (the catalog is now a live Supabase table, not a static array, so this would need a fetch inside `generateStaticParams()` too)

### Founder timeline
- [ ] Real photos and refined content (mobile scroll fix already done, PR #4)

### Notifications — remaining before this is fully live end-to-end
> **On hold** (as of this session) — pausing further work here to study the domain situation before touching DNS, since `sangitshreeprakashan.com` already has an existing website live on it. The code is complete; a PR for `feature/order-notifications` was opened against `master` as PR #12 this session — real email delivery is still parked until the domain question is resolved, but that's separate from merging the code.
- [ ] **Re-verify `sangitshreeprakashan.com` on Resend** — currently shows unverified, so no customer email actually sends despite the code path being correct. Needs whoever owns the domain's DNS (Bharani). Email-sending DNS records (TXT/CNAME for SPF+DKIM) don't conflict with whatever's already routing the existing website — but confirm what's already in the domain's DNS before adding anything, in case there's an existing SPF record that needs merging rather than overwriting.
- [ ] WhatsApp order-notification sends are still skipped — needs `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_TOKEN` (Meta Cloud API business verification, 2–4 weeks). Customer OTP delivery via WhatsApp is separately code-complete (see above) and shares the same credentials/verification.
- [x] ~~Fix: checkout never checked whether order-creation actually succeeded before showing the confirmation screen~~ — resolved as part of the Razorpay rewrite on `feature/razorpay-integration`: `app/checkout/page.tsx` now only shows the success screen after `POST /api/checkout/verify` returns `res.ok`, not optimistically
- [ ] Open question flagged in the story doc but intentionally not built: an OTP step on delivery confirmation ("need to confirm" per the original spec) — needs a product decision first

---

## Security & maintenance

> Not tied to a phase.

- [ ] **Patch the Next.js CVE** — `npm audit` flags information exposure in the dev server due to missing origin verification (currently on 14.2.21), plus high-severity issues in `ws` and `glob`. Patch within the 14.2.x line — do **not** jump to Next.js 15, which changes the `params` API this codebase relies on.
- [x] ~~Rotate or remove the hardcoded admin password~~ — done. `ADMIN_PASSWORD` is now a server-only env var, never committed; the old `ssp@admin` value documented in `CLAUDE.md`/`HANDOVER.md` is stale and no longer the real password.
- [x] ~~Lock down `orders`/`order_items` RLS~~ — done (see Security hardening above).
- [x] ~~Phone-login OTP leaked to anyone who asked for it~~ — done, see Security hardening above.
- [ ] **Tighten `notification_rules`/`notification_logs` RLS** — both still fully permissive to the anon key (`for all to anon using (true) with check (true)`). Lower urgency than `orders` was (no customer PII beyond what's already in the templates), but still worth scoping once admin has real per-person auth.

---

## Phase 2 — Admin (make it fully operational)

> Goal: admin can manage catalog, see real orders, send real notifications, log in securely.
> Depends on: Phase 1 complete.

### Accounts to create first
- [ ] Meta Business account + WhatsApp Cloud API — start immediately, verification takes 2–4 weeks. Gates three things once approved: order-lifecycle WhatsApp notifications, customer OTP delivery (see Notifications above), and an Authentication-category message template (separate approval from the account itself — see `.env.example`'s WhatsApp OTP section)
- [ ] Admin users-page OTP mock — still needs its own real provider decision (MSG91/Twilio, or reuse the Meta WhatsApp setup above); not covered by the customer-flow WhatsApp OTP work

### Auth
- [x] Admin login is no longer a client-side-only localStorage flag — it's a real password check server-side plus a signed httpOnly session cookie. Still a single shared password though, not per-person accounts.
- [ ] NextAuth.js with Google OAuth — replace the shared-password admin login with real per-person accounts
- [ ] Role-based access — staff sees orders only, admin sees everything

### Catalog management
- [x] ~~Edit existing book / create new book from admin panel / create and edit bundles / migrate to Supabase `books` table~~ — done on `feature/admin-catalog-management`, see Catalog management above.
- [x] ~~Upload book cover to Supabase Storage~~ — done on `feature/admin-catalog-management`, see Catalog management above.

### Orders
- [x] ~~Order status change triggers notification email to customer~~ — done, see Order-lifecycle notifications above.
- [ ] Manually create an order from admin (for phone/walk-in orders)

### Notifications
- [x] ~~Real email via Resend — wire existing templates to actual sends~~ — wired; blocked on the Resend domain re-verification, not on code.
- [x] ~~Real OTP for the customer phone-login flow~~ — code-complete via WhatsApp (`lib/whatsapp-otp.ts`, this branch). Blocked on Meta verification + approved template, not code.
- [ ] Real OTP for the admin users page — separate mock, not yet addressed
- [ ] Real WhatsApp via Meta Cloud API — code already calls it, just needs credentials
- [x] ~~Notification logs — history of what was sent, to whom, and status~~ — done, `notification_logs` table + admin UI.
- [x] ~~Notification rules stored in Supabase (not localStorage)~~ — done; the old `notifications-store.ts` Zustand store is no longer actually read from for rules.

### Users
- [ ] Real Google OAuth replaces the simulated sign-in flow
- [ ] Admin users stored in Supabase (not localStorage)
