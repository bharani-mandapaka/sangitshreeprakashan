# Sangit Shree Prakashan — Shreeyaanshi Handover

> **Who this is for:** Shreeyaanshi — joining as the primary developer.
> **Prepared by:** Bharani Mandapaka (founder + product lead).
> **Date:** April 2026
> **Your timeline:** 2 weeks to understand everything → 1 week to strategise with Bharani → then you begin building.

---

## Table of Contents

1. [What This Project Is](#1-what-this-project-is)
2. [The Big Picture — Vision, Built, Pending](#2-the-big-picture--vision-built-pending)
3. [Architecture Diagram](#3-architecture-diagram)
4. [Tech Stack — Plain English](#4-tech-stack--plain-english)
5. [Repository & Local Setup](#5-repository--local-setup)
6. [Codebase Map — Every File Explained](#6-codebase-map--every-file-explained)
7. [What is Real vs Prototype Right Now](#7-what-is-real-vs-prototype-right-now)
8. [Services, Credentials & Accounts](#8-services-credentials--accounts)
9. [How to Work with Claude Code](#9-how-to-work-with-claude-code)
10. [Phase 1 — Remaining Work (Customer-Facing)](#10-phase-1--remaining-work-customer-facing)
11. [Phase 2 — Admin & Operations](#11-phase-2--admin--operations)
12. [Analytics Strategy](#12-analytics-strategy)
13. [Business & Growth Strategy](#13-business--growth-strategy)
14. [Technical Strategy — What to Build in What Order](#14-technical-strategy--what-to-build-in-what-order)
15. [Code Patterns — Always Follow These](#15-code-patterns--always-follow-these)
16. [Known Gotchas & Watch-Outs](#16-known-gotchas--watch-outs)
17. [Git Workflow — Branching, PRs & Deployment](#17-git-workflow--branching-prs--deployment)
18. [How to Deploy](#18-how-to-deploy)
19. [Glossary for Non-JS Developers](#19-glossary-for-non-js-developers)

---

## 1. What This Project Is

**Sangit Shree Prakashan** is a Kanpur-based publisher of Hindustani classical music books. The business has been running for decades. This website is their digital storefront and operations hub.

**Two audiences, two experiences:**

| Audience | What they see | Goal |
|----------|---------------|------|
| Customer (public) | Homepage, catalog, book detail, cart, checkout | Browse and buy books online |
| Admin (internal) | `/admin` — dashboard, orders, notifications, users | Manage the business |

**Business context:**
- Books cover raag theory, vocal, instrumental, kathak, CBSE music, research
- Customers are students, teachers, music academics — conservative, trust-driven audience
- Brand is **traditional and classical** — never modern, playful, or trendy
- Brand colours: deep black (`#040000`) + gold (`#C9A84C`) + cream (`#F5ECD7`)
- Primary font: Cinzel (Roman serif that evokes classical heritage)

**Why this matters:** Every UI decision, every word of copy, every animation should feel like it belongs in a music library — not a startup SaaS.

---

## 2. The Big Picture — Vision, Built, Pending

### The Full Vision (what Bharani wants when complete)

```
CUSTOMER JOURNEY
  Browse catalog → View book detail → Add to cart → Checkout → Pay (Razorpay)
  → Order confirmation email → Order arrives at door

ADMIN OPERATIONS
  See all orders → Update status → Customer gets notified (email + WhatsApp)
  → Analytics dashboard with real data → Manage book catalog from UI
  → Secure login (not a hardcoded password)

NOTIFICATIONS ENGINE
  Any trigger (new order / daily digest / weekly digest / cart abandoned)
  → Sends email via Resend + WhatsApp via Meta Cloud API
  → Full delivery log in admin

ANALYTICS
  Real-time: orders, revenue, top books, customer locations
  Trends: weekly/monthly, repeat customers, cart abandonment rate
  External: Google Analytics 4 for traffic; Resend for email opens
```

### What Is Built Today

```
✅ DONE
  Public site:     Homepage, catalog, book detail, cart, checkout UI
  Admin panel:     Dashboard, orders, notifications UI, users UI
  Database:        Supabase — orders + order_items tables live
  Email:           Resend confirmed working, domain verified
  Notifications:   Full engine built — rules in Supabase, email send, logs, test button
  Deployment:      Vercel + GitHub (auto-deploy on git push)
  Cron jobs:       Daily + weekly digest routes registered in vercel.json
  SEO:             Meta + OG tags on every page, per-book metadata, /sitemap.xml

⚠️  PROTOTYPE (UI exists, not wired to real service)
  Payments:        Checkout UI works but no real Razorpay — orders saved as COD
  WhatsApp:        Notification templates built, Meta API not configured yet
  Admin auth:      Password "ssp@admin" stored in localStorage — not secure
  OTP:             Mock — code shown on screen instead of sent via SMS
  Analytics:       Client-side localStorage only — no server-side tracking
  Book images:     Placeholder covers — no real photos

❌ NOT STARTED
  Razorpay payment integration
  Real book cover images
  SEO extras — generated OG images + JSON-LD structured data (base SEO is done)
  Admin catalog management (edit/create books from UI)
  Migrate books from hardcoded file to Supabase database
  Google Analytics 4 integration
  NextAuth.js (secure admin login)
  Supabase Row-Level Security tightening
```

---

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        VERCEL (hosting)                             │
│                                                                     │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐ │
│  │     PUBLIC SITE              │  │     ADMIN PANEL              │ │
│  │     (Next.js — App Router)   │  │     /admin/*                 │ │
│  │                              │  │                              │ │
│  │  /           Homepage        │  │  /admin        Dashboard     │ │
│  │  /books      Catalog         │  │  /admin/orders Orders        │ │
│  │  /books/:slug Book detail    │  │  /admin/notif  Notifications │ │
│  │  /about      About           │  │  /admin/users  Users         │ │
│  │  /contact    Contact         │  │                              │ │
│  │  /checkout   Checkout        │  │  Auth: localStorage (TEMP)   │ │
│  │                              │  │  → NextAuth.js (PLANNED)     │ │
│  └──────────┬───────────────────┘  └──────────────────────────────┘ │
│             │                                                        │
│  ┌──────────▼───────────────────────────────────────────────────┐   │
│  │               API ROUTES  (/api/*)                           │   │
│  │                                                              │   │
│  │  POST /api/orders/create        ← checkout submits here      │   │
│  │  POST /api/notifications/test   ← admin test button          │   │
│  │  GET  /api/cron/daily-digest    ← Vercel cron, 2 AM UTC      │   │
│  │  GET  /api/cron/weekly-digest   ← Vercel cron, Monday 2 AM   │   │
│  │                                                              │   │
│  │  PLANNED:                                                    │   │
│  │  POST /api/checkout/create-order  ← Razorpay order           │   │
│  │  POST /api/checkout/verify        ← Razorpay verification    │   │
│  └──────────┬───────────────────────────────────────────────────┘   │
│             │                                                        │
└─────────────┼───────────────────────────────────────────────────────┘
              │
    ┌─────────┼──────────────────────────────────────────┐
    │         │           EXTERNAL SERVICES              │
    │         │                                          │
    │  ┌──────▼──────┐  ┌──────────┐  ┌──────────────┐  │
    │  │  SUPABASE   │  │  RESEND  │  │   RAZORPAY   │  │
    │  │  (Database) │  │  (Email) │  │  (Payments)  │  │
    │  │             │  │          │  │              │  │
    │  │  orders     │  │  Order   │  │  ✅ Account  │  │
    │  │  order_items│  │  confirm │  │  ❌ Not wired │  │
    │  │  notif_rules│  │  Admin   │  │  yet         │  │
    │  │  notif_logs │  │  notifs  │  └──────────────┘  │
    │  │             │  │          │                     │
    │  │  PLANNED:   │  │  ✅ Live  │  ┌──────────────┐  │
    │  │  books table│  └──────────┘  │  META (WA)   │  │
    │  │  admin_users│               │  (WhatsApp)  │  │
    │  │  ✅ Live     │               │  ⚠️ Not config │  │
    │  └─────────────┘               └──────────────┘  │
    │                                                   │
    │  CLIENT-SIDE STATE (Zustand → localStorage)       │
    │  ssp-cart · ssp-orders · ssp-analytics            │
    │  ssp-notifications · ssp-users                    │
    │  (analytics + users → migrate to Supabase)        │
    └───────────────────────────────────────────────────┘
```

### Data Flow — What Happens When a Customer Orders

```
Customer fills checkout form
        │
        ▼
POST /api/orders/create
        │
        ├──► INSERT into Supabase (orders + order_items)
        │
        ├──► Resend sends confirmation email to customer
        │
        └──► fireNotifications('order_placed', vars)
                    │
                    ├──► Fetch active rules from Supabase
                    ├──► Interpolate {{placeholders}} with order data
                    ├──► Resend emails to admin recipients
                    ├──► WhatsApp to admin phones (if Meta configured)
                    └──► Log results to notification_logs
```

---

## 4. Tech Stack — Plain English

You know Python. Here's how this maps across:

| Python world | This project | What it does |
|---|---|---|
| Flask/FastAPI | Next.js (App Router) | Web framework — handles routes and pages |
| Jinja2 templates | React + TSX | UI templates that run in the browser |
| `.py` files | `.ts` / `.tsx` files | TypeScript = typed Python, `.tsx` = TypeScript + HTML-like syntax |
| `pip install` | `npm install` | Package manager |
| `python app.py` | `npm run dev` | Start local server |
| `requirements.txt` | `package.json` | Dependency list |
| SQLAlchemy / raw SQL | Supabase JS client | Database queries |
| Environment variables (`.env`) | `.env.local` | Same concept, different filename |
| `if __name__ == '__main__'` | N/A | Next.js handles this |

### The parts you'll touch most

**React components (`.tsx` files):** These are UI building blocks. Think of them like Python functions that return HTML. They can hold state (like variables that trigger re-renders when changed).

```tsx
// Python-style thinking:
# def BookCard(book):
#     return f"<div>{book.title} — ₹{book.price}</div>"

// What it actually looks like in this codebase:
export default function BookCard({ book }: { book: Book }) {
  return (
    <div className="bg-dark border border-gold/20 rounded-xl p-4">
      <h3 className="text-cream font-cinzel">{book.titleEnglish}</h3>
      <p className="text-gold">₹{book.price}</p>
    </div>
  );
}
```

**Next.js App Router:** Files in `app/` become pages automatically. `app/books/page.tsx` → `/books`. `app/api/orders/create/route.ts` → `POST /api/orders/create`. No routing config needed.

**Supabase:** A hosted Postgres database with a JavaScript SDK. You query it like this:
```ts
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('status', 'pending');
```
Equivalent Python: `cursor.execute("SELECT * FROM orders WHERE status = 'pending'")`

**Tailwind CSS:** Utility-first CSS. Instead of writing separate CSS files, you add class names directly to elements. `text-gold` = `color: #C9A84C`. `px-4` = `padding-left: 1rem; padding-right: 1rem`. You'll get used to it quickly.

**TypeScript:** JavaScript with types. Like Python type hints but enforced at build time. If something expects a `string` and you pass a `number`, the build fails. Claude Code handles most of the TypeScript complexity for you.

---

## 5. Repository & Local Setup

### Links

| What | URL |
|------|-----|
| **GitHub repo** | https://github.com/bharani-mandapaka/sangitshreeprakashan |
| **Live site** | https://sangit-shree-prakashan.vercel.app |
| **Vercel dashboard** | https://vercel.com (log in with Bharani's invite) |
| **Supabase dashboard** | https://supabase.com/dashboard/project/kypqmrfgxeybqzkawogb |
| **Resend dashboard** | https://resend.com/emails |

### Admin panel login (current — temporary)
| Field | Value |
|-------|-------|
| URL | https://sangit-shree-prakashan.vercel.app/admin |
| Password | `ssp@admin` |
| Note | This is stored in localStorage. Will be replaced with secure Google login in Phase 2. |

### Step 1: Get access from Bharani
Before you can do anything, Bharani needs to share:
- [ ] GitHub collaborator invite → go to https://github.com/bharani-mandapaka/sangitshreeprakashan and accept
- [ ] `.env.local` file contents — contains all API keys and secrets (never commit this file to git)
- [ ] Supabase project access — Bharani invites you via the Supabase dashboard
- [ ] Resend dashboard access — Bharani invites you via resend.com → Team settings
- [ ] Vercel project access — Bharani invites you via vercel.com → Team settings

### Step 2: Install prerequisites
```bash
# 1. Install Node.js (version 18 or 20) — nodejs.org/en/download
# 2. Install VS Code — code.visualstudio.com
# 3. Install Git — git-scm.com (if not already installed)
# 4. Install Claude Code:
npm install -g @anthropic-ai/claude-code
```

### Step 3: Configure Git identity (one-time)
```bash
git config --global user.name "Shreeyaanshi"
git config --global user.email "your@email.com"
```

### Step 4: Clone and run
```bash
git clone https://github.com/bharani-mandapaka/sangitshreeprakashan.git
cd sangitshreeprakashan

# Paste the .env.local file Bharani sends you into the project root
# It should contain NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, RESEND_API_KEY etc.
# Never commit this file — it's already in .gitignore

npm install        # install all dependencies (takes ~1 min first time)
npm run dev        # start local server
```

Open `http://localhost:3000` in your browser — the site should load.

### Step 5: Verify everything works
- `http://localhost:3000` → homepage loads with gold/dark theme
- `http://localhost:3000/books` → book catalog loads
- `http://localhost:3000/admin` → password prompt appears → enter `ssp@admin`
- Admin dashboard → shows real order data from Supabase (not zeros)

If the dashboard shows zeros or errors, the `.env.local` file is missing or has wrong values — check with Bharani.

### Step 6: Start Claude Code
```bash
# Inside the project folder:
claude
```
Claude Code automatically reads `CLAUDE.md` every session — that's your project brief. Always keep `CLAUDE.md` and `tasks.md` updated as things get built.

---

## 6. Codebase Map — Every File Explained

### `app/` — Pages and API routes

```
app/
├── layout.tsx              Root layout — loads fonts, wraps all pages in SiteShell
├── page.tsx                Homepage — hero, gallery slideshow, featured books, testimonials
├── about/page.tsx          About page — founder timeline with auto-scroll animation
├── contact/page.tsx        Contact page — address, phone, email
├── books/
│   ├── page.tsx            Book catalog — grid with category filter + search
│   └── [slug]/page.tsx     Individual book detail page (server component)
├── checkout/page.tsx       Checkout form + order summary
│
├── admin/
│   ├── layout.tsx          Admin shell — password gate + sidebar navigation
│   ├── page.tsx            Admin dashboard — KPIs, 7-day chart, top books
│   ├── orders/page.tsx     Order management — table, expandable rows, status updates
│   ├── notifications/page.tsx  Notification rules + logs (full engine built)
│   └── users/page.tsx      Admin users — mock OTP, mock Google OAuth
│
└── api/
    ├── orders/create/route.ts      POST — saves order to Supabase + fires emails
    ├── notifications/test/route.ts POST — fires a rule with dummy data for testing
    └── cron/
        ├── daily-digest/route.ts   GET — runs daily, fires daily_digest notifications
        └── weekly-digest/route.ts  GET — runs Monday, fires weekly_digest notifications
```

### `components/` — Reusable UI pieces

```
components/
├── SiteShell.tsx       Wraps public pages only — hides public nav on /admin routes
├── Navbar.tsx          Public navigation bar (top, with cart icon)
├── Footer.tsx          Public footer
├── BookCard.tsx        Individual book tile — cover + title + price + buttons
├── BookCover.tsx       Book cover image with 3D tilt animation
├── BookDetailClient.tsx Full book detail page UI (client component)
├── CartDrawer.tsx      Slide-in cart sidebar
├── GallerySlideshow.tsx Auto-scrolling image gallery on homepage
├── HeroScroll.tsx      Parallax hero section on homepage
├── TimelineScroll.tsx  Animated founder timeline on about page
└── WhatsAppButton.tsx  Floating WhatsApp contact button (bottom right)
```

### `lib/` — Logic and state

```
lib/
├── books.ts                Static array of all books — to be migrated to Supabase later
├── supabase.ts             Supabase client + TypeScript interfaces for DB tables
├── notifications-sender.ts Server-side engine — fires email + WhatsApp notifications
├── cart-store.ts           Zustand store for cart (persisted to localStorage)
├── orders-store.ts         Zustand store for local order log (source of truth = Supabase)
├── analytics-store.ts      Zustand store for visit/click tracking (localStorage only)
├── notifications-store.ts  Helper types and NLP parser for notification rules
├── users-store.ts          Zustand store for admin users (3 seed users)
└── utils.ts                Shared utilities (classnames helper, formatters)
```

### Config files

```
README.md           Repo front door — stack, quick start, structure, docs index
CLAUDE.md           Project brief for Claude Code — read this first, keep it updated
tasks.md            Living task list — check off done items, add new ones
GIT_GUIDE.md        The mandatory git workflow — branch, build, commit, PR
HANDOVER.md         This file
vercel.json         Vercel cron job schedule (daily/weekly digest)
tailwind.config.ts  Design tokens (gold, dark, cream colours + font variables)
tsconfig.json       TypeScript config
package.json        Dependencies and scripts
.env.example        Template listing every required env var — commit this one
.env.local          Secrets — NEVER commit to git (it's in .gitignore)
```

---

## 7. What is Real vs Prototype Right Now

| Feature | Status | What to do |
|---------|--------|-----------|
| Book catalog UI | ✅ Real | Nothing — works |
| Book detail pages | ✅ Real | Add real images and richer copy |
| Cart | ✅ Real | Nothing |
| Orders saved to DB | ✅ Real | Nothing |
| Order email to customer | ✅ Real | Fix DNS/deliverability (see §8) |
| Admin dashboard | ✅ Real | Add GA4 data |
| Admin orders | ✅ Real | Add manual order creation |
| Notification rules (DB) | ✅ Real | Nothing |
| Email notifications to admin | ✅ Real | Fix deliverability |
| WhatsApp notifications | ⚠️ Built, not configured | Add Meta env vars |
| Notification logs | ✅ Real | Nothing |
| Payments | ❌ Mock | Razorpay integration (Phase 1 blocker) |
| Admin auth | ❌ Mock | NextAuth.js (Phase 2) |
| OTP | ❌ Mock | MSG91 / Twilio (Phase 2) |
| Analytics (client) | ⚠️ localStorage only | Migrate to Supabase + add GA4 |
| Book images | ❌ Placeholders | Real photos |
| Catalog management | ❌ Not built | Phase 2 |
| Admin users in DB | ❌ localStorage | Phase 2 |
| SEO | ✅ Real | Meta tags, OG tags, per-book metadata and `/sitemap.xml` all shipped (PRs #2, #3) |

---

## 8. Services, Credentials & Accounts

**Ask Bharani for access to all of these before you start. Actual API keys and passwords will be shared by Bharani directly — never store them in a public place or commit them to git.**

### Active services — login details

| Service | What it does | Login URL | How to get access |
|---------|-------------|-----------|-------------------|
| **GitHub** | Source code + version control | https://github.com/bharani-mandapaka/sangitshreeprakashan | Bharani sends a collaborator invite to your GitHub account |
| **Vercel** | Hosting, deployments, cron jobs | https://vercel.com | Bharani invites your email via Vercel → Team settings |
| **Supabase** | Database (Postgres) | https://supabase.com/dashboard/project/kypqmrfgxeybqzkawogb | Bharani invites your email via Supabase → Project settings |
| **Resend** | Sending emails | https://resend.com | Bharani invites your email via Resend → Team settings |

### Admin panel login (current — temporary)

| | |
|--|--|
| **URL (production)** | https://sangit-shree-prakashan.vercel.app/admin |
| **URL (local dev)** | http://localhost:3000/admin |
| **Password** | `ssp@admin` |
| **Note** | Stored in localStorage — temporary. Will be replaced with secure Google login in Phase 2. |

### Services needing setup (ask Bharani for status)

| Service | What it's for | Priority | Notes |
|---------|--------------|----------|-------|
| **Razorpay** | Payment processing | 🔴 Phase 1 blocker | Needs GST or PAN, 1–3 day verification |
| **Meta Business / WhatsApp Cloud API** | WhatsApp notifications | 🟡 Phase 2 | Takes 2–4 weeks to verify — start early |
| **MSG91 or Twilio** | OTP for admin login | 🟡 Phase 2 | Can use either |
| **Google Analytics 4** | Website traffic analytics | 🟡 Phase 2 | Free, setup in 30 min |

### Environment variables (`.env.local`)

This file lives in the project root on your local machine. Bharani will share its full contents. It is **never committed to git** — `.gitignore` already excludes it.

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://kypqmrfgxeybqzkawogb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Bharani will share>

# Email
RESEND_API_KEY=<Bharani will share>

# Cron security (authenticates the scheduled digest jobs)
CRON_SECRET=<Bharani will share>

# Payments — add once Razorpay account is approved
RAZORPAY_KEY_ID=<pending>
RAZORPAY_KEY_SECRET=<pending>

# WhatsApp — add once Meta Cloud API is approved
WHATSAPP_PHONE_NUMBER_ID=<pending>
WHATSAPP_TOKEN=<pending>
```

**Important:** Vercel (production) holds its own separate copy of these variables. When a new variable is added, it must be added in two places: `.env.local` (for your local dev) AND Vercel (for production). To add to Vercel:
```bash
npx vercel env add VARIABLE_NAME
# paste the value when prompted
# select: production, preview, and development
```

### Email deliverability fix (do this early)
The domain `sangitshreeprakashan.com` is verified in Resend but Gmail may still filter emails to spam. To fix:
1. Go to resend.com/domains → click `sangitshreeprakashan.com`
2. All DNS records (SPF, DKIM, DMARC) should show green ✅
3. If any are unverified, copy the record values from Resend and add them at the domain registrar (wherever the domain was purchased — ask Bharani)
4. Once all green, Gmail deliverability fixes within minutes

---

## 9. How to Work with Claude Code

**Claude Code is your primary development tool.** Think of it as a senior engineer sitting next to you — you describe what you want, it writes the code, you review, test, and ship.

### Starting a session

```bash
cd "path/to/sangit-shree-prakashan"
claude
```

Claude Code automatically reads `CLAUDE.md` every session. That's why keeping it up to date matters — it's how Claude knows the project context without you re-explaining it every time.

### How to ask Claude Code to build things

**Be specific about what you want, not how to build it.** Claude knows the how.

❌ Too vague: "Add payments"
✅ Good: "Integrate Razorpay into the checkout page. When the user clicks 'Place Order', create a Razorpay order via POST /api/checkout/create-order, open the Razorpay payment modal, and on success call POST /api/checkout/verify to save the order to Supabase."

❌ Too vague: "Fix the analytics"
✅ Good: "Replace the localStorage analytics in lib/analytics-store.ts with Supabase tracking. Create a page_views table in Supabase and write a visit on every page load. Show the real visit count on the admin dashboard."

### Giving Claude Code context

When starting a new task, tell it:
1. **What file or feature** you're working on
2. **What the current behaviour is** (if changing something)
3. **What you want it to do instead**
4. **Any constraints** (e.g., "don't change the design", "keep the same API structure")

### Reviewing Claude's work

Claude Code will show you diffs (what changed) before applying. Always:
1. Read the diff — don't just approve everything blindly
2. Run `npm run build` after changes to catch TypeScript errors before pushing
3. Test in the browser at `localhost:3000`
4. If something looks wrong, tell Claude exactly what's wrong — it will fix it

### When Claude Code gets stuck

- Ask it to "explain what it's doing" — forces it to think out loud
- Ask it to "read the file first before changing it"
- If a bug is mysterious, ask it to "add console.log statements and tell me what to look for in the browser console"
- For database issues, check the Supabase dashboard → Table Editor directly

### Tasks that Claude Code handles very well

- Adding new pages or UI components
- Wiring a new API (Razorpay, etc.) — just paste the API docs into the chat
- Database migrations (new Supabase tables, columns)
- Debugging specific errors (paste the error message)
- SEO tags, sitemap generation
- Refactoring/cleaning up code

### Tasks that need your judgment first

- Design decisions (how should this look, what's the flow)
- Business logic (what should happen when X)
- What to prioritise
- Whether something is "done enough" to ship

---

## 10. Phase 1 — Remaining Work (Customer-Facing)

**Goal:** A customer can browse → pay → receive confirmation.
**Blocker:** Razorpay account approval.

### P1.1 — Razorpay Payment Integration 🔴 (main blocker)

**What it is:** India's most common payment gateway. Handles cards, UPI, net banking.

**Steps:**
1. Bharani to create/verify Razorpay business account (needs GST or PAN)
2. Get `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from Razorpay dashboard
3. Add to `.env.local` and Vercel env vars

**What to build (tell Claude Code this):**
```
Build Razorpay integration:
1. Create POST /api/checkout/create-order — takes cart items + customer info, 
   creates a Razorpay order via their API, returns { orderId, amount, currency }
2. In checkout/page.tsx: after form submit, call create-order, then open Razorpay 
   payment modal using their JS SDK
3. On payment success callback: call POST /api/checkout/verify — verifies the 
   payment signature using RAZORPAY_KEY_SECRET, saves order to Supabase, 
   fires email + notification
4. On payment failure: show error message, allow retry
Razorpay docs: https://razorpay.com/docs/payments/server-integration/nodejs/
```

### P1.2 — Real Book Cover Images 🟡

All covers are placeholders. Need actual high-res photos of each book cover.

**Steps:**
1. Photograph all books (front cover, good lighting, white/neutral background)
2. Upload to Supabase Storage (there's a Storage section in the Supabase dashboard)
3. Update `lib/books.ts` — add `coverUrl` field pointing to Supabase Storage URL
4. Update `BookCover.tsx` component to use real images

### P1.3 — SEO 🟢 mostly done

Shipped in PRs #2 and #3:
- `generateMetadata()` on every page, including per-book titles and descriptions
- OG and Twitter tags site-wide
- `app/sitemap.ts` — `/sitemap.xml` covering all static pages + all 39 book URLs

⚠️ Gotcha worth knowing: a nested layout that sets `title` as a plain string kills the root
layout's title template for all of its children. This silently stripped the brand suffix from
every book detail page. Use the `{ default, template }` form in nested layouts — see the
**Title template** note in `CLAUDE.md`.

**Still outstanding — tell Claude Code:**
```
1. Generate OG images for book detail pages using Next.js ImageResponse
2. Add JSON-LD structured data to book detail pages (Book schema)
3. Add generateStaticParams() to app/books/[slug] so the 39 book pages prerender
   instead of server-rendering on every request
```

### P1.4 — Book Detail Pages — Richer Content 🟢

Currently: title, price, description, add to cart.
Should have: table of contents, edition/year, author bio, sample pages, related books.

Coordinate with Bharani on content before building.

---

## 11. Phase 2 — Admin & Operations

**Goal:** Admin can manage the business entirely through the panel.
**Dependency:** Phase 1 should be mostly complete first.

### P2.1 — Razorpay already covered in Phase 1

### P2.2 — Catalog Management (books in Supabase) 🟡

Currently, all books are in `lib/books.ts` (a hardcoded TypeScript file). To add or edit a book, someone has to edit code and redeploy. This needs to move to the database.

**Steps:**
1. Create `books` table in Supabase (schema is already designed in CLAUDE.md)
2. Write a one-time migration script: reads `lib/books.ts`, inserts all books into Supabase
3. Update all pages that currently import from `lib/books.ts` to fetch from Supabase instead
4. Build admin UI: `/admin/catalog` page with list → edit book → save to Supabase
5. Add create new book + upload cover image to Supabase Storage

**Tell Claude Code:**
```
Migrate books from lib/books.ts to Supabase:
1. Create books table in Supabase with fields: id, slug, title_english, title_hindi, 
   authors (text[]), price, category, level, language, description, tags (text[]), 
   series, part, is_bundle, cover_url, in_stock
2. Create a migration script (scripts/migrate-books.ts) that reads lib/books.ts 
   and inserts all books using the Supabase admin client
3. Replace all imports of books from lib/books.ts in app/ with Supabase queries
4. Add /admin/catalog page with: list of books, edit button per book (slide-out panel), 
   save changes to Supabase
Keep the same design language as the rest of admin (dark background, gold accents, Cinzel font).
```

### P2.3 — Secure Admin Authentication 🟡

Currently, admin auth is a hardcoded password stored in localStorage. This is not production-safe.

**Replace with:** NextAuth.js + Google OAuth

**Tell Claude Code:**
```
Replace the localStorage admin auth with NextAuth.js:
1. Install next-auth@5 (beta, App Router compatible)
2. Configure Google OAuth provider
3. Protect all /admin/* routes — redirect to /admin/login if not authenticated
4. Add sign-out button to the admin sidebar
5. Keep the same admin layout and design — just swap the auth mechanism
Bharani will provide the Google OAuth client ID and secret.
```

### P2.4 — WhatsApp Notifications 🟡

The notification engine is already built and working. It just needs Meta Cloud API credentials.

Once Bharani has:
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_TOKEN`

Add them to `.env.local` and Vercel env vars. The WhatsApp sends will start working automatically — no code changes needed.

Note: Meta Business verification takes 2–4 weeks. Start the account creation immediately.

### P2.5 — Order Management Improvements 🟢

- When admin changes order status (e.g. "processing" → "shipped"), automatically email the customer
- Ability to manually create an order from admin (for phone/walk-in orders)

**Tell Claude Code:**
```
When an order status is updated in /admin/orders:
1. Detect the new status
2. If status is 'processing', 'shipped', or 'delivered': fire a customer notification email
3. Build the email template in lib/notifications-sender.ts
4. Add a "Create Order" button to the orders page with a manual order form
```

### P2.6 — Admin Users in Database 🟢

Currently the 3 admin users are hardcoded in `lib/users-store.ts` (Zustand/localStorage). Need to:
1. Create `admin_users` table in Supabase
2. Seed the 3 existing users
3. Wire the Users page to Supabase
4. Eventually tie to NextAuth (P2.3)

---

## 12. Analytics Strategy

### Current State
- Client-side only: page visits and cart adds tracked in localStorage
- Admin dashboard reads from this — data is per-device, not real aggregate data
- Supabase orders give real revenue/order data but no traffic data

### What to Build

#### Layer 1 — Fix what's already there (Quick wins)
**Server-side order analytics in Supabase:**
The `orders` and `order_items` tables are live. The admin dashboard just needs better queries.

Tell Claude Code:
```
Improve the admin dashboard queries:
1. Total revenue this month vs last month (with % change)
2. Orders by status breakdown
3. Top 5 books by revenue (from order_items, grouped by book_id)
4. Orders by city (from address_city column)
5. Average order value
All from Supabase, not localStorage.
```

#### Layer 2 — Google Analytics 4 (Website traffic)
Free and standard. Gives: page views, sessions, traffic sources, devices, locations.

**Setup:**
1. Create GA4 property at analytics.google.com
2. Get the Measurement ID (G-XXXXXXXX)
3. Tell Claude Code: "Add Google Analytics 4 to the Next.js site. Measurement ID is G-XXXXXXXX. Track page views on every navigation using the App Router."

**What it gives you:** Where do customers come from? What pages do they visit? How long do they stay? What device?

#### Layer 3 — Supabase analytics events table (Product analytics)
For tracking: which books are viewed, which are added to cart, which lead to orders, cart abandonment.

**Tell Claude Code:**
```
Create an analytics_events table in Supabase:
  id, event_type (varchar), book_id (nullable), session_id, created_at
  
Track these events server-side:
  - book_viewed: when /books/[slug] is loaded
  - book_added_to_cart: when add to cart is clicked
  - checkout_started: when checkout page is loaded
  - order_placed: when /api/orders/create succeeds

Add an analytics section to the admin dashboard showing:
  - Top viewed books (last 7 days)
  - Cart conversion rate per book (adds vs views)
  - Funnel: views → cart adds → orders
```

#### Layer 4 — Resend analytics (Email performance)
Resend dashboard at resend.com/emails shows: sent, opened, clicked, bounced per email.
No code needed — just check the dashboard.

#### Analytics Dashboard Vision (Admin)

```
Admin Dashboard should show:
┌──────────────────────────────────────────┐
│  TODAY   │  THIS WEEK  │  THIS MONTH     │
│  Orders  │  Revenue    │  New customers  │
│  ₹X,XXX  │  ₹XX,XXX    │  XX            │
├──────────────────────────────────────────┤
│  REVENUE CHART  (7-day / 30-day toggle) │
├──────────────────────────────────────────┤
│  TOP BOOKS         │  TRAFFIC SOURCES   │
│  1. Raag Parichay  │  Direct: 45%       │
│  2. Swar Vadan     │  Google: 30%       │
│  3. Tabla Guide    │  Instagram: 25%    │
├──────────────────────────────────────────┤
│  SALES FUNNEL                           │
│  Views → Cart adds → Orders             │
│  1,200  →  340     →  89  (7.4% conv)  │
└──────────────────────────────────────────┘
```

---

## 13. Business & Growth Strategy

### Where the customers are
Hindustani classical music students, teachers, and academics. They congregate in:
- **WhatsApp groups** — music student groups, teacher groups (most important channel)
- **YouTube** — classical music teachers have students who search for book recommendations
- **Instagram** — younger music students
- **Guruji networks** — music teachers recommend books to students (word of mouth is huge)

### Content strategy

**What to create:**
1. **YouTube Shorts / Reels** — "What is Raag Bhoopali?" — 60 seconds, Devanagari text overlay, classical music background. Link in bio → book.
2. **WhatsApp catalogue** — WhatsApp Business has a product catalogue feature. All books listed there for easy sharing.
3. **Blog / articles** — "How to learn Hindustani music notation" with a CTA to buy the book. This is SEO gold — no one else is writing this in English for this niche.
4. **Student testimonials** — real photos, real quotes (not the placeholder ones in testimonials.md). Use on homepage and book detail pages.

**What not to bother with:**
- Twitter/X — wrong audience
- Facebook Pages — declining, older demographic, low ROI
- Paid ads — premature until organic is working and payment is live

### Pricing strategy
No changes needed until you have actual sales data. Once Razorpay is live, look at:
- Which books are most popular → bundle them
- Cart abandonment rate → consider a discount follow-up email (notification rule already supports this)

### Trust signals to add to the site
The brand is traditional and customers are conservative. These build trust:
1. Real founder photo on About page (the timeline has placeholder content)
2. Real customer testimonials with names and photos (replace placeholder ones)
3. Physical address + phone prominently on every page
4. "Est. [year]" in the brand — classical publishers use this
5. Book ISBNs and editions on book detail pages

---

## 14. Technical Strategy — What to Build in What Order

```
WEEK 1–2 (Your learning phase — don't build yet)
  □ Read all files in the codebase
  □ Run the site locally
  □ Place a test order and see what happens in Supabase + email
  □ Log into admin, explore all pages
  □ Read CLAUDE.md + tasks.md
  □ Ask Bharani any questions

WEEK 3 (Strategise with Bharani)
  □ Review this handover together
  □ Agree on Phase 1 priority sequence
  □ Confirm Razorpay account status
  □ Agree on analytics scope (what metrics matter most to Bharani)
  □ Clarify open questions about book catalog content

SPRINT 1 (Start of your building phase)
  □ Fix email deliverability (DNS records in Resend)
  ☑ SEO foundations (meta tags + sitemap) — done, PRs #2 and #3
  □ Google Analytics 4 wired in
  Priority: these don't need Razorpay and make the site measurably better immediately

SPRINT 2 (Razorpay, assuming account approved)
  □ Razorpay integration — this is the main Phase 1 unlock
  □ Test end-to-end: browse → checkout → pay → email received → order in Supabase

SPRINT 3
  □ Real book images (coordinate with Bharani for photos)
  □ Richer book detail pages (TOC, author bio, sample pages)
  □ Order status → customer email notification

SPRINT 4 (Phase 2 begins)
  □ Migrate books to Supabase + admin catalog management
  □ NextAuth.js secure admin login
  □ Supabase analytics events + improved admin dashboard

ONGOING
  □ WhatsApp (when Meta approves, no code change needed)
  □ Content — blog posts, testimonials, about page photos
```

---

## 15. Code Patterns — Always Follow These

### 1. Design tokens — never hardcode colours
```tsx
// ❌ Wrong
<div className="text-[#C9A84C]">Title</div>

// ✅ Correct
<div className="text-gold">Title</div>
```

Design tokens: `text-gold`, `text-cream`, `bg-dark`, `border-gold/20`, `font-cinzel`, `font-devanagari`

### 2. Server vs Client components
```tsx
// Server component (no 'use client') — can fetch data directly
// app/books/[slug]/page.tsx
export default async function BookPage({ params }: { params: { slug: string } }) {
  const book = getBookBySlug(params.slug); // this runs on server
  return <BookDetailClient book={book} />; // pass data to client component
}

// Client component — can use useState, useEffect, onClick handlers
// components/BookDetailClient.tsx
'use client';
export default function BookDetailClient({ book }: { book: Book }) {
  const [count, setCount] = useState(1);
  // ...
}
```

Rule of thumb: if it needs `useState`, `useEffect`, or event handlers → `'use client'`. Otherwise, keep it a server component.

### 3. Zustand store access
```tsx
// ✅ Always destructure selectors — never use the whole store object
const addItem = useCartStore((s) => s.addItem);
const items = useCartStore((s) => s.items);

// ❌ Never do this
const store = useCartStore(); // causes re-renders on any store change
```

### 4. Next.js 14 params (important gotcha)
```tsx
// ✅ Correct — Next.js 14 (what we're on)
export default function Page({ params }: { params: { slug: string } }) {
  const slug = params.slug; // direct access
}

// ❌ Wrong — this is Next.js 15 only
const { slug } = use(params); // DO NOT use this
```

### 5. Images — always Next.js Image
```tsx
// ✅ Correct
import Image from 'next/image';
<div className="relative h-64 w-full">
  <Image src={book.coverUrl} alt={book.titleEnglish} fill className="object-contain" />
</div>

// ❌ Never use plain <img> tags — Next.js won't optimise them
<img src={book.coverUrl} />
```

### 6. API routes pattern
```ts
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  
  // do stuff
  
  return NextResponse.json({ success: true });
}
```

### 7. Supabase queries
```ts
// Read
const { data, error } = await supabase
  .from('orders')
  .select('*, order_items(*)')  // join order_items
  .eq('status', 'pending')
  .order('created_at', { ascending: false });

// Write
const { error } = await supabase
  .from('orders')
  .insert({ customer_name: 'Test', subtotal: 1000 });

// Update
const { error } = await supabase
  .from('orders')
  .update({ status: 'shipped' })
  .eq('id', orderId);
```

---

## 16. Known Gotchas & Watch-Outs

**1. `notification_logs` vs `notifications_logs`** — the Supabase table is called `notification_logs` (singular). Don't typo it.

**2. Zustand + Next.js hydration** — Zustand persists to localStorage, but on first render the server and client can have different state (server has empty state, client has localStorage state). This causes "hydration mismatch" errors. If you see these, add `suppressHydrationWarning` or use `useEffect` to read localStorage client-side. Ask Claude Code to fix these if they appear.

**3. Never commit `.env.local`** — it's in `.gitignore` but be careful. If you accidentally push secrets to GitHub, rotate the keys immediately in each service's dashboard.

**4. Vercel cron jobs only fire in production** — the daily/weekly digest crons won't run on localhost. Test them manually by calling the route with the `Authorization: Bearer CRON_SECRET` header.

**5. WhatsApp phone numbers** — Meta expects numbers in international format without `+` (e.g., `919876543210` not `+91 9876543210`). The notification sender already strips non-digits — just make sure numbers are entered in the admin UI with country code.

**6. Supabase RLS is currently permissive** — anyone with the anon key can read and write orders. This is fine for now (no sensitive data) but tighten before handling payment data. Don't store anything you wouldn't want public until RLS is locked down.

**7. `npm run build` before pushing** — always run this locally first. Vercel will fail the deployment if TypeScript errors exist. Claude Code usually catches these but double-check.

**8. The admin password is `ssp@admin`** — stored in localStorage key `ssp-admin-auth = "1"`. Don't put this in any public docs or the repo. This will be replaced in Phase 2 with NextAuth.

---

## 17. Git Workflow — Branching, PRs & Deployment

### The Golden Rule

**Never commit directly to `main`.** The `main` branch is connected to Vercel — anything pushed there goes live immediately to real customers. Always work on a feature branch and get it reviewed before merging.

### Branch naming convention

```
feature/short-description      # new features
fix/short-description          # bug fixes
chore/short-description        # maintenance, config, docs

# Examples:
feature/razorpay-integration
feature/book-catalog-admin
fix/email-deliverability
fix/mobile-nav-overlap
chore/update-handover-docs
```

### Day-to-day workflow

```bash
# 1. Always start from an up-to-date main
git checkout main
git pull origin main

# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Work on the feature — test locally with npm run dev

# 4. Before committing, verify the build passes
npm run build   # must show no TypeScript or build errors

# 5. Stage and commit your changes
git add app/the-file-you-changed.tsx
git add lib/another-file.ts
# (be specific — never blindly run git add -A which can accidentally include secrets)

git commit -m "feat: add Razorpay payment integration to checkout"

# 6. Push your branch to GitHub
git push origin feature/your-feature-name

# 7. Open a Pull Request on GitHub
# Go to: https://github.com/bharani-mandapaka/sangitshreeprakashan
# GitHub will show a banner: "Compare & pull request" — click it
# Fill in: what you built, how to test it, any notes for Bharani
# Assign Bharani as reviewer

# 8. Bharani reviews and approves
# After approval: merge the PR on GitHub (squash merge preferred)

# 9. Vercel auto-deploys main within ~2 minutes of merge
```

### Commit message format

Use a short prefix so the history stays readable:

```
feat: add Razorpay checkout integration
fix: prevent site nav appearing on admin pages
chore: update .env.local instructions in HANDOVER.md
docs: add Git workflow section
refactor: move book fetching to server components
```

### Preview deployments (very useful)

When you push a branch or open a PR, Vercel automatically builds and deploys a **preview URL** — a live version of your branch that doesn't affect production. You'll see it in:
- The PR comments on GitHub (Vercel bot posts the URL)
- vercel.com → your project → Deployments tab

**Use this to show Bharani your work before merging.** Share the preview URL in your PR so he can click through and test without you having to walk him through localhost.

### Viewing deployment status

```
vercel.com → sangitshreeprakashan → Deployments
```

Each deployment shows: branch, commit, build status, and live URL. If a deployment fails, click it to see the build log — usually a TypeScript error.

### Syncing with Bharani's changes

If Bharani pushes changes to `main` while you're working on a branch:

```bash
# Bring Bharani's main changes into your branch
git checkout main
git pull origin main
git checkout feature/your-feature-name
git merge main
# resolve any conflicts, then continue working
```

### If something breaks in production

```bash
# Check what's on main
git log origin/main --oneline -10

# Revert the last merge if needed (ask Bharani before doing this)
git revert HEAD --no-edit
git push origin main
```

For anything destructive (reverting, force-pushing, resetting) — **always check with Bharani first.**

### Quick reference

| Action | Command |
|--------|---------|
| See current branch | `git branch` |
| See all branches | `git branch -a` |
| Switch branch | `git checkout branch-name` |
| See what changed | `git status` |
| See exact diff | `git diff` |
| Pull latest | `git pull origin main` |
| Undo last local commit (safe) | `git reset --soft HEAD~1` |

---

## 18. How to Deploy

Deployment is fully automated via GitHub + Vercel. See Section 17 for the full branching workflow.

```bash
# Make your changes, test locally
npm run build   # must pass with no errors

git add <specific files>   # never use git add -A blindly
git commit -m "your message"
git push origin main       # Vercel auto-deploys in ~2 minutes
```

**Check deployment status:** vercel.com/bharani-mandapaka/sangitshreeprakashan

**If deployment fails:** Check Vercel build logs — usually a TypeScript error. Run `npm run build` locally first to catch it before pushing.

**To manually trigger a deploy:**
```bash
npx vercel --prod
```

**Environment variables for new services:** After adding to `.env.local`, also add to Vercel:
```bash
npx vercel env add VARIABLE_NAME
# paste the value when prompted
# select: production, preview, development
```

---

## 19. Glossary for Non-JS Developers

| Term | Plain English |
|------|---------------|
| **Component** | A reusable UI function that returns HTML-like JSX. Like a Python function but for UI. |
| **Props** | Parameters passed to a component. Like function arguments. |
| **State** | Variables inside a component that trigger re-renders when changed. Like instance variables. |
| **Hook** | A function starting with `use` that gives components special abilities (state, effects, context). |
| **`useEffect`** | Code that runs after the component renders — like a post-render callback. |
| **Server component** | A React component that runs on the server only — can fetch data, no browser APIs. |
| **Client component** | A React component that runs in the browser — can use state, events, localStorage. |
| **App Router** | Next.js 14's routing system. Files in `app/` become pages automatically. |
| **API route** | A backend endpoint defined by a file in `app/api/`. Like a Flask route. |
| **Zustand** | A state management library. Like a global dictionary that components can read/write. |
| **Tailwind** | CSS utility classes in HTML. `p-4` = `padding: 1rem`. No separate CSS files. |
| **TypeScript** | JavaScript with types. `const x: string = "hello"` — like Python type hints but enforced. |
| **Supabase** | Hosted Postgres with a JS SDK. Like SQLAlchemy but cloud-hosted. |
| **RLS** | Row-Level Security — Supabase's per-row access control. Like `WHERE user_id = current_user`. |
| **Vercel** | Hosting platform for Next.js apps. Like Heroku but faster. |
| **npm** | Node package manager. Like `pip` for Python. |
| **`package.json`** | Like `requirements.txt` but also contains scripts. |
| **`.env.local`** | Local environment variables. Like a `.env` file in Python projects. |
| **Cron job** | Scheduled task. Vercel runs the digest routes at set times. Like crontab. |

---

*Last updated: April 2026 — maintained by Bharani Mandapaka.*
*Keep this file up to date as the project evolves. Major milestones, new services added, or Phase completions should be reflected here.*
