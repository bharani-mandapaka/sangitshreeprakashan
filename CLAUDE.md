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
| Book catalog UI | Real — 34 books across 7 categories |
| Book detail pages | Real — server component passes book to `BookDetailClient` |
| Cart + checkout UI | Real |
| Payments | Mock — no Razorpay yet |
| Orders saved to DB | Real — `POST /api/orders/create` writes to Supabase on checkout |
| Order confirmation email | Real — Resend sends from `orders@sangitshreeprakashan.com` |
| Admin dashboard | Real — reads orders from Supabase |
| Admin orders page | Real — reads from Supabase, status updates write back |
| Admin analytics | localStorage — visits/clicks tracked client-side via analytics-store |
| OTP verification | Mock — code shown on screen |
| WhatsApp notifications | UI only — no Meta/Twilio API |
| Google OAuth | Simulated UI — no real token |
| Book images | Placeholders |
| Admin auth | localStorage password gate (`ssp@admin`) |
| SEO metadata | Real — generateMetadata() on all public pages |
| Sitemap | Real — auto-generated at /sitemap.xml for all pages + 34 books |

---

## Environment variables
Stored in `.env.local` locally and in Vercel project settings (set via `npx vercel env add`).
```
NEXT_PUBLIC_SUPABASE_URL=https://kypqmrfgxeybqzkawogb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
RESEND_API_KEY=<resend key>
```

---

## Admin panel
- URL: `/admin`
- Password: `ssp@admin`
- Auth stored in localStorage: `ssp-admin-auth = "1"`
- Sidebar pages: Dashboard, Orders, Notifications, Users

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
```
RLS is permissive (anon can insert + select + update) — to be tightened in Phase 2 with auth.

## API routes (live)
- `POST /api/orders/create` — inserts order + items to Supabase, sends Resend confirmation email

## Book catalog
All books are a static array in `lib/books.ts`. Total: 34 books across 7 categories.

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
| Database | Supabase (Postgres) | Live — orders + order_items tables exist |
| Transactional email | Resend | Live — domain `sangitshreeprakashan.com` verified |
| Payments | Razorpay | Not started — needs GST/PAN account verification |
| SEO | Next.js generateMetadata + sitemap | Done — PR feature/seo-metadata pending merge |

### API routes to build
- `POST /api/checkout/create-order` — creates Razorpay order, returns order ID to frontend
- `POST /api/checkout/verify` — verifies Razorpay payment signature, writes order to Supabase

### Remaining Phase 1 work
- Razorpay account approval + payment integration (blocked on Bharani)
- Real book cover images (blocked on Bharani)
- Founder timeline — real photos, refined content, mobile scroll fix

---

## Phase 2 — Making admin fully functional

**Goal:** Admin can manage the catalog, see real orders, send real notifications, and log in securely.

**Depends on:** Phase 1 complete.

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
books              (id, slug, title_english, title_hindi, authors, price, category, level, language, description, tags, series, part, is_bundle, cover_url, in_stock)
```