# Sangit Shree Prakashan — Project Brief

## What this is
E-commerce site for a classical Indian music book publisher based in Kanpur, UP. Sells books on raag, vocal, instrumental, kathak, music theory, CBSE music, and bundles. Brand is traditional, classical — not modern or playful.

## Stack
- Next.js 14 App Router, TypeScript
- Tailwind CSS with custom design tokens
- Framer Motion for animations
- Zustand v4 + persist middleware (localStorage) for client-side state
- Supabase (Postgres + Auth) — orders database and customer accounts, live
- Resend for transactional email — live, but see "Known issues" below
- Lucide React icons
- Deployed on Vercel, source on GitHub

## Links
- **GitHub:** https://github.com/bharani-mandapaka/sangitshreeprakashan
- **Live site:** https://sangit-shree-prakashan.vercel.app

## Commands
```bash
npm run dev         # local dev server
npm run build       # production build check
npx vercel --prod   # deploy to Vercel
```

## Git workflow (mandatory)
- NEVER commit or push directly to master
- Always start work with: `git checkout master && git pull origin master`
- Always create a feature branch first: `git checkout -b feature/description`
- Always run `npm run build` before committing — fix any errors first
- Add files by name only — never use `git add .`
- Push to the feature branch: `git push origin feature/branch-name`
- After pushing, open a Pull Request on GitHub and message Bharani

## Design tokens
| Token | Value | Usage |
|-------|-------|-------|
| gold | #C9A84C | Brand accent, CTAs, borders |
| dark | #040000 | Page background |
| cream | #F5ECD7 | Body text |
| Cinzel | font-cinzel | All headings and UI labels |

Key Tailwind classes in use: `text-gold`, `text-cream`, `bg-dark`, `input-gold`, `font-cinzel`.

---

## Known issues

- **Resend domain not currently verified — on hold.** `sangitshreeprakashan.com` shows as unverified on Resend's side (`https://resend.com/domains`), even though earlier notes said it was verified — something changed (DNS records dropped, or a different Resend account/key now in use). Every customer email (order placed/shipped/delivered) fails silently-ish today: `fireNotifications()` catches the error and logs it, but the customer never receives anything. Needs whoever owns the domain's DNS (Bharani) to re-verify it in Resend. Complication: `sangitshreeprakashan.com` already has an existing website live on it, so this is paused pending a closer look at the domain's current DNS setup before adding records — see the Notifications section in `tasks.md`. Until then, emails can be tested by temporarily sending `from` Resend's built-in `onboarding@resend.dev` test address.
- **`notification_rules`/`notification_logs` RLS is still fully permissive** to the anon key (`for all to anon using (true) with check (true)`) — unlike `orders`/`order_items`, which got scoped down. See Security & maintenance in `tasks.md`.

---

## Current state — what is prototype vs real

| Feature | Status |
|---------|--------|
| Book catalog UI | Real — 36 books across 7 categories, served from the Supabase `books` table (see "Book catalog" below) |
| Book detail pages | Real — server component passes book to `BookDetailClient` |
| Admin catalog management | Real — `/admin/books` lists, creates, edits, and deletes books (bundles are just books with `isBundle` checked, same form) via `app/api/admin/books/route.ts` |
| Cart + checkout UI | Real |
| Payments | Real, code-complete — checkout goes through Razorpay's actual hosted widget (`app/checkout/page.tsx` + `POST /api/checkout/create-order` + `POST /api/checkout/verify`); no order is saved until the payment signature is verified. Still needs real `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` in env — test-mode keys work today, live keys are blocked on Bharani's GST/PAN account approval. See "Payments (Razorpay)" below. |
| Orders saved to DB | Real — `POST /api/checkout/verify` writes to Supabase via the service-role key, only after the payment signature and amount are verified (see "Payments (Razorpay)" below). The old unconditional-save route, `POST /api/orders/create`, has been deleted — it predated real payments and would create a confirmed order with no payment involved at all. |
| Order-lifecycle notifications | Real, code-wise — placed/shipped/delivered each fire one email + WhatsApp to the customer via `fireNotifications()`, with a duplicate-send guard (`shipped_at`/`delivered_at` only ever get set once). Email delivery is currently blocked by the Resend domain issue above; WhatsApp is skipped until Meta Cloud API creds exist. |
| Admin dashboard | Real — reads orders from Supabase |
| Admin orders page | Real — reads from Supabase via a service-role API route; marking an order "Shipped" requires entering Tracking ID + Courier first |
| Admin invoice printing | Real, pending one setup step — "Print Invoice" per order (and "Print Selected" for many at once) on `/admin/orders` renders a real Bill of Supply; needs `invoice-number-column.sql` run in Supabase first (see "Admin panel" above), with its sequence starting value confirmed against the business's current invoice numbering |
| Admin analytics | localStorage — visits/clicks tracked client-side via analytics-store |
| Customer phone-login OTP | Mock — code returned in the API response and shown on screen, not actually texted |
| Admin users-page OTP | Mock — separate from the above, still just a UI simulation |
| WhatsApp notifications | Wired in code (`fireNotifications()` calls Meta's Cloud API) but silently skipped — no `WHATSAPP_PHONE_NUMBER_ID`/`WHATSAPP_TOKEN` configured yet |
| Google OAuth (admin sign-in) | Simulated UI — no real token (separate from customer accounts below) |
| Customer accounts | Real — phone number + OTP is the only sign-up/login method (no Google option today). Backed by Supabase Auth under the hood via a synthetic email + HMAC-derived password (see "Phone auth" below); optional real email can be added after sign-up. |
| Wishlist | Real — `wishlist` table in Supabase, heart icon on book cards and detail pages |
| Customer order history | Real — `/profile` Orders tab, filtered by `orders.user_id` (guest checkout still works; those orders just aren't linked to an account) |
| Book images | Real — all 36 books have real cover photos |
| Admin auth | Real, but password-based — signed httpOnly session cookie (`lib/admin-auth.ts`), password lives server-only in `ADMIN_PASSWORD` env var, never committed to the repo. Not NextAuth/Google yet (see Phase 2). |
| SEO metadata | Real — generateMetadata() on all public pages |
| Sitemap | Real — auto-generated at /sitemap.xml for all pages + 36 books |

---

## Environment variables
Stored in `.env.local` locally and in Vercel project settings (set via `npx vercel env add`).
**`.env.example` is the source of truth** — it documents every variable and which Vercel scopes
each one needs. Keep it updated when adding a variable.

```
NEXT_PUBLIC_SUPABASE_URL       # required
NEXT_PUBLIC_SUPABASE_ANON_KEY  # required
SUPABASE_SERVICE_ROLE_KEY      # required — server-only, bypasses RLS for order/admin writes
RESEND_API_KEY                 # required
PHONE_AUTH_SECRET              # required — HMAC key deriving each phone account's password
ADMIN_PASSWORD                 # required — admin panel login, checked server-side only
ADMIN_SESSION_SECRET           # required — signs the admin session cookie
CRON_SECRET                    # optional — Bearer token for the digest cron routes
WHATSAPP_PHONE_NUMBER_ID       # optional — unset means WhatsApp sends are skipped
WHATSAPP_TOKEN                 # optional
RAZORPAY_KEY_ID                # required — also returned to the browser (public by design)
RAZORPAY_KEY_SECRET            # required — server-only, signs/verifies payments
```

`NEXT_PUBLIC_*` variables are inlined at build time — enable them for Production, Preview **and**
Development in Vercel, or PR preview deploys build without them.

---

## Admin panel
- URL: `/admin`
- Password: set via the `ADMIN_PASSWORD` env var (not committed anywhere in this repo)
- Auth: `POST /api/admin/login` checks the password and sets a signed httpOnly cookie (`ssp_admin_session`, `lib/admin-auth.ts`); `POST /api/admin/logout` clears it. Every admin API route checks this cookie server-side via `isAdminRequest()`.
- Sidebar pages: Dashboard, Orders, Catalog, Notifications, Users
- **Print Invoice** — from `/admin/orders`, each order has a "Print Invoice" link opening `/admin/orders/[id]/invoice` in a new tab: a plain black-on-white, print-styled Bill of Supply (logo + business details on the left, "BILL OF SUPPLY" centered, Bill To block, line items, Grand Total/Delivery Fee/Total Paid, Authorised Signatory footer) matching the business's existing real invoice format (Invoice #469). Letterhead details live in `lib/seller-details.ts` (reuses `CONTACT` from `lib/utils.ts` — one source of truth, not re-typed). No GSTIN/HSN/tax fields — it's a Bill of Supply, not a GST Tax Invoice. The actual document markup lives in `components/admin/InvoiceSheet.tsx`, shared with bulk printing below. See `order-invoice-user-stories.md` for the full story and explicitly out-of-scope items (customer-facing access, packing slip — both deferred).
  - **Before this ships:** `invoice-number-column.sql` needs running in Supabase (adds the column, sequence, and RPC) — and the sequence's starting value (currently `470`) needs to be set to whatever number actually comes after the last invoice issued by the business's current process, so the two don't collide. See that file's comments and the Open Questions in `order-invoice-user-stories.md`.
- **Print Selected (bulk invoices)** — `/admin/orders` has a checkbox per order (plus a header "select all" checkbox that only affects the currently filtered/visible rows) and a "Print Selected (N)" button next to Export CSV. Clicking it opens `/admin/orders/print-batch?ids=a,b,c` in a new tab, which fetches all the selected orders via `GET /api/admin/orders/invoice-batch`, renders one `InvoiceSheet` per order with a page break between them, and auto-triggers the browser print dialog once loaded (a manual "Print All" button is there too, in case the browser blocks the automatic call) — so one print action covers the whole batch.

**Customer-facing "Download Invoice"** — separate from the admin panel above. Each order in `/profile`'s Orders tab has a "Download Invoice" link opening `/orders/[id]/invoice` in a new tab — same `InvoiceSheet` document, same numbering, reached a different way: `GET /api/orders/[id]/invoice` checks the customer's own Supabase Auth session (bearer token) instead of the admin cookie, and only returns an order that belongs to that signed-in user. "Download" is the browser's native Print dialog ("Save as PDF"), same as the admin flow — no server-generated PDF exists. Scoped to logged-in customers via order history only for now; the checkout-success screen and guest-checkout access are deliberately not wired up yet (see Story 8's open question in `order-invoice-user-stories.md`).

## Phone auth (customer sign-up/login)
Supabase Auth only ships with email+password out of the box, so phone-first
auth is layered on top of it rather than replacing it:
- The "email" Supabase sees is synthetic: `phone-<digits>@ssp-phone-auth.internal`.
- The "password" is never stored — it's deterministically derived as
  `HMAC-SHA256(PHONE_AUTH_SECRET, phone)` and recomputed on every login.
- OTPs are mocked: generated and checked server-side against the `phone_otps`
  table (service-role only, no RLS policies), returned directly in the API
  response for on-screen display. Swapping in a real SMS provider later only
  touches `app/api/auth/phone/send-otp/route.ts`.
- An optional real email can be attached after sign-up (stored in
  `user_metadata.real_email`) — never used for login, only for
  order-confirmation prefill.

## Payments (Razorpay)
Real payment integration, per `razorpay-integration-user-stories.md`. The core behavior change
from the old mock checkout: **an order is only ever saved once payment is verified — never
before, and never unconditionally.**

- `app/checkout/page.tsx`'s payment step no longer has its own hand-built UI — clicking "Pay"
  calls `POST /api/checkout/create-order`, then opens Razorpay's actual hosted widget
  (`checkout.razorpay.com/v1/checkout.js`, loaded via `next/script`) using the returned order id.
  The app never sees card numbers or UPI PINs.
- On success, the widget's `handler` callback POSTs the payment id/order id/signature to
  `POST /api/checkout/verify`, which independently re-derives the signature with
  `RAZORPAY_KEY_SECRET` (`lib/razorpay.ts`'s `verifyRazorpaySignature`) before trusting anything —
  only then does the order get written to Supabase and the customer notified.
- The amount charged is computed **server-side, twice** — once in `create-order`, once again in
  `verify` — from each book's real, current price in the `books` table
  (`lib/books-data.ts`'s `computeVerifiedSubtotal`), never from whatever the client sends. A
  tampered client-side total can't under-charge.
- **The cart being saved is tied to what was actually paid**, not just to a valid signature.
  `verify` fetches the real order from Razorpay (`lib/razorpay.ts`'s `getRazorpayOrder`) and checks
  its `status`/`amount_paid` against the subtotal recomputed from the cart submitted *in that
  request* — a signature alone only proves some real payment happened, not that it paid for the
  cart about to be saved. Without this, a genuinely-valid payment for a cheap cart could be
  replayed against `verify` with a different, pricier cart and save as confirmed with nothing paid
  for the gap. (Flagged in PR #11's review.)
- **A payment can only ever create one order.** `verify` rejects if `razorpay_payment_id` has
  already been used on an existing order, and `orders.razorpay_payment_id` has a unique DB
  constraint (`razorpay-columns.sql`) as a second line of defense against two near-simultaneous
  requests for the same payment. Otherwise the same successful charge could be resubmitted
  repeatedly to create any number of orders. (Also flagged in PR #11's review.)
- **`POST /api/orders/create` has been deleted** — it predated real payments, saved a confirmed
  order unconditionally with no payment involved at all, and was a complete bypass around this
  entire flow. Nothing called it anymore. (Also flagged in PR #11's review.)
- Cancelled/abandoned payments (closing the widget) use Razorpay's `modal.ondismiss` — the
  customer lands back on the payment step with their cart intact, no error shown. Razorpay-reported
  failures (declined card, etc.) use the widget's `payment.failed` event, surfacing Razorpay's own
  failure reason inline and letting the customer retry immediately.
- Retrying always creates a **fresh** Razorpay order (no idempotency/reuse) — since no Supabase
  order exists until `verify` succeeds, a failed attempt followed by a successful retry never
  leaves a duplicate or orphaned order.
- Not covered here: refunds/cancellations after an order exists (would be its own story set), and
  reconciling failed attempts beyond server logs (`console.error` in both routes) — no dedicated
  admin view of failed payment attempts exists.

## Data stores (`lib/`)
Zustand + `persist` to localStorage for client-side state. Orders and notification rules are the source of truth in Supabase, not these stores.

| File | localStorage key | What it holds |
|------|-----------------|---------------|
| `cart-store.ts` | `ssp-cart` | Cart items |
| `orders-store.ts` | `ssp-orders` | Local order log (analytics use only — source of truth is Supabase) |
| `analytics-store.ts` | `ssp-analytics` | Visit/click/cart tracking |
| `notifications-store.ts` | `ssp-notifications` | Its `useNotificationsStore` hook is no longer actually used anywhere — `/admin/notifications` reads/writes `notification_rules` directly via Supabase. What *is* still used from this file: `EMAIL_TEMPLATES`/`WHATSAPP_TEMPLATES` (default copy per trigger), `parseDescription()` (the NL-to-rule parser), and the `NotificationTrigger`/`NotificationChannel` types. |
| `users-store.ts` | `ssp-users` | Admin users (3 seed users) |

## Supabase schema (live)
Full schema — including every RLS policy — lives in `supabase/schema.sql`; it's
written to be safely re-run any time (every `create` is `if not exists`, every
policy has a matching `drop policy if exists` first). Summary:

```sql
orders (id, created_at, status, customer_name, customer_email, customer_phone,
        address_line1, address_city, address_state, address_pincode,
        subtotal, payment_method, user_id,
        tracking_id, courier_service, shipped_at, delivered_at, expected_delivery_date,
        invoice_number)
        -- user_id nullable (guest checkout). tracking_id/courier_service set when
        -- first marked "Shipped". shipped_at/delivered_at double as both display
        -- data and the duplicate-notification guard (fire only on null → set).
        -- invoice_number is nullable and assigned lazily — the first time an
        -- admin prints that order's invoice (see "Admin panel" below), via
        -- the orders_invoice_number_seq sequence + next_invoice_number() RPC
        -- — not at order-creation time, so only orders someone actually
        -- prints ever consume a number. Never reassigned once set.
        -- razorpay_order_id/razorpay_payment_id are set by
        -- POST /api/checkout/verify once a payment is signature-verified —
        -- see "Payments (Razorpay)" below. Both null for any order that
        -- predates this (there are none yet; mock checkout never set them).

order_items (id, order_id, book_id, sku, title_english, title_hindi, qty, price)

wishlist (id, user_id, book_id, created_at) — unique (user_id, book_id)

phone_otps (id, phone, otp, expires_at, attempts, created_at)
            -- service-role only, no RLS policies at all

books (id, slug, title_hindi, title_english, price, category, level, language,
       authors, description, description_hindi, cover_image, series, part,
       is_bundle, is_featured, in_stock, tags, created_at, updated_at)
       -- Live source of truth for the storefront (see lib/books-data.ts) and
       -- admin catalog UI (/admin/books). id is the slug for books created via
       -- the admin panel; the original 36 seeded rows keep their hand-picked
       -- short-code ids (e.g. "sv-1"). cover_image is a URL — either a legacy
       -- manual path (e.g. /covers/foo.jpg into public/, from the original 36
       -- seeded books) or a real upload to the Supabase Storage 'covers'
       -- bucket via app/api/admin/books/upload-cover/route.ts. Both work; the
       -- field is just stored as a plain string either way. lib/books.ts (the
       -- old static array) is left in the repo but unused by any live consumer.

notification_rules (id, name, description, trigger, channel, recipients, subject, body,
                    whatsapp_numbers, whatsapp_message, active, created_at, audience)
                    -- trigger: order_placed | order_shipped | order_delivered |
                    --          daily_digest | weekly_digest | cart_abandoned
                    -- channel: email | whatsapp | both
                    -- audience: admin (default, staff-facing "Dear Admin" copy) |
                    --           customer (the 3 seeded order-lifecycle rules —
                    --           picks the customer-branded HTML wrapper instead
                    --           of the "ADMIN NOTIFICATION" one)

notification_logs  (id, rule_id, rule_name, trigger, channel, recipients, status, error, sent_at)
                    -- status: sent | failed | partial
```

**RLS status, per table:**
- `orders`/`order_items` — SELECT scoped to `auth.uid() = user_id`; no insert/update policies at all, so the anon key can't write to either table under any circumstance. All writes go through service-role-backed routes (`app/api/checkout/verify`, `app/api/admin/orders`).
- `wishlist` — properly scoped to the owning user (select/insert/delete all check `auth.uid() = user_id`).
- `phone_otps` — no policies whatsoever; service role only.
- `books` — public SELECT (`for select using (true)`); no insert/update/delete policy for anon at all, so writes only happen through the service-role admin route.
- `notification_rules`/`notification_logs` — **still fully permissive** to the anon key. Not yet tightened (see `tasks.md`).
- **Storage bucket `covers`** — public bucket (`public = true`); no RLS policy at all on `storage.objects` for it, deliberately — a public bucket already serves files at their public URL without RLS, and adding a SELECT policy would only let the anon key *list* every uploaded filename via the API for no functional benefit. Uploads only happen through the service-role `upload-cover` route.

## API routes (live)
- `POST /api/checkout/create-order` — Story 1: recomputes the cart's amount from real book prices (never trusts the client), creates a Razorpay order, returns `{ razorpayOrderId, amount, currency, keyId }`. Writes nothing to Supabase.
- `POST /api/checkout/verify` — Story 2: verifies the Razorpay payment signature server-side (rejects a forged/replayed "success"), confirms the actual amount paid on Razorpay's side matches the subtotal recomputed from the submitted cart (rejects a valid-but-replayed payment paired with a different, pricier cart), rejects a `razorpay_payment_id` already used for an order (rejects the same payment being reused to create multiple orders), and only then inserts order + items and fires the `order_placed` notification — the only place a real checkout ever creates an order now. The old unconditional-save route, `POST /api/orders/create`, has been deleted (it predated real payments, was a full bypass around this whole flow, and nothing called it anymore).
- `GET /api/admin/orders` — all orders + items, service-role, admin-cookie gated
- `PATCH /api/admin/orders` — updates order status; requires `trackingId`/`courierService` the first time it's set to "shipped"; fires `order_shipped`/`order_delivered` notifications only on the first transition into that status
- `GET /api/admin/orders/[id]/invoice` — order + items for the admin "Print Invoice" page; service-role, admin-cookie gated; lazily assigns and persists `invoice_number` on first call if the order doesn't have one yet
- `GET /api/admin/orders/invoice-batch?ids=a,b,c` — same as above but for the "Print Selected" bulk flow; returns the orders in the same order `ids` was given, assigning invoice numbers sequentially (not in parallel) for any that don't have one yet
- `GET /api/orders/[id]/invoice` — customer-facing "Download Invoice"; NOT admin-cookie gated — verifies the caller's Supabase Auth bearer token instead (same pattern as `POST /api/checkout/verify`) and checks `order.user_id` matches before returning anything; 404s (not 403) if the order doesn't belong to the caller, so it doesn't confirm which order ids exist
- `POST /api/admin/login` — checks `ADMIN_PASSWORD`, sets the signed session cookie
- `POST /api/admin/logout` — clears the session cookie
- `POST /api/admin/books` — create a book (or bundle); service-role, admin-cookie gated
- `PATCH /api/admin/books` — update a book by `id`
- `DELETE /api/admin/books` — delete a book by `id`
- `POST /api/admin/books/upload-cover` — uploads an image file to the Supabase Storage `covers` bucket, returns its public URL; service-role, admin-cookie gated; 5MB limit, JPG/PNG/WebP/AVIF only
- `POST /api/auth/phone/send-otp` — generates and stores a mock OTP for a phone number
- `POST /api/auth/phone/verify-otp` — checks the OTP, signs in/up via the synthetic-email mechanism above
- `POST /api/notifications/test` — sends a test notification for a given rule
- `GET /api/cron/daily-digest` — daily digest job
- `GET /api/cron/weekly-digest` — weekly digest job

## Book catalog
Live data lives in the Supabase `books` table (36 seeded books across 7 categories), read via
`lib/books-data.ts` (`getAllBooks`, `getBookBySlug`, `getBookById`, `getBooksByIds`,
`getBooksByCategory`, `getFeaturedBooks` — all async, all server-safe). Every storefront page
(`app/page.tsx`, `app/books/page.tsx`, `app/books/[slug]/page.tsx`, `app/sitemap.ts`,
`app/profile/page.tsx`'s wishlist tab) reads from there now, not from a static array.

`lib/books.ts` still exists and is still where the `Book`/`BookCategory`/`BookLevel`/
`BookLanguage` types and `categoryMeta` (per-category label/icon) come from — everything imports
those from it — but its own static 36-book array and helper functions (`getBookBySlug`,
`getBookById`, etc.) are dead code, superseded by `lib/books-data.ts`. Left in place rather than
deleted; safe to remove later.

Each book has: `id`, `slug`, `titleEnglish`, `titleHindi`, `authors`, `price`, `category`, `level`, `language`, `description`, `tags`, `series`, `part`, `isBundle` (plus `isFeatured`/`inStock`, DB-only — not on the `Book` type, only used by the admin form and `lib/books-data.ts`'s row mapper).

Categories: `instrumental` (व), `vocal` (ग), `raag-theory` (र), `kathak` (क), `research` (श), `cbse` (प), `bundle` (सं). Icons are single Devanagari characters styled with `font-devanagari text-gold`.

Admins manage the catalog at `/admin/books` — list/search/filter, create, edit, delete. Bundles
aren't a separate flow, just a book with the "Bundle Set" checkbox on. Cover images support a real
file upload (JPG/PNG/WebP/AVIF, 5MB max) to the Supabase Storage `covers` bucket via
`app/api/admin/books/upload-cover/route.ts`, with a live thumbnail preview in the form — the
underlying path/URL field is still directly editable too, so the original 36 books' legacy
`/covers/foo.jpg` paths (files in `public/covers/`) keep working exactly as before. `next.config.mjs`
allow-lists `*.supabase.co` under `images.remotePatterns` so `next/image` can serve the uploaded URLs.

### Books added by Shreeyanshi (July 2026)
- Swar Vadan Part 1
- Raag Shastra Parichay Part 3
- Concepts of Vocal Music Class IX, X, XI, XII
- Concepts of Instrumental Music Class IX, X, XI, XII
- Sangit Saar Gayan Class XI
- Bal Sangit Sangrah Parts 1, 2, 3 (individual)
- Treasure of Raags & Taals

## SEO
- `app/layout.tsx` — site-wide metadata, metadataBase, OG tags, Twitter card
- `app/page.tsx` — homepage metadata
- `app/books/layout.tsx` — catalog page metadata
- `app/books/[slug]/page.tsx` — dynamic per-book metadata via generateMetadata()
- `app/about/page.tsx` — about page metadata
- `app/contact/layout.tsx` — contact page metadata
- `app/sitemap.ts` — auto-generates /sitemap.xml for all pages + all book slugs

### Title template — known gotcha
`app/layout.tsx` defines `title.template = '%s | Sangit Shree Prakashan'`, which appends the
brand to every child page's title.

**A nested layout that sets `title` as a plain string silently kills that template for all of
its children.** Next.js resolves a string title to `{ absolute, template: null }`, so the
template stops at that segment. This is what broke every book detail page — they rendered a bare
`<title>` with no brand until `app/books/layout.tsx` was changed to:

```ts
title: { default: 'All Books', template: '%s | Sangit Shree Prakashan' },
```

If you add a new nested layout with its own `title`, use the `{ default, template }` form, then
verify with `npm run build && npx next start` and check the `<title>` of a child route — not just
the layout's own route.

## Key component patterns
- **BookCard** — persistent View + Add to Cart buttons below cover image
- **BookDetailClient** — `'use client'` component; receives `book` as prop from server component page `app/books/[slug]/page.tsx`
- **Admin layout** (`app/admin/layout.tsx`) — checks the admin session cookie, wraps all `/admin/*` pages
- **PhoneAuthForm** (`components/PhoneAuthForm.tsx`) — shared by `/login` and `/signup`, `mode` prop picks which
- **Zustand selectors** — always destructure what you need: `const addItem = useCartStore((s) => s.addItem)`
- **No `<img>` tags** — use Next.js `<Image>` with `fill` + `object-contain` for book covers
- **Next.js 14 params** — params is a plain sync object in page components. Do NOT use `use(params)` — that's Next.js 15 only. Pattern: server component page reads `params.slug`, fetches data, passes as prop to client child.

## Seed users (users-store)
| Name | Email | Role |
|------|-------|------|
| Bharani Mandapaka | meetbharani91@gmail.com | admin |
| Rohit Kumar | rohit.kumar@sangitshreeprakashan.com | staff |
| Priya Sharma | priya.sharma@gmail.com | viewer |

---

## Phase 1 — Making it real for customers

**Goal:** A customer can browse, pay, and receive confirmation. Orders appear in the database.

**Critical path:** ~~Supabase setup~~ ✓ → ~~confirmation email~~ ✓ → ~~SEO~~ ✓ → ~~customer accounts~~ ✓ → ~~order-lifecycle notifications~~ ✓ (code-complete; blocked on Resend domain re-verification for actual delivery) → ~~Razorpay integration~~ ✓ code-complete, **blocked on real API keys (Bharani's account approval) to actually go live**.

### Services status
| What | Service | Status |
|------|---------|--------|
| Database | Supabase (Postgres) | Live — orders, order_items, wishlist, phone_otps, notification_rules, notification_logs |
| Auth | Supabase Auth | Live — phone+OTP for customers (mock OTP), password-gated cookie for admin |
| Transactional email | Resend | Code-complete, but the domain shows unverified on Resend's side right now — see Known issues |
| Payments | Razorpay | Code-complete (see "Payments (Razorpay)" above) — needs `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` in env to actually run. Test-mode keys work today without waiting on approval; live keys need Bharani's GST/PAN account verification. See `razorpay-integration-user-stories.md`. |
| SEO | Next.js generateMetadata + sitemap | Live |

### Remaining Phase 1 work
- Get real Razorpay API keys into env (test-mode keys to try it out now; live keys once Bharani's account is approved) and test the actual pay → verify → order-saved flow end-to-end
- Re-verify the `sangitshreeprakashan.com` domain on Resend (blocked on whoever owns the DNS)
- Founder timeline — real photos, refined content (mobile scroll fix done in PR #4)
- Final copy for book descriptions, table of contents, author bios
- Richer book detail pages (TOC, edition/ISBN, sample pages)
- `generateStaticParams()` on `app/books/[slug]` to prerender book pages

---

## Phase 2 — Making admin fully functional

**Goal:** Admin can manage the catalog, see real orders, send real notifications, and log in securely.

**Depends on:** Phase 1 complete.

### Services to integrate
| What | Service | Notes |
|------|---------|-------|
| Auth | NextAuth.js + Google | Admin login is real (signed cookie, no committed password) but still a single shared password, not per-person Google accounts or roles |
| OTP | MSG91 or Twilio Verify | Replace mock OTP — both the customer phone-login flow and the admin users page still use mocks |
| WhatsApp | Meta Cloud API | Code already calls it in `fireNotifications()`; start business verification early — approval takes 2–4 weeks |

### Remaining Phase 2 work
- Tighten RLS on `notification_rules`/`notification_logs` (still open to the anon key)
- Real Google OAuth + role-based access for admin (staff vs admin)
- ~~Catalog management from admin: edit/create books, create/edit bundles, migrate `lib/books.ts` to a Supabase `books` table~~ ✓ done — see "Book catalog" above and `/admin/books`
- ~~Real cover-image upload to Supabase Storage~~ ✓ done — see "Book catalog" above
- Manually create an order from admin (phone/walk-in orders)
- Patch the Next.js CVE flagged by `npm audit` (dev-server origin-verification issue, plus `ws`/`glob` vulnerabilities) — stay within the 14.2.x line, don't jump to Next 15 (breaks the `params` API this codebase relies on)

### Additional Supabase tables (Phase 2)
```sql
admin_users (id, name, email, phone, role, auth_provider, created_at)
```
