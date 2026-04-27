# Sangit Shree Prakashan — Project Brief

## What this is
E-commerce site for a classical Indian music book publisher based in Kanpur, UP. Sells books on raag, vocal, instrumental, kathak, music theory, CBSE music, and bundles. Brand is traditional, classical — not modern or playful.

## Stack
- Next.js 14 App Router, TypeScript
- Tailwind CSS with custom design tokens
- Framer Motion for animations
- Zustand v4 + persist middleware (localStorage) for all state — no real backend yet
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
| Book catalog UI | Real |
| Cart + checkout UI | Real |
| Payments | Mock — no Razorpay yet |
| Orders | Mock — localStorage only, not from real transactions |
| OTP verification | Mock — code shown on screen |
| WhatsApp notifications | UI only — no Meta/Twilio API |
| Email sending | Templates exist — no SMTP/SendGrid |
| Google OAuth | Simulated UI — no real token |
| Database | None — everything is localStorage |
| Book images | Placeholders |
| Admin auth | localStorage password gate (`ssp@admin`) |

---

## Admin panel
- URL: `/admin`
- Password: `ssp@admin`
- Auth stored in localStorage: `ssp-admin-auth = "1"`
- Sidebar pages: Dashboard, Orders, Notifications, Users

## Data stores (`lib/`)
All stores use Zustand + `persist` to localStorage. Each will be replaced with Supabase calls in Phase 1/2.

| File | localStorage key | What it holds |
|------|-----------------|---------------|
| `cart-store.ts` | `ssp-cart` | Cart items |
| `orders-store.ts` | `ssp-orders` | Orders (8 seed orders) |
| `analytics-store.ts` | `ssp-analytics` | Visit/click/cart tracking |
| `notifications-store.ts` | `ssp-notifications` | Notification rules |
| `users-store.ts` | `ssp-users` | Admin users (3 seed users) |

## Book catalog
All books are a static array in `lib/books.ts`. Each book has: `id`, `slug`, `title`, `author`, `price`, `mrp`, `category`, `description`, `pages`, `edition`, `isbn`, `coverImage`, `inStock`.

Categories: `instrumental` (व), `vocal` (ग), `raag-theory` (र), `kathak` (क), `research` (श), `cbse` (प), `bundle` (सं). Icons are single Devanagari characters styled with `font-devanagari text-gold`.

## Key component patterns
- **BookCard** — persistent View + Add to Cart buttons below cover image
- **Admin layout** (`app/admin/layout.tsx`) — password gate + sidebar, wraps all `/admin/*` pages
- **Zustand selectors** — always destructure what you need: `const { addOrder } = useOrdersStore()`
- **No `<img>` tags** — use Next.js `<Image>` with `fill` + `object-contain` for book covers

## Seed users (users-store)
| Name | Email | Role |
|------|-------|------|
| Bharani Mandapaka | meetbharani91@gmail.com | admin |
| Rohit Kumar | rohit.kumar@sangitshreeprakashan.com | staff |
| Priya Sharma | priya.sharma@gmail.com | viewer |

---

## Phase 1 — Making it real for customers

**Goal:** A customer can browse, pay, and receive confirmation. Orders appear in the database.

**Critical path:** Supabase setup → Razorpay integration → order confirmation email.
Everything else in Phase 1 is parallel to this chain.

### Services to integrate
| What | Service | Notes |
|------|---------|-------|
| Database | Supabase (Postgres) | Also handles file storage for book covers |
| Payments | Razorpay | Needs GST/PAN — start account verification early |
| Transactional email | Resend | Simplest to set up, generous free tier |

### API routes to build
- `POST /api/checkout/create-order` — creates Razorpay order, returns order ID to frontend
- `POST /api/checkout/verify` — verifies Razorpay payment signature, writes order to Supabase
- `POST /api/email/send` — sends confirmation email via Resend

### Supabase schema (Phase 1)
```sql
books        (id, slug, title, author, price, mrp, category, description, pages, edition, isbn, cover_url, in_stock)
orders       (id, created_at, razorpay_order_id, razorpay_payment_id, status, customer_name, customer_email, customer_phone, shipping_address, subtotal, payment_method)
order_items  (id, order_id, book_id, title, qty, price)
```

---

## Phase 2 — Making admin fully functional

**Goal:** Admin can manage the catalog, see real orders, send real notifications, and log in securely.

**Depends on:** Phase 1 Supabase being live (orders + books tables already exist).

### Services to integrate
| What | Service | Notes |
|------|---------|-------|
| Auth | NextAuth.js + Google | Replace localStorage password gate |
| OTP | MSG91 or Twilio Verify | Replace mock OTP in users page |
| WhatsApp | Meta Cloud API | Start verification early — approval takes 2–4 weeks |

### Additional Supabase tables (Phase 2)
```sql
admin_users        (id, name, email, phone, role, auth_provider, created_at)
notification_rules (id, name, trigger, channel, recipients, subject, body, whatsapp_numbers, whatsapp_message, active, created_at)
notification_logs  (id, rule_id, sent_at, channel, recipients, status)
```
