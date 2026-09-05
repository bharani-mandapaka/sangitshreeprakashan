# Tasks — Sangit Shree Prakashan

## Done

### Foundation
- [x] Project setup — Next.js 14, Tailwind, Framer Motion, Zustand
- [x] Book catalog with category filter and search
- [x] Shopping cart with localStorage persist
- [x] Checkout page with order summary and payment flow (payment step is still mock — see Phase 1)
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

### Catalog management (books table + admin UI)
- [x] New Supabase `books` table (public SELECT, service-role-only writes) seeded with all 36 books migrated from the static `lib/books.ts` array
- [x] `lib/books-data.ts` — async, server-safe reads (`getAllBooks`, `getBookBySlug`, `getBookById`, `getBooksByIds`, `getBooksByCategory`, `getFeaturedBooks`)
- [x] `app/api/admin/books` (POST/PATCH/DELETE) — service-role, admin-cookie gated, validates category/level/language and catches duplicate-slug conflicts
- [x] Every storefront consumer switched from the static array to the live table: homepage, `/books` (split into a server component + `components/BooksListClient.tsx` since a `'use client'` page can't be async), book detail pages + related books, sitemap, profile wishlist tab
- [x] `/admin/books` — list with search/category/bundle-only filters, create/edit form (all fields including authors/tags as line/comma-separated text), delete with inline confirm. Bundles use the same form via the "Bundle Set" checkbox — no separate bundle UI needed.
- [x] `lib/books.ts` deliberately left in place (types + `categoryMeta` still imported everywhere) with its static array and helpers now dead code — not deleted, per the chosen migration approach

---

## Phase 1 — Customer-facing (make it real for buyers)

> Goal: a customer can browse, pay, and receive confirmation. Orders land in a real database.
> Supabase ✓ · Customer accounts ✓ · Order-lifecycle notifications ✓ (code-complete, blocked on Resend domain) · Razorpay — remaining blocker.

### Payments (main remaining work)
- [ ] Razorpay API keys — migrating from old website, need keys from Bharani (Key ID + Key Secret); blocked on his GST/PAN account verification
- [ ] API route `POST /api/checkout/create-order` — creates Razorpay order, returns ID to frontend
- [ ] Razorpay payment modal wired into checkout page (replacing the current mock UI)
- [ ] API route `POST /api/checkout/verify` — verifies signature, only *then* writes order to Supabase and fires the order-placed notification (today's mock flow saves the order regardless of payment outcome — that has to change)
- [ ] Handle payment failures/cancellations gracefully on frontend, no duplicate orders on retry
- See `razorpay-integration-user-stories.md` for the full breakdown (3 stories + open questions)

### Book content
- [ ] Final copy for descriptions, table of contents, author bios
- [ ] Book detail pages — richer layout with TOC, edition/ISBN, sample pages (currently description-only)
- [ ] Prerender book detail pages — add `generateStaticParams()` to `app/books/[slug]`; currently server-rendered per request (the catalog is now a live Supabase table, not a static array, so this would need a fetch inside `generateStaticParams()` too)

### Founder timeline
- [ ] Real photos and refined content (mobile scroll fix already done, PR #4)

### Notifications — remaining before this is fully live end-to-end
- [ ] **Re-verify `sangitshreeprakashan.com` on Resend** — currently shows unverified, so no customer email actually sends despite the code path being correct. Needs whoever owns the domain's DNS (Bharani).
- [ ] WhatsApp sends are still skipped — needs `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_TOKEN` (Meta Cloud API business verification, 2–4 weeks)
- [ ] Fix: `app/checkout/page.tsx` never checks whether `POST /api/orders/create` actually succeeded before showing the confirmation screen — a server error currently still looks like success to the customer
- [ ] Open question flagged in the story doc but intentionally not built: an OTP step on delivery confirmation ("need to confirm" per the original spec) — needs a product decision first

---

## Security & maintenance

> Not tied to a phase.

- [ ] **Patch the Next.js CVE** — `npm audit` flags information exposure in the dev server due to missing origin verification (currently on 14.2.21), plus high-severity issues in `ws` and `glob`. Patch within the 14.2.x line — do **not** jump to Next.js 15, which changes the `params` API this codebase relies on.
- [x] ~~Rotate or remove the hardcoded admin password~~ — done. `ADMIN_PASSWORD` is now a server-only env var, never committed; the old `ssp@admin` value documented in `CLAUDE.md`/`HANDOVER.md` is stale and no longer the real password.
- [x] ~~Lock down `orders`/`order_items` RLS~~ — done (see Security hardening above).
- [ ] **Tighten `notification_rules`/`notification_logs` RLS** — both still fully permissive to the anon key (`for all to anon using (true) with check (true)`). Lower urgency than `orders` was (no customer PII beyond what's already in the templates), but still worth scoping once admin has real per-person auth.

---

## Phase 2 — Admin (make it fully operational)

> Goal: admin can manage catalog, see real orders, send real notifications, log in securely.
> Depends on: Phase 1 complete.

### Accounts to create first
- [ ] Meta Business account + WhatsApp Cloud API — start immediately, verification takes 2–4 weeks
- [ ] MSG91 or Twilio Verify — for real OTP (replaces both the customer phone-login mock and the admin users-page mock)

### Auth
- [x] Admin login is no longer a client-side-only localStorage flag — it's a real password check server-side plus a signed httpOnly session cookie. Still a single shared password though, not per-person accounts.
- [ ] NextAuth.js with Google OAuth — replace the shared-password admin login with real per-person accounts
- [ ] Role-based access — staff sees orders only, admin sees everything

### Catalog management
- [x] ~~Edit existing book / create new book from admin panel / create and edit bundles / migrate to Supabase `books` table~~ — done, see Catalog management above and `/admin/books`.
- [ ] Upload book cover to Supabase Storage — today cover images are a manual path field (e.g. `/covers/foo.jpg` into `public/`), not a real upload

### Orders
- [x] ~~Order status change triggers notification email to customer~~ — done, see Order-lifecycle notifications above.
- [ ] Manually create an order from admin (for phone/walk-in orders)

### Notifications
- [x] ~~Real email via Resend — wire existing templates to actual sends~~ — wired; blocked on the Resend domain re-verification, not on code.
- [ ] Real OTP via MSG91 or Twilio — replace mock in both the customer phone-login flow and the admin users page
- [ ] Real WhatsApp via Meta Cloud API — code already calls it, just needs credentials
- [x] ~~Notification logs — history of what was sent, to whom, and status~~ — done, `notification_logs` table + admin UI.
- [x] ~~Notification rules stored in Supabase (not localStorage)~~ — done; the old `notifications-store.ts` Zustand store is no longer actually read from for rules.

### Users
- [ ] Real Google OAuth replaces the simulated sign-in flow
- [ ] Admin users stored in Supabase (not localStorage)
