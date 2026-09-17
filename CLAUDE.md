# Sangit Shree Prakashan — Project Brief

## What this is
E-commerce site for a classical Indian music book publisher based in Kanpur, UP. Sells books on raag, vocal, instrumental, kathak, music theory, CBSE music, and bundles. Brand is traditional, classical — not modern or playful.

## Stack
- Next.js 14 App Router, TypeScript
- Tailwind CSS with custom design tokens
- Framer Motion for animations
- Zustand v4 + persist middleware (localStorage) for client-side state
- Supabase (Postgres) for orders database — live
- Resend for transactional email — live (domain verified)
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

## Current state — what is prototype vs real

| Feature | Status |
|---------|--------|
| Book catalog UI | Real — 36 books across 7 categories |
| Book detail pages | Real — server component passes book to `BookDetailClient` |
| Cart + checkout UI | Real |
| Payments | Mock — no Razorpay yet |
| Orders saved to DB | Real — `POST /api/orders/create` writes to Supabase on checkout |
| Order confirmation email | Real — Resend sends from `orders@sangitshreeprakashan.com` |
| Admin dashboard | Real — reads orders from Supabase |
| Admin orders page | Real — reads from Supabase, status updates write back |
| Admin analytics | localStorage — visits/clicks tracked client-side via analytics-store |
| Customer phone-login OTP | Real send path code-complete via WhatsApp (`lib/whatsapp-otp.ts`, Meta Cloud API Authentication template) — falls back to the mock (code returned in the API response, shown on screen) whenever `WHATSAPP_PHONE_NUMBER_ID`/`WHATSAPP_TOKEN` aren't set or the send fails. Blocked on Meta Business verification + an approved Authentication template, same as WhatsApp notifications below. |
| Admin users-page OTP | Mock — separate from the above, still just a UI simulation |
| WhatsApp notifications | Wired in code (`fireNotifications()` calls Meta's Cloud API) but silently skipped — no `WHATSAPP_PHONE_NUMBER_ID`/`WHATSAPP_TOKEN` configured yet. Customer OTP delivery (`lib/whatsapp-otp.ts`) uses the same credentials via a separate Authentication-template send — see "Phone auth" below. |
| Google OAuth (admin sign-in) | Simulated UI — no real token (separate from customer accounts below) |
| Customer accounts | Real — Supabase Auth, email/password works out of the box. Google sign-in (`/login`, `/signup` "Continue with Google") is now live — Google Cloud OAuth app + Supabase provider config completed (was blocking PR #8's review, confirmed working now). One open issue before this should reach real customers: every sign-in triggers a Google security email titled "You shared some Google Account data with `kypqmrfgxeybqzkawogb.supabase.co`" — Supabase's raw domain instead of the brand name, which could read as suspicious to a non-technical customer. Fix needs Supabase's paid Custom Domain feature — see `tasks.md`. |
| Wishlist | Real — `wishlist` table in Supabase, heart icon on book cards and detail pages |
| Customer order history | Real — `/profile` Orders tab, filtered by `orders.user_id` (guest checkout still works; those orders just aren't linked to an account) |
| Book images | Real — all 36 books have real cover photos |
| Admin auth | localStorage password gate (`ssp@admin`) |
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
RESEND_API_KEY                 # required
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
- Sidebar pages: Dashboard, Orders, Notifications, Users

## Phone auth (customer sign-up/login)
Supabase Auth only ships with email+password out of the box, so phone-first
auth is layered on top of it rather than replacing it:
- The "email" Supabase sees is synthetic: `phone-<digits>@ssp-phone-auth.internal`.
- The "password" is never stored — it's deterministically derived as
  `HMAC-SHA256(PHONE_AUTH_SECRET, phone)` and recomputed on every login.
- OTPs are generated and checked server-side against the `phone_otps` table
  (service-role only, no RLS policies). `POST /api/auth/phone/send-otp`
  (`app/api/auth/phone/send-otp/route.ts`) tries a real WhatsApp send first
  via `lib/whatsapp-otp.ts` (Meta Cloud API, Authentication-category template
  — required for business-initiated messages, unlike the free-form text
  `lib/notifications-sender.ts` uses for order updates) whenever
  `WHATSAPP_PHONE_NUMBER_ID`/`WHATSAPP_TOKEN` are set; otherwise — or if that
  send throws — it falls back to the original mock: the code is returned
  directly in the API response for on-screen display. Went with WhatsApp over
  a paid SMS provider (MSG91/Twilio) since it rides the same Meta Business
  verification already planned for order notifications, avoiding a second
  paid integration. See `.env.example`'s WhatsApp OTP template section for
  the template name/language/button env vars — they must match whatever
  Authentication template gets approved in Meta's WhatsApp Manager.
- An optional real email can be attached after sign-up (stored in
  `user_metadata.real_email`) — never used for login, only for
  order-confirmation prefill.

## Data stores (`lib/`)
Zustand + `persist` to localStorage for client-side state. Orders are also written to Supabase on every checkout.

| File | localStorage key | What it holds |
|------|-----------------|---------------|
| `cart-store.ts` | `ssp-cart` | Cart items |
| `orders-store.ts` | `ssp-orders` | Local order log (analytics use only — source of truth is Supabase) |
| `analytics-store.ts` | `ssp-analytics` | Visit/click/cart tracking |
| `notifications-store.ts` | `ssp-notifications` | Notification rules |
| `users-store.ts` | `ssp-users` | Admin users (3 seed users) |

## Supabase schema (live)
```sql
orders (id, created_at, status, customer_name, customer_email, customer_phone,
        address_line1, address_city, address_state, address_pincode,
        subtotal, payment_method)

order_items (id, order_id, book_id, sku, title_english, title_hindi, qty, price)

notification_rules (id, name, description, trigger, channel, recipients, subject, body,
                    whatsapp_numbers, whatsapp_message, active, created_at)
                    -- trigger: order_placed | daily_digest | weekly_digest | cart_abandoned
                    -- channel: email | whatsapp | both

notification_logs  (id, rule_id, rule_name, trigger, channel, recipients, status, error, sent_at)
                    -- status: sent | failed | partial
```
RLS is permissive (anon can do everything on all four tables) — to be tightened in Phase 2 with auth.

Full schema lives in `supabase/schema.sql`.

## API routes (live)
- `POST /api/orders/create` — inserts order + items to Supabase, sends Resend confirmation email
- `POST /api/notifications/test` — sends a test notification for a given rule
- `GET /api/cron/daily-digest` — daily digest job
- `GET /api/cron/weekly-digest` — weekly digest job

## Book catalog
All books are a static array in `lib/books.ts`. Total: 36 books across 7 categories.

Each book has: `id`, `slug`, `titleEnglish`, `titleHindi`, `authors`, `price`, `category`, `level`, `language`, `description`, `tags`, `series`, `part`, `isBundle`.

Categories: `instrumental` (व), `vocal` (ग), `raag-theory` (र), `kathak` (क), `research` (श), `cbse` (प), `bundle` (सं). Icons are single Devanagari characters styled with `font-devanagari text-gold`.

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
- **Admin layout** (`app/admin/layout.tsx`) — password gate + sidebar, wraps all `/admin/*` pages
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

**Critical path:** ~~Supabase setup~~ ✓ → ~~confirmation email~~ ✓ → ~~SEO~~ ✓ → Razorpay integration (remaining blocker).

### Services status
| What | Service | Status |
|------|---------|--------|
| Database | Supabase (Postgres) | Live — orders, order_items, notification_rules, notification_logs |
| Transactional email | Resend | Live — domain `sangitshreeprakashan.com` verified |
| Payments | Razorpay | Not started — needs GST/PAN account verification |
| SEO | Next.js generateMetadata + sitemap | Live — merged via PR #2 + PR #3 (fix) |

### API routes to build
- `POST /api/checkout/create-order` — creates Razorpay order, returns order ID to frontend
- `POST /api/checkout/verify` — verifies Razorpay payment signature, writes order to Supabase

### Remaining Phase 1 work
- Razorpay account approval + payment integration (blocked on Bharani)
- Founder timeline — real photos, refined content (mobile scroll fix done in PR #4)

---

## Phase 2 — Making admin fully functional

**Goal:** Admin can manage the catalog, see real orders, send real notifications, and log in securely.

**Depends on:** Phase 1 complete.

### Services to integrate
| What | Service | Notes |
|------|---------|-------|
| Auth | NextAuth.js + Google | Admin login is real (signed cookie, no committed password) but still a single shared password, not per-person Google accounts or roles |
| OTP | WhatsApp (Meta Cloud API) for customer login | Customer phone-login OTP is code-complete via `lib/whatsapp-otp.ts` — chosen over MSG91/Twilio to reuse the WhatsApp integration below instead of a second paid provider. Blocked on the same Meta verification + a separate Authentication-template approval. The admin users-page OTP mock is unrelated and still needs its own provider decision. |
| WhatsApp | Meta Cloud API | Code already calls it in `fireNotifications()`; start business verification early — approval takes 2–4 weeks |

### Remaining Phase 2 work
- Tighten RLS on `notification_rules`/`notification_logs` (still open to the anon key)
- Real Google OAuth + role-based access for admin (staff vs admin)
- Catalog management from admin: edit/create books, create/edit bundles, migrate `lib/books.ts` to a Supabase `books` table (built on `feature/admin-catalog-management`, not yet on this branch)
- Manually create an order from admin (phone/walk-in orders)
- Patch the Next.js CVE flagged by `npm audit` (dev-server origin-verification issue, plus `ws`/`glob` vulnerabilities) — stay within the 14.2.x line, don't jump to Next 15 (breaks the `params` API this codebase relies on)

### Additional Supabase tables (Phase 2)
`notification_rules` and `notification_logs` already exist — see the live schema above.
Still to create:
```sql
admin_users (id, name, email, phone, role, auth_provider, created_at)
books       (id, slug, title_english, title_hindi, authors, price, category, level, language, description, tags, series, part, is_bundle, cover_url, in_stock)
```
