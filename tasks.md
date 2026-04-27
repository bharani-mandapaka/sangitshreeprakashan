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
- [x] Admin panel with password gate and sidebar nav
- [x] Admin dashboard — metrics, 7-day chart, top books, recent orders
- [x] Admin orders — expandable rows, status update, CSV export (prototype)
- [x] Admin notifications — NL input, email + WhatsApp templates, live preview (prototype)
- [x] Admin users — form + OTP mock, Google sign-in mock, role management
- [x] Notifications user-aware NLP — "me", "all users", "staff", "admins" auto-populate
- [x] User picker dropdown in notification recipients
- [x] CLAUDE.md and tasks.md
- [x] GitHub repo + Vercel deployment

---

## Phase 1 — Customer-facing (make it real for buyers)

> Goal: a customer can browse, pay, and receive confirmation. Orders land in a real database.
> Critical path: Supabase → Razorpay → confirmation email.

### Accounts to create first (do these in parallel, they have approval delays)
- [ ] Razorpay business account — needs GST or PAN, takes 1–3 days to verify
- [ ] Resend account — instant, just an API key
- [ ] Supabase project — instant

### Book content
- [ ] Real book cover images for all titles
- [ ] Final copy for descriptions, table of contents, author bios
- [ ] Book detail pages — richer layout with full description, TOC, edition/ISBN, sample pages

### Database
- [ ] Set up Supabase project and schema (books, orders, order_items)
- [ ] Migrate books from lib/books.ts static array to Supabase
- [ ] Replace orders-store (localStorage) with Supabase reads/writes
- [ ] Replace cart-store with Supabase or keep localStorage (TBD)

### Payments
- [ ] Razorpay — API route to create order (`/api/checkout/create-order`)
- [ ] Razorpay — payment modal on checkout page
- [ ] Razorpay — server-side verification + write order to Supabase (`/api/checkout/verify`)
- [ ] Handle payment failures gracefully on frontend

### Post-purchase
- [ ] Order confirmation email to customer via Resend
- [ ] Order confirmation WhatsApp message to admin (via existing notification rule)

### SEO
- [ ] Meta tags and OG images on all pages
- [ ] Sitemap.xml for Google indexing
- [ ] Founder timeline — real photos, refined content, mobile scroll fix

---

## Phase 2 — Admin (make it fully operational)

> Goal: admin can manage catalog, see real orders, send real notifications, log in securely.
> Depends on: Phase 1 Supabase being live.

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

### Orders
- [ ] Admin orders page reads from Supabase (not seed data) — real transactions appear here
- [ ] Order status change triggers notification to customer
- [ ] Manually create an order from admin (for phone/walk-in orders)

### Notifications
- [ ] Real email via Resend — wire existing templates to actual sends
- [ ] Real OTP via MSG91 or Twilio — replace mock in users page
- [ ] Real WhatsApp via Meta Cloud API — wire existing templates to actual sends
- [ ] Notification logs — history of what was sent, to whom, and status

### Users
- [ ] Real Google OAuth replaces the simulated sign-in flow
- [ ] Admin users stored in Supabase (not localStorage)
