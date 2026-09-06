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

- **Resend domain not currently verified.** `sangitshreeprakashan.com` shows as unverified on Resend's side (`https://resend.com/domains`), even though earlier notes said it was verified — something changed (DNS records dropped, or a different Resend account/key now in use). Every customer email (order placed/shipped/delivered) fails silently-ish today: `fireNotifications()` catches the error and logs it, but the customer never receives anything. Needs whoever owns the domain's DNS (Bharani) to re-verify it in Resend. Until then, emails can be tested by temporarily sending `from` Resend's built-in `onboarding@resend.dev` test address.
- **Checkout doesn't check the order-create response.** `app/checkout/page.tsx`'s `handlePay()` calls `POST /api/orders/create` but never checks `res.ok` before showing the success screen — if the save fails server-side, the customer still sees "order confirmed" with nothing actually saved. Predates this session's notification work; not yet fixed.
- **`notification_rules`/`notification_logs` RLS is still fully permissive** to the anon key (`for all to anon using (true) with check (true)`) — unlike `orders`/`order_items`, which got scoped down. See Security & maintenance in `tasks.md`.

---

## Current state — what is prototype vs real

| Feature | Status |
|---------|--------|
| Book catalog UI | Real — 36 books across 7 categories, served from the Supabase `books` table (see "Book catalog" below) |
| Book detail pages | Real — server component passes book to `BookDetailClient` |
| Admin catalog management | Real — `/admin/books` lists, creates, edits, and deletes books (bundles are just books with `isBundle` checked, same form) via `app/api/admin/books/route.ts` |
| Cart + checkout UI | Real |
| Payments | Mock — no Razorpay yet (see `razorpay-integration-user-stories.md`) |
| Orders saved to DB | Real — `POST /api/orders/create` writes to Supabase via the service-role key |
| Order-lifecycle notifications | Real, code-wise — placed/shipped/delivered each fire one email + WhatsApp to the customer via `fireNotifications()`, with a duplicate-send guard (`shipped_at`/`delivered_at` only ever get set once). Email delivery is currently blocked by the Resend domain issue above; WhatsApp is skipped until Meta Cloud API creds exist. |
| Admin dashboard | Real — reads orders from Supabase |
| Admin orders page | Real — reads from Supabase via a service-role API route; marking an order "Shipped" requires entering Tracking ID + Courier first |
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
```

`NEXT_PUBLIC_*` variables are inlined at build time — enable them for Production, Preview **and**
Development in Vercel, or PR preview deploys build without them.

---

## Admin panel
- URL: `/admin`
- Password: set via the `ADMIN_PASSWORD` env var (not committed anywhere in this repo)
- Auth: `POST /api/admin/login` checks the password and sets a signed httpOnly cookie (`ssp_admin_session`, `lib/admin-auth.ts`); `POST /api/admin/logout` clears it. Every admin API route checks this cookie server-side via `isAdminRequest()`.
- Sidebar pages: Dashboard, Orders, Catalog, Notifications, Users

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
        tracking_id, courier_service, shipped_at, delivered_at, expected_delivery_date)
        -- user_id nullable (guest checkout). tracking_id/courier_service set when
        -- first marked "Shipped". shipped_at/delivered_at double as both display
        -- data and the duplicate-notification guard (fire only on null → set).

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
       -- short-code ids (e.g. "sv-1"). cover_image is a manual path
       -- (e.g. /covers/foo.jpg into public/), not a real upload — see
       -- app/api/admin/books/route.ts. lib/books.ts (the old static array) is
       -- left in the repo but unused by any live consumer.

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
- `orders`/`order_items` — SELECT scoped to `auth.uid() = user_id`; no insert/update policies at all, so the anon key can't write to either table under any circumstance. All writes go through service-role-backed routes (`app/api/orders/create`, `app/api/admin/orders`).
- `wishlist` — properly scoped to the owning user (select/insert/delete all check `auth.uid() = user_id`).
- `phone_otps` — no policies whatsoever; service role only.
- `books` — public SELECT (`for select using (true)`); no insert/update/delete policy for anon at all, so writes only happen through the service-role admin route.
- `notification_rules`/`notification_logs` — **still fully permissive** to the anon key. Not yet tightened (see `tasks.md`).

## API routes (live)
- `POST /api/orders/create` — verifies the caller's session (if any), inserts order + items via the service-role client, computes `expected_delivery_date`, fires the `order_placed` customer notification
- `GET /api/admin/orders` — all orders + items, service-role, admin-cookie gated
- `PATCH /api/admin/orders` — updates order status; requires `trackingId`/`courierService` the first time it's set to "shipped"; fires `order_shipped`/`order_delivered` notifications only on the first transition into that status
- `POST /api/admin/login` — checks `ADMIN_PASSWORD`, sets the signed session cookie
- `POST /api/admin/logout` — clears the session cookie
- `POST /api/admin/books` — create a book (or bundle); service-role, admin-cookie gated
- `PATCH /api/admin/books` — update a book by `id`
- `DELETE /api/admin/books` — delete a book by `id`
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
aren't a separate flow, just a book with the "Bundle Set" checkbox on. Cover images are a manual
path field (e.g. `/covers/foo.jpg`, meaning a file already in `public/covers/`) — there's no
upload UI; that's a possible Phase 2+ upgrade (Supabase Storage) if it's ever needed.

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

**Critical path:** ~~Supabase setup~~ ✓ → ~~confirmation email~~ ✓ → ~~SEO~~ ✓ → ~~customer accounts~~ ✓ → ~~order-lifecycle notifications~~ ✓ (code-complete; blocked on Resend domain re-verification for actual delivery) → **Razorpay integration (remaining blocker)**.

### Services status
| What | Service | Status |
|------|---------|--------|
| Database | Supabase (Postgres) | Live — orders, order_items, wishlist, phone_otps, notification_rules, notification_logs |
| Auth | Supabase Auth | Live — phone+OTP for customers (mock OTP), password-gated cookie for admin |
| Transactional email | Resend | Code-complete, but the domain shows unverified on Resend's side right now — see Known issues |
| Payments | Razorpay | Not started — needs GST/PAN account verification. See `razorpay-integration-user-stories.md` for the three stories covering this. |
| SEO | Next.js generateMetadata + sitemap | Live |

### Remaining Phase 1 work
- Razorpay account approval + payment integration (blocked on Bharani) — see `razorpay-integration-user-stories.md`
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
- Real cover-image upload to Supabase Storage (today it's a manual path field — good enough for now, but an upload UI would be nicer)
- Manually create an order from admin (phone/walk-in orders)
- Patch the Next.js CVE flagged by `npm audit` (dev-server origin-verification issue, plus `ws`/`glob` vulnerabilities) — stay within the 14.2.x line, don't jump to Next 15 (breaks the `params` API this codebase relies on)

### Additional Supabase tables (Phase 2)
```sql
admin_users (id, name, email, phone, role, auth_provider, created_at)
```
