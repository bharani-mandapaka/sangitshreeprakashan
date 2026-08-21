# Tasks — Sangit Shree Prakashan

## Done
- [x] Project setup — Next.js 14, Tailwind, Framer Motion, Zustand
- [x] Book catalog with category filter and search
- [x] Shopping cart with localStorage persist
- [x] Checkout page with order summary and payment flow (UI only)
- [x] Homepage with gallery slideshow
- [x] About page with auto-scrolling founder timeline
- [x] Contact page
- [x] Replace all emojis — Devanagari letters for categories, Lucide icons for timeline
- [x] BookCard — persistent View + Add to Cart buttons always visible
- [x] Book detail pages — server component + BookDetailClient, 3D cover animation, specs, related books
- [x] Admin panel with password gate and sidebar nav
- [x] Admin dashboard — metrics, 7-day chart, top books, recent orders (reads from Supabase)
- [x] Admin orders — expandable rows, status update, CSV export (reads from Supabase)
- [x] Admin notifications — NL input, email + WhatsApp templates, live preview (prototype)
- [x] Admin users — form + OTP mock, Google sign-in mock, role management
- [x] Notifications user-aware NLP — "me", "all users", "staff", "admins" auto-populate
- [x] User picker dropdown in notification recipients
- [x] Supabase project + schema (orders, order_items tables, RLS policies)
- [x] `POST /api/orders/create` — saves order to Supabase, sends Resend email on checkout
- [x] Resend domain verified — sending from `orders@sangitshreeprakashan.com`
- [x] Vercel env vars wired (SUPABASE_URL, SUPABASE_ANON_KEY, RESEND_API_KEY)
- [x] CLAUDE.md and tasks.md
- [x] GitHub repo + Vercel deployment

---

## Phase 1 — Customer-facing (make it real for buyers)

> Goal: a customer can browse, pay, and receive confirmation. Orders land in a real database.
> Supabase ✓ · Resend ✓ · Razorpay — remaining blocker.

### Payments (main remaining work)
- [ ] Razorpay API keys — migrating from old website, need keys from Bharani (Key ID + Key Secret)
- [ ] API route `POST /api/checkout/create-order` — creates Razorpay order, returns ID to frontend
- [ ] Razorpay payment modal wired into checkout page
- [ ] API route `POST /api/checkout/verify` — verifies signature, writes order to Supabase
- [ ] Handle payment failures gracefully on frontend

### Book content
- [x] Add missing books to catalog (Swar Vadan Part 1, Raag Shastra Parichay Part 3, Concepts of Vocal Music Class 9–12, Concepts of Instrumental Music Class 9–12, Sangit Saar Class 11, Bal Sangit Parts 1–3, Treasure of Raags & Taals)
- [x] Fixed duplicate catalog entries (sv-1, rsp-3 were listed twice) — 36 unique books, down from 38 array entries
- [x] Real book cover images for all 36 books (30 from the print catalogue PDF, 6 bundle/individual covers supplied directly)
- [x] Verified all book/bundle prices against the print catalogue
- [ ] Final copy for descriptions, table of contents, author bios
- [ ] Book detail pages — richer layout with TOC, edition/ISBN, sample pages (currently description-only)

### SEO
- [x] Meta tags and OG images on all pages — PR #2 `feature/seo-metadata`, merged; SEO metadata on all public pages and per-book detail pages
- [x] Sitemap.xml for Google indexing — auto-generates for all pages and 36 book URLs
- [x] Fix `/books` 404 — PR #2 overwrote the catalog listing page with book-detail code; restored in PR #3 `fix/books-listing-page`
- [x] Restore brand suffix on book detail titles — `app/books/layout.tsx` used a plain-string `title`, which nulled the root layout's title template for all 36 book pages
- [x] Founder timeline — mobile scroll fix done (PR #4); real photos and refined content still blocked on Bharani
- [ ] Prerender book detail pages — add `generateStaticParams()` to `app/books/[slug]`; currently server-rendered per request despite the catalog being a static array

---

## Security & maintenance

> Not tied to a phase. The dependency patch is the only item here with a live impact today.

- [ ] **Patch the critical Next.js CVE** — `npm audit` flags information exposure in the Next.js
      dev server due to missing origin verification (currently on 14.2.21). Also high-severity
      issues in `ws` (uninitialized memory disclosure, DoS) and `glob` (command injection via
      `-c/--cmd`). Prefer a patch bump within the 14.2.x line — do **not** jump to Next.js 15,
      which changes the `params` API this codebase relies on.
- [ ] **Rotate or remove the hardcoded admin password** — `ssp@admin` is committed in `CLAUDE.md`
      and `HANDOVER.md`, and the GitHub repo is public, so it is publicly readable. It only guards
      a localStorage gate today, so nothing is genuinely protected either way — but it should not
      survive into the NextAuth.js work below.
- [ ] **Tighten Supabase RLS** — policies are currently permissive: anon can insert, select and
      update on all four tables (`orders`, `order_items`, `notification_rules`,
      `notification_logs`). Depends on real auth landing first.

---

## Phase 2 — Admin (make it fully operational)

> Goal: admin can manage catalog, see real orders, send real notifications, log in securely.
> Depends on: Phase 1 complete.

### Accounts to create first
- [ ] Meta Business account + WhatsApp Cloud API — start immediately, verification takes 2–4 weeks
- [ ] MSG91 or Twilio Verify — for real OTP

### Auth
- [ ] NextAuth.js with Google OAuth — replace localStorage password gate
- [ ] Role-based access — staff sees orders only, admin sees everything

### Catalog management
- [ ] Edit existing book — title, price, description, cover image, stock status
- [ ] Create new book from admin panel
- [ ] Upload book cover to Supabase Storage
- [ ] Create and edit bundles — select books, set bundle price and cover
- [ ] Migrate books from `lib/books.ts` static array to Supabase `books` table

### Orders
- [ ] Order status change triggers notification email to customer
- [ ] Manually create an order from admin (for phone/walk-in orders)

### Notifications
- [ ] Real email via Resend — wire existing templates to actual sends
- [ ] Real OTP via MSG91 or Twilio — replace mock in users page
- [ ] Real WhatsApp via Meta Cloud API — wire existing templates to actual sends
- [ ] Notification logs — history of what was sent, to whom, and status
- [ ] Notification rules stored in Supabase (not localStorage)

### Users
- [ ] Real Google OAuth replaces the simulated sign-in flow
- [ ] Admin users stored in Supabase (not localStorage)
