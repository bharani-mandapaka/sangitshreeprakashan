# Tasks — Sangit Shree Prakashan

## Done
- [x] Project setup — Next.js 14, Tailwind, Framer Motion, Zustand
- [x] Book catalog with category filter and search
- [x] Shopping cart with localStorage persist
- [x] Checkout page with order summary and payment flow
- [x] Homepage with gallery slideshow (object-contain, no crop)
- [x] About page with auto-scrolling founder timeline
- [x] Contact page
- [x] Replace all emojis — Devanagari letters for categories, Lucide icons for timeline
- [x] BookCard — persistent View + Add to Cart buttons always visible
- [x] Admin panel with password gate and sidebar nav
- [x] Admin dashboard — metrics, 7-day revenue chart, top books, recent orders
- [x] Admin orders — expandable rows, status update, CSV export
- [x] Admin notifications — natural language input, email + WhatsApp templates, live preview
- [x] Admin users — form with OTP phone verification, Google sign-in mock, role management
- [x] Notifications user-aware NLP — "me", "all users", "staff", "admins" auto-populate recipients
- [x] User picker dropdown in notification recipients
- [x] GitHub repo + Vercel deployment

---

## Roadmap

### Product
- [ ] Individual book detail pages — richer layout, full description, table of contents, sample pages
- [ ] Founder timeline — refine content, add real photos, improve scroll behaviour on mobile

### Admin — Catalog
- [ ] Edit existing book details (title, price, description, cover image, stock status)
- [ ] Create new books from the admin panel
- [ ] Create and edit bundles (select books, set bundle price, manage bundle cover)

### Admin — Orders
- [ ] Wire orders to actual checkout — every real order placed on the site appears here
- [ ] Order status updates trigger a notification (email/WhatsApp) to customer
- [ ] Manually create an order from admin (for phone/walk-in orders)

### Admin — Notifications
- [ ] Real email sending via SendGrid or Nodemailer
- [ ] Real WhatsApp messages via Meta Cloud API or Twilio
- [ ] Real OTP delivery via MSG91 or Twilio (replace mock)
- [ ] Notification logs — history of what was sent, when, to whom

### Auth & Data
- [ ] Real Google OAuth via NextAuth.js
- [ ] Replace localStorage stores with a real database (Supabase or Firebase)
- [ ] Role-based access — staff can only see orders, not users or settings

### Payments
- [ ] Razorpay integration on checkout
- [ ] Payment confirmation webhook updates order status automatically
- [ ] PDF invoice generated and emailed on successful payment
