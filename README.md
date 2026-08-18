# Sangit Shree Prakashan

E-commerce site for a Hindustani Classical Music book publisher based in Kanpur, Uttar Pradesh.
Sells books on raag, vocal, instrumental, kathak, music theory, CBSE music, and bundles.

- **Live site:** https://sangit-shree-prakashan.vercel.app
- **Repository:** https://github.com/bharani-mandapaka/sangitshreeprakashan

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS with custom design tokens |
| Animation | Framer Motion |
| Client state | Zustand v4 + `persist` middleware (localStorage) |
| Database | Supabase (Postgres) |
| Transactional email | Resend |
| Icons | Lucide React |
| Hosting | Vercel |

---

## Quick start

Requires Node.js 18 or 20.

```bash
git clone https://github.com/bharani-mandapaka/sangitshreeprakashan.git
cd sangitshreeprakashan
npm install
```

Create a `.env.local` in the project root. See [`.env.example`](.env.example) for the full list
of required variables — ask Bharani for the actual values.

```bash
npm run dev      # http://localhost:3000
```

### Commands

```bash
npm run dev         # local dev server
npm run build       # production build — must pass before every commit
npx vercel --prod   # deploy to Vercel
```

---

## Project structure

```
app/
  page.tsx              Homepage
  about/                About page + founder timeline
  books/
    page.tsx            Catalog listing — search, filters, sort
    [slug]/page.tsx     Book detail (server component → BookDetailClient)
    layout.tsx          Catalog metadata + title template
  checkout/             Cart checkout flow
  contact/              Contact page
  admin/                Password-gated admin panel (layout wraps all /admin/*)
  api/
    orders/create       Writes order to Supabase, sends Resend confirmation
    notifications/test  Notification rule test send
    cron/               Daily and weekly digest jobs
  sitemap.ts            Auto-generates /sitemap.xml

components/             BookCard, BookDetailClient, Navbar, Footer, CartDrawer, …
lib/                    books.ts (catalog) + Zustand stores
supabase/schema.sql     Database schema
```

---

## Book catalog

All 39 books live in a static array in [`lib/books.ts`](lib/books.ts), across 7 categories:
`instrumental`, `vocal`, `raag-theory`, `kathak`, `research`, `cbse`, `bundle`.

Migrating the catalog to a Supabase `books` table is Phase 2 work — see [tasks.md](tasks.md).

---

## Design tokens

| Token | Value | Usage |
|---|---|---|
| gold | `#C9A84C` | Brand accent, CTAs, borders |
| dark | `#040000` | Page background |
| cream | `#F5ECD7` | Body text |
| Cinzel | `font-cinzel` | All headings and UI labels |

The brand is traditional and classical — not modern or playful.

---

## Contributing

**Never commit directly to `master`.** Every change goes through a feature branch and a Pull
Request. The full workflow is in [GIT_GUIDE.md](GIT_GUIDE.md) — read it before your first change.

```bash
git checkout master && git pull origin master
git checkout -b feature/short-description
# ... make changes ...
npm run build                    # must pass
git add path/to/file.tsx         # by name — never `git add .`
git commit -m "feat: what you did"
git push origin feature/short-description
# then open a PR on GitHub
```

---

## Documentation

| Document | What it covers |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Project brief, architecture, conventions, current prototype-vs-real status |
| [HANDOVER.md](HANDOVER.md) | Full onboarding walkthrough — setup, codebase map, services, credentials |
| [GIT_GUIDE.md](GIT_GUIDE.md) | Mandatory git workflow, step by step |
| [tasks.md](tasks.md) | Roadmap — what's done, Phase 1, Phase 2 |
| [.env.example](.env.example) | Required environment variables |

---

## Current status

Customers can browse the catalog, add to cart, and check out. Orders are written to Supabase and
a confirmation email is sent via Resend.

**Payments are still mocked** — Razorpay integration is the remaining Phase 1 blocker. Admin
authentication is a temporary localStorage password gate and is not real security; NextAuth.js
replaces it in Phase 2. See [tasks.md](tasks.md) for the full breakdown.
