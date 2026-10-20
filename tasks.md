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
- [x] Checkout page with order summary and payment flow (payment step now goes through Razorpay's real widget — see Phase 1's Payments section)
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
- [x] **Google sign-in confirmed working end-to-end** (resolves PR #8 review point 1) — Google Cloud OAuth app + Supabase provider config completed; tested a full round trip (redirect to Google, consent, redirect back, session persists across refresh).
- [ ] **Not just cosmetic — worth prioritizing before real customers use this:** every customer who signs in with Google gets an automated email from Google titled *"You shared some Google Account data with kypqmrfgxeybqzkawogb.supabase.co"* — the raw Supabase domain, not "Sangit Shree Prakashan," right in the subject line (confirmed by inspecting the actual email, not just the mid-flow consent screen, which shows the same domain). To a non-technical customer this could read as a phishing/security warning and generate "is this a scam?" support messages, or scare people off completing sign-in. Root cause: Supabase's OAuth redirect runs through their own shared domain by default. Fix is Supabase's **Custom Domain** feature (paid add-on, needs Pro plan or above) to run auth on something like `auth.sangitshreeprakashan.com` instead, then re-point the Google OAuth Client's redirect URI and re-verify domain ownership in Google Cloud Console. Flagged in the PR #8 update comment.
- [x] Cart-badge hydration mismatch fixed on this branch too (`components/Navbar.tsx`) — same root cause/fix as documented elsewhere, this branch forked before that fix existed and hit it again during Google-login testing.

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
- [x] **Customer OTP delivery via WhatsApp** (this branch, `feature/whatsapp-otp`) — `lib/whatsapp-otp.ts`, wired into `POST /api/auth/phone/send-otp`, chosen over a paid SMS provider (MSG91/Twilio) — **decision confirmed 2026-10-15: SMS is dropped, WhatsApp is the only OTP channel** — since it reuses the same Meta Business verification already planned for order notifications instead of a second paid integration. Falls back to the existing on-screen mock (outside real production, per the security fix above) until `WHATSAPP_PHONE_NUMBER_ID`/`WHATSAPP_TOKEN` are set **and** an Authentication-category template is created + approved in Meta's WhatsApp Manager (name/language must match `WHATSAPP_OTP_TEMPLATE_NAME`/`WHATSAPP_OTP_TEMPLATE_LANG` in `.env.example`).

### Catalog management (books table + admin UI)
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

### Admin invoice printing (Bill of Supply)
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
- [ ] **Before this goes live:** `invoice-number-column.sql` has been run in Supabase and works. The owner decided the website's invoices start at **1** (a separate series from the business's earlier manual invoices), and the SQL files now say so. Because test invoices consume numbers (assigned on first print), once the test orders are cleared run `alter sequence orders_invoice_number_seq restart with 1; update orders set invoice_number = null;`. Still to confirm with the accountant: one running series, or a fresh series each financial year.
- [x] Customer-facing "Download Invoice" — `/profile` Orders tab only (logged-in customers). `GET /api/orders/[id]/invoice` (bearer-token auth, ownership-checked, 404s rather than 403s on mismatch) + `/orders/[id]/invoice` page, both reusing `InvoiceSheet`.
- [x] Customer invoice page header-overlap fix (found while testing) — the page had no top padding accounting for the site's fixed Navbar, and its own toolbar was `sticky top-0`, both fighting for the same spot at the top of the viewport.
- [ ] Checkout-success-screen "Download Invoice" and guest-checkout access — deliberately not built yet (only order-history access was in scope for this round), see Open Questions in `order-invoice-user-stories.md`

---

## Phase 1 — Customer-facing (make it real for buyers)

> Goal: a customer can browse, pay, and receive confirmation. Orders land in a real database.
> Supabase ✓ · Customer accounts ✓ · Order-lifecycle notifications ✓ (code-complete, blocked on Resend domain) · Razorpay ✓ code-complete, blocked on real keys.

### Payments — code-complete, blocked on real API keys
All three stories in `razorpay-integration-user-stories.md` are built:
- [x] `orders.razorpay_order_id` / `orders.razorpay_payment_id` columns (`razorpay-columns.sql`) — **run against the live database, confirmed**; also now includes a unique index on `razorpay_payment_id` (see replay-block item below)
- [x] `lib/razorpay.ts` — order creation (raw fetch + Basic Auth, no new npm dependency) + signature verification (Node `crypto` HMAC) + `getRazorpayOrder()` (fetches the real order state, used by the amount-tie check below)
- [x] `lib/books-data.ts`'s `computeVerifiedSubtotal()` — recomputes the cart total from real book prices, used by both routes below so the client's price/subtotal is never trusted
- [x] `POST /api/checkout/create-order` (Story 1) — creates the Razorpay order, writes nothing to Supabase
- [x] `POST /api/checkout/verify` (Story 2) — verifies the signature server-side, only then saves the order + fires `order_placed`; rejects and logs an invalid/forged signature (Story 3, AC5)
- [x] `app/checkout/page.tsx` rewritten — real Razorpay checkout.js widget replaces the old mock UI entirely; handles success, `payment.failed` (Story 3, AC2), and widget dismissal/cancel (Story 3, AC1) without leaving the customer confused or creating orphaned orders
- [x] Retry behavior resolved: each retry creates a **fresh** Razorpay order (no reuse/idempotency) — since nothing is saved to Supabase until `verify` succeeds, this can't create duplicates (Story 3, AC4)
- [x] **Cart tied to the actual payment** (PR #11 review) — `verify` used to recompute the subtotal from whatever cart was submitted in the request, without checking it against what was actually charged for that Razorpay order. A genuinely-valid signature from paying for a cheap cart could've been replayed against `verify` with a different, pricier cart and saved as confirmed with nothing paid for the gap. Now fetches the real order via `getRazorpayOrder()` and rejects unless `status === 'paid'` and `amount_paid` matches the recomputed subtotal exactly.
- [x] **Payment replay blocked** (PR #11 review) — `verify` rejects if `razorpay_payment_id` is already attached to an existing order, backed by a unique DB index as a second line of defense against two near-simultaneous requests for the same payment.
- [x] **`POST /api/orders/create` deleted** (PR #11 review) — confirmed nothing called it anymore; it created a confirmed order unconditionally with no payment involved at all, a full bypass around the payment flow.
- [x] **Shipping-details validation** (found in QA 2026-10-12: a 5-digit phone and a 2-digit PIN went straight through) — new `lib/checkout-validation.ts` (name, email, 10-digit Indian mobile starting 6–9 with optional +91/0 prefix normalised to `+91XXXXXXXXXX`, address, city, state, 6-digit PIN not starting 0). The checkout form shows the specific message under each bad field, outlines it in red, focuses the first one and stays on the details step. `POST /api/checkout/create-order` re-checks the same rules and answers 400 + `fieldErrors` **before** a Razorpay order exists (rejecting later, in `verify`, would leave a customer charged with no order); the page then returns them to the details step. 20 checker cases pass, plus bad/missing/valid requests against the route and the form in a browser. Note: `verify` still trusts the details the page sends it (it can't reject after payment), so this stops honest mistakes rather than a deliberately forged request.
  - **Real PIN-code check** (branch `feature/pincode-validation`): beyond the 6-digit format, the PIN must exist in the **official All India Pincode Directory** (Department of Posts via data.gov.in, Government Open Data License - India), bundled in the repo as `data/pincodes.json` (426 KB, **19,586 unique PINs**, 36 states/UTs, 749 districts; built `2026-10-20` from 165,627 post-office rows). No outside service at runtime — lookups (`lib/pincode-lookup.ts`, server-only, used by `GET /api/pincode?code=` and `POST /api/checkout/create-order`) are instant and can't be taken down by a third party; `lib/pincode.ts` holds only the browser-safe helpers. As soon as all 6 digits are typed the form shows `✓ <districts>, <state>` and fills an empty State when the PIN is in exactly one state. A PIN that isn't listed (e.g. 999999) is flagged and blocks until the customer ticks **"My PIN code is correct"** (the list is refreshed about yearly, so brand-new PINs can lag — a real customer is never locked out); `create-order` re-checks before any payment starts and honours the tick (`pincodeConfirmed`). A State that clearly doesn't match blocks with one-tap **"Use <state>"** buttons; matching is lenient (Delhi/NCT of Delhi, Orissa/Odisha, Uttaranchal/Uttarakhand…), the server does not block on state mismatch, **52 border PINs list several states and any of them is accepted** (e.g. 396230 Gujarat / Dadra & Nagar Haveli, 110025 Delhi / Uttar Pradesh), and the ~100 PINs with no state in the source are never held against the customer. **Verified:** all 19,586 PINs from the original government CSV were checked against the running site — 19,586 found with exactly the source's states, and 0 of 3,000 random non-listed numbers wrongly accepted; plus the form in a browser (autofill, wrong state + one-tap fix, border PIN, no-state PIN, fake PIN + tick, real PIN through to payment). **Refresh yearly:** download the latest CSV from data.gov.in, run `node scripts/build-pincodes.mjs <csv path>`, commit the regenerated `data/pincodes.json`. Known limits: city isn't checked against the PIN (post-office and district names vary), and a customer who ticks the box can still enter a PIN that isn't real.
- [x] Cart-badge hydration mismatch and checkout step-transition/padding bugs found while testing this branch end-to-end — fixed (not originally part of the review, surfaced during manual testing).
- [ ] **Before this can actually run:** `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` need to be real values in `.env.local`/Vercel — test-mode keys (available immediately from the Razorpay dashboard, no approval needed) are enough to test the whole flow now; live keys need Bharani's GST/PAN account verification to go live for real. Same Razorpay account as the existing sangitshreeprakashan.com site — generating test keys doesn't touch anything live there.
- [ ] End-to-end test once test-mode keys exist: pay with Razorpay's documented test card/UPI, confirm the order actually saves, then deliberately fail/cancel a payment and confirm no order is created — **and specifically try to replay a payment or tamper with the cart to confirm the new amount-tie/replay-block protections actually hold**
- [ ] Blocked on PRs #9 and #10 merging first (this branch is stacked on top of both)

### Book content
- [ ] Final copy for descriptions, table of contents, author bios
- [ ] Book detail pages — richer layout with TOC, edition/ISBN, sample pages (currently description-only)
- [ ] Prerender book detail pages — add `generateStaticParams()` to `app/books/[slug]`; currently server-rendered per request (the catalog is now a live Supabase table, not a static array, so this would need a fetch inside `generateStaticParams()` too)

### Founder timeline
- [ ] Real photos and refined content (mobile scroll fix already done, PR #4)

### Notifications — remaining before this is fully live end-to-end
> **On hold** (as of this session) — pausing further work here to study the domain situation before touching DNS, since `sangitshreeprakashan.com` already has an existing website live on it. The code is complete; a PR for `feature/order-notifications` was opened against `master` as PR #12 this session — real email delivery is still parked until the domain question is resolved, but that's separate from merging the code.
- [ ] **Re-verify `sangitshreeprakashan.com` on Resend** — **blocked:** adding the domain shows "in use by another Resend team — verifying will transfer it and revoke their access"; don't claim it until Bharani confirms who owns that other team. Currently shows unverified, so no customer email actually sends despite the code path being correct. Needs whoever owns the domain's DNS (Bharani). Email-sending DNS records (TXT/CNAME for SPF+DKIM) don't conflict with whatever's already routing the existing website — but confirm what's already in the domain's DNS before adding anything, in case there's an existing SPF record that needs merging rather than overwriting.
- [ ] WhatsApp order-notification sends are still skipped for real customers — needs the real number's `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_TOKEN` (Meta Cloud API business verification, 2–4 weeks). Customer OTP delivery via WhatsApp is separately code-complete (see above) and shares the same credentials/verification.
  - **Test-number progress:** a Meta Developer app ("Sangit Shree Prakashan", WhatsApp use case, unverified Business Portfolio) exists and the free built-in test number (+1 555-179-0517) delivered a `hello_world` template message to a verified test recipient — plumbing confirmed. `.env.local` has the test Phone Number ID + a temporary 24-hour token.
  - **Order-placed WhatsApp confirmed working end-to-end (SSP-378V6TO6):** a test order delivered the customer WhatsApp message to the verified test number. An earlier order (SSP-8PM7P92W) had failed with `401 / code 190` because the 24-hour temp token expired; fixed by switching `WHATSAPP_TOKEN` to a never-expiring System User token (system user with the app assigned under Manage app + the test WhatsApp account, token generated with `whatsapp_business_messaging` + `whatsapp_business_management`, expiry Never).
  - **Shipped and delivered WhatsApp messages also confirmed working** (order SSP-378V6TO6 marked shipped, then delivered, from the admin panel) — WhatsApp side succeeded for both; the only error logged on each is the unverified Resend domain (email).
  - Fixed: a failing WhatsApp number no longer stops the remaining recipients of the same rule (per-number try/catch in `lib/notifications-sender.ts`; errors from all failed numbers are joined in the log).
  - Fixed: when the admin session cookie expires, any 401 from `/api/admin/*` now returns the admin to the login form ("Your session expired") instead of showing "Database error: Not authenticated" (`app/admin/layout.tsx`).
  - **Order-placed rules cleaned up (live DB, not in code):** the admin rule "Order Placed (WhatsApp)" now goes only to the admin number (`+917408452828`) — the customer was removed from it so they only get "Order Confirmation (Customer)". The old admin rule "Order Placed (Email)" was switched off (admin wants WhatsApp alerts only; it also duplicated the customer's email). Full flow (placed → shipped → delivered) verified end-to-end on the test number; the admin number itself can't receive until it's a verified Meta recipient or the real number is live.
  - **Open question:** expected delivery date is a flat order date + 7 days (`EXPECTED_DELIVERY_DAYS` in `app/api/orders/create/route.ts`) — no regional or holiday logic. Waiting for the shipping side to confirm the real figure.
  - **PR:** this branch (`feature/whatsapp-otp`) is PR #13, based on `feature/order-notifications` (#12) so it shows only the 4 new commits; PR #8 (`feature/customer-auth`) keeps the phone-login route and on-screen mock, WhatsApp delivery lives in #13.
  - **Test-number limit:** the admin-alert WhatsApp rule failed with `131030 Recipient phone number not in allowed list` — the test number only sends to up to 5 manually-verified recipients; add staff numbers under API Setup → recipient list to test those, or wait for the real number.
  - **Free-text order messages only deliver inside a 24-hour window** (the recipient must have messaged the test number first) — expected for the test number; real customers will need approved Utility templates for these.
  - **Authentication templates are blocked** on the unverified business ("does not have permission to create message template"; a Utility draft got through) — so OTP over WhatsApp waits on Business Verification, same as production.
- [x] ~~Fix: checkout never checked whether order-creation actually succeeded before showing the confirmation screen~~ — resolved as part of the Razorpay rewrite on `feature/razorpay-integration`: `app/checkout/page.tsx` now only shows the success screen after `POST /api/checkout/verify` returns `res.ok`, not optimistically
- [x] Sender address is now configurable via `RESEND_FROM_EMAIL` (defaults to `orders@sangitshreeprakashan.com`) so a verified subdomain can be used for testing without code changes. Subdomain `mail.sangitshreeprakashan.com` is added in Resend (Tokyo region) — **waiting on 3 DNS records** (TXT `resend._domainkey.mail`, CNAME `rsend.mail`, CNAME `send.mail`) from whoever controls the domain's DNS. The domain is registered at GoDaddy but its nameservers point to `dns-parking.com`, and neither the GoDaddy nor the Hostinger account we tried holds it — ask Bharani which login does.
- [x] Phone-login OTP validity raised from 5 to 15 minutes (`OTP_TTL_MS` in `send-otp/route.ts`); no WhatsApp cost impact.
- [x] Fixed navbar cart badge not updating when items are added from other components (`components/Navbar.tsx`, Zustand selector now derives the count instead of selecting the getter).
- [ ] Open question flagged in the story doc but intentionally not built: an OTP step on delivery confirmation ("need to confirm" per the original spec) — needs a product decision first

---

## Security & maintenance

> Not tied to a phase.

- [~] **Patch the Next.js CVE** — partly done: Next 14.2.21 → 14.2.35 (the last 14.x release) plus `npm audit fix` for `ws`, `uuid`/`svix`/`resend`, `brace-expansion`, `source-map-js` etc.; `npm audit` went from 21 findings (1 critical) to 12. **What's left can't be fixed on 14.x:** the remaining `next` advisories (some only matter for features this site doesn't use — i18n Pages Router, custom servers, Windows hosting, AVIF image optimization) need Next 15/16, and the dev-only toolchain findings (`tailwindcss`, `eslint-config-next`, `glob`, `braces`, `micromatch`) need Tailwind 4 / eslint-config-next 16. Upgrading past 14.x changes the `params` API this codebase relies on, so it's a separate migration task. After pulling this, run `npm install` and restart the dev server.
- [x] ~~Rotate or remove the hardcoded admin password~~ — done. `ADMIN_PASSWORD` is now a server-only env var, never committed; the old `ssp@admin` value documented in `CLAUDE.md`/`HANDOVER.md` is stale and no longer the real password.
- [x] ~~Lock down `orders`/`order_items` RLS~~ — done (see Security hardening above).
- [x] ~~Phone-login OTP leaked to anyone who asked for it~~ — done, see Security hardening above.
- [~] **Tighten `notification_rules`/`notification_logs` RLS** — code done, **live-database step deliberately not run yet.** Both tables were open to the public anon key (anyone could rewrite recipients/templates or read logs). Now: new `app/api/admin/notifications` route (GET/POST/PATCH/DELETE, admin-cookie gated, field-whitelisted); the admin Notifications page uses it instead of the browser Supabase client; `lib/notifications-sender.ts` and `app/api/notifications/test` use the service-role client; and `/api/notifications/test` — which sent real emails/WhatsApp to a rule's recipients with **no login check at all** — now requires the admin session. `schema.sql` no longer creates the anon policies.
  - **Still to do, only after this branch is deployed everywhere that shares the Supabase project:** run `drop policy if exists "anon_all_notification_rules" on notification_rules; drop policy if exists "anon_all_notification_logs" on notification_logs;` in the Supabase SQL editor. Running it earlier breaks any deployment still on the old code (admin Notifications page and every order notification use the anon key there).
  - Also fixed: the daily/weekly digest cron routes read `orders` with the anon key, which `orders` RLS blocks, so every digest would have reported 0 orders. They now use `getSupabaseAdmin()` and return a 500 (instead of sending a false "0 orders" digest) if the query fails. No digest rules exist in the live DB yet, so nothing was being sent; tested both routes locally (200, sent 0).
  - **Heads-up:** `CRON_SECRET` is optional and unset locally — when unset, `/api/cron/*` is callable by anyone. Set it in Vercel (Production) so only Vercel Cron can trigger digests.
- [ ] **Repo hygiene: line-ending noise and scratch folders** (noted 2026-10-15). Two things keep cluttering `git status` and risk polluting PRs:
  - **~25 files show as modified though their content is unchanged** (e.g. `.eslintrc.json`, `README.md`, `.gitignore`, `tailwind.config.ts`, `tsconfig.json`, `vercel.json`, `components/Footer.tsx`'s untouched siblings, `components/AuthListener.tsx`…) — Windows saved them with CRLF line endings while the repo stores LF, so git flags every line. Fix once, in its own small commit: add a `.gitattributes` with `* text=auto eol=lf` (and/or `git config core.autocrlf input`), run `git add --renormalize .`, and review that the commit only touches line endings. Until then, **always stage files by name — never `git add -A` / `git add .`**.
  - **Untracked scratch folders/files sit in the project root:** `.claude/`, `.cleanup-scratch/`, `.old-docs-removed/`, `.next.stale.*`, `audit-report.txt`, `outputs/`. Decide for each whether to delete it or add it to `.gitignore` (`.next.stale.*` and `.cleanup-scratch/` are safe to ignore/delete; check `.claude/` before deleting — it holds this tool's `launch.json`).
- [~] **QA walkthrough (public side, run in the browser pane; logged-in parts still need a manual pass)**
  - Passed: homepage, `/books` (36 books, search narrows correctly), book detail, add to cart + navbar badge, checkout page + empty-form blocking, `/contact`, `/about`, `/sitemap.xml`, 404 page; no horizontal scroll at 375px on home/books/detail/checkout/contact.
  - **Fixed:** the cart drawer's open/closed state was saved to localStorage along with the cart, so leaving with the drawer open made it reopen over the next page (it covered the checkout form). `lib/cart-store.ts` now persists only `items` and ignores any old saved `isOpen`.
  - **Not fixed — found on this branch's checkout (will conflict with the Razorpay rewrite in PR #11, so do it there):** shipping form only checks "not empty" (+ a 6-char limit on PIN). A 5-digit phone or 2-digit PIN code is accepted, which means unreachable orders and failed WhatsApp sends. Needs phone (10-digit Indian mobile) and PIN (6 digits) validation, ideally server-side too.
  - **Manual, done by hand 2026-10-15:** admin Notifications page behind `/api/admin/notifications` — rules and log load, toggle persists across refresh, create + delete a rule, send-test all work.
  - Admin Orders and Users pages also checked by hand 2026-10-15 — both load fine.
  - **REMINDER — still to do by hand (postponed by the owner):** customer side with a login — Google/phone sign-in, `/profile` details, Orders tab, Wishlist (heart on a book, shows on `/profile`, remove), sign out.

---

## Phase 2 — Admin (make it fully operational)

> Goal: admin can manage catalog, see real orders, send real notifications, log in securely.
> Depends on: Phase 1 complete.

### Accounts to create first
- [ ] Meta Business account + WhatsApp Cloud API — start immediately, verification takes 2–4 weeks. Gates three things once approved: order-lifecycle WhatsApp notifications, customer OTP delivery (see Notifications above), and an Authentication-category message template (separate approval from the account itself — see `.env.example`'s WhatsApp OTP section)
- [ ] Admin users-page OTP mock — provider decided (2026-10-15): reuse the Meta WhatsApp setup above (SMS/MSG91/Twilio is dropped). Still a mock until Business Verification + an approved Authentication template exist; then wire it to `lib/whatsapp-otp.ts` like the customer flow. Not covered by the customer-flow WhatsApp OTP work.

### Auth
- [x] Admin login is no longer a client-side-only localStorage flag — it's a real password check server-side plus a signed httpOnly session cookie. Still a single shared password though, not per-person accounts.
- [ ] NextAuth.js with Google OAuth — replace the shared-password admin login with real per-person accounts
- [ ] Role-based access — staff sees orders only, admin sees everything

### Catalog management
- [x] ~~Edit existing book / create new book from admin panel / create and edit bundles / migrate to Supabase `books` table~~ — done, see Catalog management above and `/admin/books`.
- [x] ~~Upload book cover to Supabase Storage~~ — done, see Catalog management above and `/admin/books`.

### Orders
- [x] ~~Order status change triggers notification email to customer~~ — done, see Order-lifecycle notifications above.
- [ ] Manually create an order from admin (for phone/walk-in orders)

### Notifications
- [x] ~~Real email via Resend — wire existing templates to actual sends~~ — wired; blocked on the Resend domain re-verification, not on code.
- [x] ~~Real OTP for the customer phone-login flow~~ — code-complete via WhatsApp (`lib/whatsapp-otp.ts`, this branch). Blocked on Meta verification + approved template, not code.
- [ ] Real OTP for the admin users page — separate mock; will use WhatsApp (SMS dropped), once Meta verification and the Authentication template are in place
- [ ] Real WhatsApp via Meta Cloud API — code already calls it, just needs credentials
- [x] ~~Notification logs — history of what was sent, to whom, and status~~ — done, `notification_logs` table + admin UI.
- [x] ~~Notification rules stored in Supabase (not localStorage)~~ — done; the old `notifications-store.ts` Zustand store is no longer actually read from for rules.

### Users
- [ ] Real Google OAuth replaces the simulated sign-in flow
- [ ] Admin users stored in Supabase (not localStorage)

---

## Launch readiness — gaps not tracked anywhere before

> Found by comparing the site's routes/code against what a live Indian e-commerce store needs (checked in code on 2026-10-12; not a full audit, so more may turn up).

### Needed before real customers
- [x] **Legal pages — drafted 2026-10-15** (`/privacy`, `/terms`, `/shipping-returns`, shared `components/LegalPage.tsx`, linked from the footer, added to the sitemap). Policy choices made by the owner: returns only for damaged/wrong books; cancellation allowed before the order ships; free shipping, about 7 days. **Still to confirm with Bharani / get a professional review before launch:** the 7-day window to report a damaged/wrong book and the "refund in 5–7 working days" line (both my wording, not given by the owner); the Terms' governing law/courts (India, Kanpur); the data-sharing list in the Privacy Policy (Razorpay, Supabase, Resend, Meta/WhatsApp, Google, Vercel, courier); and that the footer's old tagline ("Publisher of Hindustani Classical Music Books · Kanpur, India") was replaced by the three legal links. The site is still on the mock payment on this branch, so the "Razorpay" wording becomes true when PR #11 merges.
- [x] ~~Forgot/reset password~~ — **not needed (added in error, corrected 2026-10-12):** customers sign in with phone + OTP or Google, never a password they could forget; the reset flow was already built and then removed for that reason (see Customer accounts above). Only revisit if email/password login is ever brought back.
- [ ] **Domain cutover plan** — `sangitshreeprakashan.com` already serves the old live website (and the existing site's email may depend on that DNS). Decide when/how the new site replaces it, how DNS changes without taking either down, and where each site's email keeps working.
- [ ] **Production environment on Vercel** — every secret set for Production + Preview + Development (Supabase URL/anon/service-role, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `WHATSAPP_*`, Razorpay keys, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `PHONE_AUTH_SECRET`, `CRON_SECRET`); then one real end-to-end test on the deployed URL.
- [ ] **Google sign-in branding** (corrected 2026-10-12 — this is not about Supabase emails: phone and Google accounts don't receive any Supabase sign-up email). The real issue is the Google security email "You shared some Google Account data with `<project>.supabase.co`", which shows Supabase's raw domain instead of the shop's name and could look suspicious to customers. Fix needs Supabase's paid Custom Domain feature (tracked earlier in this file); the Google Cloud OAuth consent screen's app name/logo should also be set to the shop's.

### Worth doing soon
- [~] **Cancellations, returns & refunds** — first step done 2026-10-15 on `feature/legal-pages`: `/profile` → Orders now shows "Return or report a problem" on delivered orders (only within 7 days of delivery, then a "window has ended" note) and "Cancel this order" on pending/confirmed orders; both open WhatsApp to the shop number with the order ID pre-typed, plus a link to `/shipping-returns`. Second step (branch `feature/order-returns`, stacked on `feature/legal-pages`): admins can mark a **delivered** order **Returned** in `/admin/orders` (the option is disabled for any other status, and the API rejects it too); that sets `returned_at` and, once, sends the customer "We've received your returned book" by **email and WhatsApp** through a new `order_returned` notification trigger + seeded rule `order-returned-customer` (also an admin-style template for hand-built rules). **Live database needs `order-returned-migration.sql` run once in the Supabase SQL editor *before* anyone uses it** (widens the order-status and notification-trigger checks, adds `orders.returned_at`, inserts the rule). Returned orders are still counted in the admin revenue totals (only `cancelled` is excluded) — decide whether a returned order should come out of revenue once refunds are handled. Like every WhatsApp message here, the free-text message only reaches a customer inside the 24-hour window until real approved templates exist. Still open: an actual in-site request form, an admin "cancel/refund" action, tracking of return requests before the book arrives, and Razorpay refunds.
- [ ] **Stock / availability** — no inventory tracking, so out-of-stock books can still be bought.
- [ ] **Real analytics** — admin visit/click numbers come from browser localStorage, not a real measure of traffic.
- [ ] **Error monitoring & backups** — nothing alerts anyone when checkout or an API route fails; no scheduled Supabase backup/restore plan.
- [ ] **Abuse limits** — rate-limit OTP requests (there's only a 30 s per-number cooldown), signup, and the admin login attempts.
- [x] **GST — resolved:** Bharani/owner confirmed there is no GST on books, so the existing "Bill of Supply" format on `feature/admin-invoice-printing` (PR #10) is the right one; nothing to add.
- [ ] **Invoice numbering must start at 1 for the real site** (decided 2026-10-12). `feature/admin-invoice-printing` currently does `create sequence orders_invoice_number_seq start with 470` (to continue the old business's #469) in both `supabase/schema.sql` and `invoice-number-column.sql`. To do on that branch (PR #10): change both to `start with 1` and drop the "continue from #469" notes. Numbers are assigned lazily on the first admin print, so every test invoice printed so far has consumed a number — **before launch**, once the test orders are cleared, run `alter sequence orders_invoice_number_seq restart with 1; update orders set invoice_number = null;` (or start from a clean production database). Invoice numbers should stay gap-free and in order once real invoices begin — confirm with the accountant whether they want one running series or a fresh series each financial year.
- [ ] **Checkout validation** — phone (10-digit Indian mobile) and PIN (6 digits), client and server side — do in the Razorpay PR (#11).
- [ ] **Set `CRON_SECRET`** in Vercel so only Vercel Cron can call `/api/cron/*`.
