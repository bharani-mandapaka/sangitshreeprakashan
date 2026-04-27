# Sangit Shree Prakashan — Project Brief

## What this is
E-commerce site for a classical Indian music book publisher based in Kanpur, UP. Sells books on raag, vocal, instrumental, kathak, music theory, CBSE music, and bundles. Brand is traditional, classical — not modern or playful.

## Stack
- Next.js 14 App Router, TypeScript
- Tailwind CSS with custom design tokens
- Framer Motion for animations
- Zustand v4 + persist middleware (localStorage) for all state — no backend yet
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

## Admin panel
- URL: `/admin`
- Password: `ssp@admin`
- Auth key in localStorage: `ssp-admin-auth = "1"`
- Sidebar pages: Dashboard, Orders, Notifications, Users

## Data stores (`lib/`)
All stores use Zustand + `persist` to localStorage. No real backend yet — all data is mock/seed.

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

## What is NOT real yet
- Payments (Razorpay not wired)
- OTP (mock — shows code on screen)
- WhatsApp notifications (UI only, no Meta/Twilio API)
- Email sending (templates exist, no SMTP)
- Google OAuth (simulated multi-step UI, no real token)
- Database (everything is localStorage)
- Book images beyond placeholders
