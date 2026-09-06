-- ============================================================
-- Sangit Shree Prakashan — Phase 1 Schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- ── Orders ────────────────────────────────────────────────────────────────────
create table if not exists orders (
  id               text primary key,
  created_at       timestamptz not null default now(),
  status           text not null default 'confirmed'
                     check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  customer_name    text not null,
  customer_email   text not null,
  customer_phone   text not null,
  address_line1    text,
  address_city     text,
  address_state    text,
  address_pincode  text,
  subtotal         numeric(10,2) not null,
  payment_method   text not null
);

-- ── Order Items ───────────────────────────────────────────────────────────────
create table if not exists order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      text not null references orders(id) on delete cascade,
  book_id       text,
  sku           text,
  title_english text not null,
  title_hindi   text,
  qty           integer not null check (qty > 0),
  price         numeric(10,2) not null
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists orders_created_at_idx on orders(created_at desc);
create index if not exists order_items_order_id_idx on order_items(order_id);

-- ── Orders: link to authenticated customer account ──────────────────────────────
-- Nullable — guest checkout (no account) is still fully supported. Set from the
-- client's Supabase Auth session at checkout time when the customer is signed in.
alter table orders add column if not exists user_id uuid references auth.users(id);
create index if not exists orders_user_id_idx on orders(user_id);

-- ── Orders: lifecycle notification fields ────────────────────────────────────────
-- shipped_at/delivered_at double as both display data (the "date & time" shown to
-- the customer) and the dedup guard for order-lifecycle notifications — a
-- notification only fires the first time its *_at column moves from null to set,
-- so re-saving an order that's already shipped/delivered never re-sends.
alter table orders add column if not exists tracking_id            text;
alter table orders add column if not exists courier_service        text;
alter table orders add column if not exists shipped_at             timestamptz;
alter table orders add column if not exists delivered_at           timestamptz;
alter table orders add column if not exists expected_delivery_date timestamptz;

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Orders/order_items used to have permissive policies for every operation
-- (using (true) / with check (true)) so the anon-key client — used directly
-- by checkout and the admin panel — could read and write freely. That was a
-- real hole on two fronts, both fixed 2026-08-30:
--
-- 1. SELECT: the anon key ships in the public JS bundle, so anyone could pull
--    it out and read every customer's name, email, phone, and address
--    straight out of Supabase with no login at all.
-- 2. INSERT/UPDATE: an open `with check (true)` on insert meant anyone could
--    POST straight to Supabase's PostgREST API with the public anon key and
--    forge orders (bypassing app/api/orders/create/route.ts's own userId
--    verification entirely). An open `update using (true)` with no `with
--    check` was worse — it let anyone rewrite ANY column of ANY order,
--    including reassigning user_id to themselves and then reading that order
--    back through the SELECT policy below.
--
-- The fix: every write now goes through a server route using the
-- service-role key (which bypasses RLS) instead of the anon-key client —
-- app/api/orders/create/route.ts for inserts, app/api/admin/orders/route.ts
-- (PATCH, gated behind the signed admin session cookie — see
-- lib/admin-auth.ts) for status updates. So RLS on these two tables only
-- needs to cover SELECT now; insert/update have no policies at all, meaning
-- the anon key can't write to either table under any circumstance.
alter table orders      enable row level security;
alter table order_items enable row level security;

drop policy if exists "insert_orders"      on orders;
drop policy if exists "insert_order_items" on order_items;
drop policy if exists "update_orders"      on orders;

-- Signed-in customers can read only their own orders. Guest orders (user_id is
-- null) aren't readable through this policy by anyone — guests have no account
-- to view order history from in the first place, so this matches existing
-- behavior. order_items has no user_id of its own, so it joins back to orders.
drop policy if exists "read_orders" on orders;
drop policy if exists "read_order_items" on order_items;
create policy "read_orders" on orders for select using (auth.uid() = user_id);
create policy "read_order_items" on order_items for select using (
  exists (
    select 1 from orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);

-- ── Wishlist ──────────────────────────────────────────────────────────────────
-- book_id references the static lib/books.ts catalog (no `books` table yet — see
-- Phase 2 in CLAUDE.md), so it's a plain text id, not a foreign key.
create table if not exists wishlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  book_id    text not null,
  created_at timestamptz not null default now(),
  unique (user_id, book_id)
);

create index if not exists wishlist_user_id_idx on wishlist(user_id);

alter table wishlist enable row level security;

-- Unlike orders, wishlist is net-new with no admin dependency, so it's scoped
-- properly to the owning user from day one.
drop policy if exists "select_own_wishlist" on wishlist;
drop policy if exists "insert_own_wishlist" on wishlist;
drop policy if exists "delete_own_wishlist" on wishlist;
create policy "select_own_wishlist" on wishlist for select using (auth.uid() = user_id);
create policy "insert_own_wishlist" on wishlist for insert with check (auth.uid() = user_id);
create policy "delete_own_wishlist" on wishlist for delete using (auth.uid() = user_id);

-- ── Phone OTPs ────────────────────────────────────────────────────────────────
-- Mock phone-verification codes for sign-up/login. The code is generated and
-- checked entirely server-side via the service-role client — no public RLS
-- policies exist on this table, so the anon key can't read or write it at all.
-- Swapping the mock (code returned in the API response, shown on screen) for a
-- real SMS provider later only touches app/api/auth/phone/send-otp/route.ts —
-- this table and the verify flow don't change.
create table if not exists phone_otps (
  id         uuid primary key default gen_random_uuid(),
  phone      text not null,
  otp        text not null,
  expires_at timestamptz not null,
  attempts   integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists phone_otps_phone_idx on phone_otps(phone);

alter table phone_otps enable row level security;
-- Intentionally no policies — service role only.

-- ── Notification Rules ────────────────────────────────────────────────────────
create table if not exists notification_rules (
  id               text primary key,
  name             text not null,
  description      text not null default '',
  trigger          text not null check (trigger in ('order_placed','daily_digest','weekly_digest','cart_abandoned')),
  channel          text not null check (channel in ('email','whatsapp','both')),
  recipients       text[] not null default '{}',
  subject          text not null default '',
  body             text not null default '',
  whatsapp_numbers text[] not null default '{}',
  whatsapp_message text not null default '',
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

-- Which HTML wrapper an email uses (see lib/notifications-sender.ts). Rules
-- created by hand in /admin/notifications are staff-facing ("Dear Admin...")
-- and default to 'admin', which keeps the existing internal-alert styling.
-- The three order-lifecycle rules seeded below are the only 'customer' ones —
-- without this flag, customers were getting emails branded "ADMIN
-- NOTIFICATION" under the logo, since both used the same wrapper.
alter table notification_rules add column if not exists audience text not null default 'admin';
alter table notification_rules drop constraint if exists notification_rules_audience_check;
alter table notification_rules add constraint notification_rules_audience_check
  check (audience in ('admin','customer'));

-- Widen the trigger enum for order-lifecycle notifications beyond order_placed.
-- Postgres auto-names an inline check constraint "<table>_<column>_check", so
-- that's what gets dropped and recreated here.
alter table notification_rules drop constraint if exists notification_rules_trigger_check;
alter table notification_rules add constraint notification_rules_trigger_check
  check (trigger in ('order_placed','order_shipped','order_delivered','daily_digest','weekly_digest','cart_abandoned'));

-- Default customer-facing rules for the three order-lifecycle moments. Unlike
-- the admin-facing rules an admin creates by hand in /admin/notifications,
-- these target the customer directly via the dynamic {{customer_email}} /
-- {{customer_phone}} placeholders, which fireNotifications() already resolves
-- per-order (see lib/notifications-sender.ts). Seeded here so the feature
-- works out of the box; admins can edit or deactivate them like any other
-- rule. `on conflict do nothing` makes this safe to re-run — it won't clobber
-- any edits an admin has since made.
insert into notification_rules (id, name, description, trigger, channel, recipients, subject, body, whatsapp_numbers, whatsapp_message, active, audience)
values (
  'order-placed-customer',
  'Order Confirmation (Customer)',
  'Sent to the customer the moment their order is placed.',
  'order_placed',
  'both',
  array['{{customer_email}}'],
  'Your Order is Confirmed — {{order_id}} | Sangit Shree Prakashan',
  E'Dear {{customer_name}},\n\nThank you for choosing Sangit Shree Prakashan. We are delighted to confirm that your order has been received and is being prepared with care.\n\nOrder ID    : {{order_id}}\nPlaced on   : {{order_date}}\n\nYour Order\n----------\n{{items_list}}\n\nOrder Total : {{order_total}}\n\nDelivering To\n-------------\n{{shipping_address}}\n\nWe expect your order to reach you by {{expected_delivery_date}}. You will hear from us again as soon as it ships.\n\nThank you for supporting the tradition of classical Indian music.\n\nWarm regards,\nSangit Shree Prakashan',
  array['{{customer_phone}}'],
  E'*Thank you for your order!* 🙏\nSangit Shree Prakashan\n\n*Order ID:* {{order_id}}\n*Total:* {{order_total}}\n\n*Your Order:*\n{{items_list}}\n\nExpected delivery: *{{expected_delivery_date}}*\n\nWe''ll let you know as soon as it ships.',
  true,
  'customer'
)
on conflict (id) do nothing;

insert into notification_rules (id, name, description, trigger, channel, recipients, subject, body, whatsapp_numbers, whatsapp_message, active, audience)
values (
  'order-shipped-customer',
  'Order Shipped (Customer)',
  'Sent to the customer when their order is marked shipped.',
  'order_shipped',
  'both',
  array['{{customer_email}}'],
  'Your Order is on Its Way — {{order_id}} | Sangit Shree Prakashan',
  E'Dear {{customer_name}},\n\nGood news — your order has been dispatched and is now on its way to you.\n\nOrder ID     : {{order_id}}\nTracking ID  : {{tracking_id}}\nCourier      : {{courier_service}}\n\nWe will write to you again once it has been delivered.\n\nThank you for your patience, and for supporting Sangit Shree Prakashan.\n\nWarm regards,\nSangit Shree Prakashan',
  array['{{customer_phone}}'],
  E'*Your order is on its way!* 📦\n\n*Order ID:* {{order_id}}\n*Tracking ID:* {{tracking_id}}\n*Courier:* {{courier_service}}\n\nWe''ll let you know once it''s delivered.',
  true,
  'customer'
)
on conflict (id) do nothing;

insert into notification_rules (id, name, description, trigger, channel, recipients, subject, body, whatsapp_numbers, whatsapp_message, active, audience)
values (
  'order-delivered-customer',
  'Order Delivered (Customer)',
  'Sent to the customer when their order is marked delivered.',
  'order_delivered',
  'both',
  array['{{customer_email}}'],
  'Your Order Has Arrived — {{order_id}} | Sangit Shree Prakashan',
  E'Dear {{customer_name}},\n\nWe''re happy to let you know that your order was delivered on {{delivered_at}}.\n\nDelivered\n---------\n{{items_list}}\n\nIf you have any questions or need assistance, please reach us at {{support_email}} or {{support_phone}} — we''re always happy to help.\n\nThank you for choosing Sangit Shree Prakashan. We hope these books serve you well in your musical journey.\n\nWarm regards,\nSangit Shree Prakashan',
  array['{{customer_phone}}'],
  E'*Your order has been delivered!* ✅\n\nDelivered on {{delivered_at}}.\n\nNeed help? Write to us at {{support_email}} or call {{support_phone}}.\n\nThank you for shopping with Sangit Shree Prakashan!',
  true,
  'customer'
)
on conflict (id) do nothing;

-- ── Notification Logs ─────────────────────────────────────────────────────────
create table if not exists notification_logs (
  id         uuid primary key default gen_random_uuid(),
  rule_id    text,
  rule_name  text,
  trigger    text,
  channel    text,
  recipients text[],
  status     text not null,   -- 'sent' | 'failed' | 'partial'
  error      text,
  sent_at    timestamptz not null default now()
);

create index if not exists notif_logs_sent_at_idx on notification_logs(sent_at desc);

alter table notification_rules enable row level security;
alter table notification_logs  enable row level security;

drop policy if exists "anon_all_notification_rules" on notification_rules;
drop policy if exists "anon_all_notification_logs"  on notification_logs;
create policy "anon_all_notification_rules" on notification_rules for all to anon using (true) with check (true);
create policy "anon_all_notification_logs"  on notification_logs  for all to anon using (true) with check (true);

-- ── Books ─────────────────────────────────────────────────────────────────────
-- Migrated from the static lib/books.ts array (36 books) so the admin panel can
-- create/edit books and bundles at runtime -- a hardcoded array baked into the
-- build can't be written to from a running admin session. lib/books.ts itself is
-- left in place but unused once every storefront page reads from this table instead.
create table if not exists books (
  id                text primary key,
  slug              text not null unique,
  title_hindi       text not null,
  title_english     text not null,
  price             numeric(10,2) not null,
  category          text not null check (category in ('instrumental','vocal','raag-theory','kathak','research','cbse','bundle')),
  level             text not null check (level in ('beginner','intermediate','advanced','research','bundle')),
  language          text not null check (language in ('hindi','english','bilingual')),
  authors           text[] not null default '{}',
  description       text not null default '',
  description_hindi text,
  cover_image       text,
  series            text,
  part              integer,
  is_bundle         boolean not null default false,
  is_featured       boolean not null default false,
  in_stock          boolean not null default true,
  tags              text[] not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists books_category_idx on books(category);
create index if not exists books_slug_idx on books(slug);

-- Public catalog data -- readable by anyone, same as the static array was. Writes
-- only ever go through the service-role-backed admin API routes, matching the
-- orders/order_items pattern -- no insert/update/delete policy exists for the anon key.
alter table books enable row level security;
drop policy if exists "read_books" on books;
create policy "read_books" on books for select using (true);

-- One-time seed of all 36 books from lib/books.ts, safe to re-run.
insert into books (id, slug, title_hindi, title_english, price, category, level, language, authors, description, description_hindi, cover_image, series, part, is_bundle, is_featured, in_stock, tags)
values
  ('b-swar-vadan-set', 'swar-vadan-complete-set', 'स्वर वादन भाग (1–5) - सम्पूर्ण सेट', 'Swar Vadan Parts 1–5 (Complete Set)', 1658, 'bundle', 'bundle', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव','रोहित कुमार'], 'A complete collection of 5 books for students of Guitar, Sitar, Harmonium, Bansuri, Sarod, Casio, Mandolin, Sarangi and more. Covers raag introductions, alaap, Maseetkhani gat, Razakhani gat, taan and jhala across 130 ragas - aligned with syllabi from Class 9 through Post-Graduation, Prayag Sangit Samiti, Pracheen Kala Kendra, and Gandharv Mahavidyalay Mumbai (Year 1–8 Pravin).', null, '/covers/swar-vadan-complete-set.jpg', 'Swar Vadan', null, true, true, true, array['instrumental','sitar','harmonium','guitar','bansuri','bundle','complete-set']),
  ('b-bal-sangit-set', 'bal-sangit-sangrah-complete-set', 'बाल संगीत संग्रह (भाग 1–3) - सम्पूर्ण सेट', 'Bal Sangit Sangrah Parts 1–3 (Complete Set)', 375, 'bundle', 'bundle', 'bilingual', array['पं० सतीश चन्द्र श्रीवास्तव'], 'A 3-book series with photographs of musicians and instruments, basic music knowledge, easy compositions and notations of ragas and talas, orchestra concepts, vandana, prayers, patriotic songs, children''s songs, English songs, and biographies of renowned musicians. Specially designed for students up to Class 8 and beginners.', null, '/covers/bal-sangit-sangrah-complete-set.jpg', 'Bal Sangit Sangrah', null, true, true, true, array['children','beginner','vocal','bundle','complete-set']),
  ('b-intro-raags-set', 'introduction-of-raags-complete-set', 'Introduction Of Raags भाग 1 & 2 - सम्पूर्ण सेट', 'Introduction of Raags Part 1 & 2 (Complete Set)', 448, 'bundle', 'bundle', 'english', array['Pt. Satish Chandra Srivastava','Rohit Kumar'], 'A set of 2 Hindustani Music books in English - useful for students of Class 9 to 12, Prayag Sangit Samiti Allahabad and Pracheen Kala Kendra for first to fourth year. Covers both Theory and Practical.', null, '/covers/introduction-of-raags-complete-set.jpg', 'Introduction of Raags', null, true, false, true, array['raag-theory','english-medium','bundle','complete-set']),
  ('b-bhatkhande-1-3-set', 'bhatkhande-notation-1-3-set', 'भातखंडे स्वरलीपि संग्रह (भाग 1–3) - सम्पूर्ण सेट', 'Bhatkhande Notation Collection Parts 1–3 (Complete Set)', 597, 'bundle', 'bundle', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव','डॉ० अल्पना खरे'], 'A 3-book set for Hindustani Classical Vocal in Hindi, covering 56 ragas with notation. Each raga includes introduction, aaroh-avroh, pakad, nyaas swar, similar ragas, alaap, taan, chhota khayal, bada khayal, dhrupad, dhamar and tarana. Suitable for Prayag Sangit Samiti, Pracheen Kala Kendra, Gandharv Mahavidyalay and Class 9 to B.A.', null, '/covers/bhatkhande-notation-1-3-set.jpg', 'Bhatkhande Notation', null, true, true, true, array['vocal','bhatkhande','notation','bundle','complete-set']),
  ('b-bhatkhande-1-5-set', 'bhatkhande-notation-1-5-set', 'भातखंडे स्वरलीपि संग्रह (भाग 1–5) - सम्पूर्ण सेट', 'Bhatkhande Notation Collection Parts 1–5 (Complete Set)', 1295, 'bundle', 'bundle', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव','डॉ० अल्पना खरे'], 'A complete 5-book set covering 116 ragas with notation for Hindustani Classical Vocal. Includes aaroh-avroh, pakad, alaap, taan, chhota khayal, bada khayal, dhrupad, dhamar and tarana for each raga. Aligned with syllabi from Class 9 through M.A., Prayag Sangit Samiti, Pracheen Kala Kendra and Gandharv Mahavidyalay.', null, '/covers/bhatkhande-notation-1-5-set.jpg', 'Bhatkhande Notation', null, true, true, true, array['vocal','bhatkhande','notation','bundle','complete-set']),
  ('sv-5', 'swar-vadan-part-5', 'स्वर वादन भाग-5', 'Swar Vadan Part 5', 499, 'instrumental', 'advanced', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव (सितार वादक)','रोहित कुमार'], 'For M.A. Sangit Pravin, Sangit Bhaskar and equivalent students. Covers 30 ragas - 15 detailed (Bilaskhani Todi, Megh Malhar, Jogkauns, Nayaki Kanhada, Kaunsi Kanhada, Suha, Hemant, Shyam Kalyan, Gorakh Kalyan, Devgiri Bilawal, Yamani Bilawal, Bhatiyar, Jhinjhoti, Miyan Ki Sarang, Jaitashri) and 15 in brief. Each includes alaap, Maseetkhani gat, Razakhani gat, tihai and jhala.', null, '/covers/swar-vadan-part-5.jpg', 'Swar Vadan', 5, false, true, true, array['instrumental','sitar','harmonium','advanced','ma','pravin']),
  ('sv-4', 'swar-vadan-part-4', 'स्वर वादन भाग-4', 'Swar Vadan Part 4', 499, 'instrumental', 'advanced', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव (सितार वादक)','रोहित कुमार'], 'For M.A. Sangit Pravin, Sangit Bhaskar and equivalent students. Contains 30 ragas - 15 detailed (Ahir Bhairav, Puriya Kalyan, Chandrakauns, Gurjari Todi, Madhuvanti, Maru Bihag, Shuddh Sarang, Hans Dhwani, Nand, Jog, Madhmad Sarang, Abhogi Kanhada, Sur Malhar, Narayani, Maluha Kedar) and 15 brief.', null, '/covers/swar-vadan-part-4.jpg', 'Swar Vadan', 4, false, false, true, array['instrumental','sitar','harmonium','advanced','ma','pravin']),
  ('sv-3', 'swar-vadan-part-3', 'स्वर वादन भाग-3', 'Swar Vadan Part 3', 300, 'instrumental', 'intermediate', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव (सितार वादक)','रोहित कुमार'], 'For B.A. Sangit Prabhakar and equivalent students. Covers 29 ragas including Lalit, Rageshri, Miyan Malhar, Darbari Kanhada, Ramkali, Basant, Paraj, Shuddh Kalyan, Puriya Kalyan, Shuddh Sarang, Chandrakauns, Jog, and more - with alaap, Maseetkhani gat, Razakhani gat, tihai and jhala.', null, '/covers/swar-vadan-part-3.jpg', 'Swar Vadan', 3, false, false, true, array['instrumental','sitar','harmonium','intermediate','ba','prabhakar']),
  ('sv-2', 'swar-vadan-part-2', 'स्वर वादन भाग-2', 'Swar Vadan Part 2', 180, 'instrumental', 'intermediate', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव (सितार वादक)','रोहित कुमार'], 'For Class 11–12 boards, Prayag Sangit Samiti and Pracheen Kala Kendra (3rd–4th year). Covers ragas Ahir Bhairav, Patdeep, Kalingada, Gaud Sarang, Hindol, Purvi, Hamir, Bahar, Pilu, Deshkar, Shankara, Jayjayawanti, Kamod, Marwa, Multani, Sohni, and Todi - with alaap, vilambit gat, drut gat, jhala and notation differences for harmonium and sitar/sarod.', null, '/covers/swar-vadan-part-2.jpg', 'Swar Vadan', 2, false, false, true, array['instrumental','sitar','harmonium','intermediate','class-11-12']),
  ('sv-1', 'swar-vadan-part-1', 'स्वर वादन भाग-1', 'Swar Vadan Part 1', 180, 'instrumental', 'beginner', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव (सितार वादक)','रोहित कुमार'], 'Ideal for Sitar, Guitar, Harmonium, Casio, Bansuri, Sarod, Mandolin, Sarangi and more. Covers Class 9–10 boards and Prayag Sangit Samiti / Pracheen Kala Kendra (1st–2nd year). Contains 20 ragas including Bhairav, Alhaya Bilawal, Kafi, Bhupali, Kalyan (Yaman), Bhairavi, Asavari, Vibhas, Vrindavani Sarang, Bhimpalasi, Durga, Desh, Kedar, Bageshri, Bihag, Malkaus, Jaunpuri, Tilak Kamod, Tilang, Pilu. Includes introduction, alaap, Maseetkhani gat, Razakhani gat and jhala.', null, '/covers/swar-vadan-part-1.jpg', 'Swar Vadan', 1, false, true, true, array['instrumental','sitar','harmonium','beginner','class-9-10']),
  ('bsl-5', 'bhatkhande-swarlippi-part-5', 'भातखंडे स्वरलिपि संग्रह भाग-5', 'Bhatkhande Swarlippi Sangrah Part 5', 399, 'vocal', 'advanced', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव','डॉ० अल्पना खरे'], 'For M.A., Sangit Pravin, Sangit Bhaskar and equivalent vocal students. Includes raaga description, aaroh-avroh, pakad, nyaas swar, alaap, mukta taan, chhota khayal, bada khayal, dhrupad, dhamar and tarana for ragas including Bilaskhani Todi, Megh Malhar, Jogkauns, Nayaki Kanhada, Suha, Hemant, Shyam Kalyan, Gorakha Kalyan, Devgiri Bilawal, Yamani Bilawal, Matiyar, Jhinjhoti, Miyan Ki Sarang, Jaitashri, Bihagda, Nat Bihag, Jat Kalyan, Ramdasi Malhar, Shukla Bilawal, and more.', null, '/covers/bhatkhande-swarlippi-part-5.jpg', 'Bhatkhande Swarlippi Sangrah', 5, false, true, true, array['vocal','bhatkhande','notation','advanced','ma','pravin']),
  ('bsl-4', 'bhatkhande-swarlippi-part-4', 'भातखंडे स्वरलिपि संग्रह भाग-4', 'Bhatkhande Swarlippi Sangrah Part 4', 299, 'vocal', 'advanced', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव','डॉ० अल्पना खरे'], 'For M.A., Sangit Pravin, Sangit Bhaskar and equivalent vocal students. Covers ragas Ahir Bhairav, Puriya Kalyan, Chandrakauns, Gurjari Todi, Madhuvanti, Hans Dhwani, Maru Bihag, Shuddh Sarang, Jog, Nand, Madhmad Sarang, Abhogi Kanhada, Sur Malhar, Narayani, Maluha Kedar, Bengal Bhairav, Jalghar Kedar, Bhupal Todi, Dhani, Gopibasant, Rewa, Hanskinkini, Jait, Dhanashri, Bheem, Shahana, Anand Bhairav, Sarpad, Gara, Jayant Malhar.', null, '/covers/bhatkhande-swarlippi-part-4.jpg', 'Bhatkhande Swarlippi Sangrah', 4, false, false, true, array['vocal','bhatkhande','notation','advanced','ma']),
  ('bsl-3', 'bhatkhande-swarlippi-part-3', 'भातखंडे स्वरलिपि संग्रह भाग-3', 'Bhatkhande Swarlippi Sangrah Part 3', 249, 'vocal', 'intermediate', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव','डॉ० अल्पना खरे'], 'For B.A. Sangit Prabhakar, Sangit Visharad and equivalent students. Contains Pt. Bhatkhande''s gharanedar compositions in notation. Covers ragas Puriya, Darbari Kanhada, Todi, Ramkali, Miyan Malhar, Rageshri, Puriya Dhanashri, Lalit, Deshi, Shri, Hindol, Gaud Sarang, Adana, Paraj, Basant, Vimas, Shuddh Kalyan, Gaud Malhar, Chhayanat, and Malgunji.', null, '/covers/bhatkhande-swarlippi-part-3.jpg', 'Bhatkhande Swarlippi Sangrah', 3, false, false, true, array['vocal','bhatkhande','notation','intermediate','ba','prabhakar']),
  ('bsl-2', 'bhatkhande-swarlippi-part-2', 'भातखंडे स्वरलिपि संग्रह भाग-2', 'Bhatkhande Swarlippi Sangrah Part 2', 199, 'vocal', 'intermediate', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव','डॉ० अल्पना खरे'], 'For ISC, CBSE Class 11–12 and equivalent boards, and Prayag Sangit Samiti / Pracheen Kala Kendra (3rd–4th year). Covers ragas Jaunpuri, Malkaus, Jayjayawanti, Bhimpalasi, Patdeep, Vrindavani Sarang, Multani, Bhairav, Kalingada, Hamir, Kedar, Kamod, Deshkar, Shankara, Sohni, Marwa, Purvi, Bahar, Pilu, Tilang, Tilak Kamod, Ahir Bhairav.', null, '/covers/bhatkhande-swarlippi-part-2.jpg', 'Bhatkhande Swarlippi Sangrah', 2, false, false, true, array['vocal','bhatkhande','notation','intermediate','class-11-12']),
  ('bsl-1', 'bhatkhande-swarlippi-part-1', 'भातखंडे स्वरलिपि संग्रह भाग-1', 'Bhatkhande Swarlippi Sangrah Part 1', 149, 'vocal', 'beginner', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव','डॉ० अल्पना खरे'], 'For ICSE, CBSE Class 9–10 and equivalent boards, and Prayag Sangit Samiti / Pracheen Kala Kendra (1st–2nd year). Covers ragas Kalyan (Yaman), Alhaya Bilawal, Bhairav, Bhairavi, Bhupali, Bageshri, Khamaj, Vrindavani Sarang, Bhimpalasi, Desh, Bihag, Asavari, Kafi, and Durga - with sargam geet, lakshan geet, chhota khayal, bada khayal, tarana, dhrupad and dhamar.', null, '/covers/bhatkhande-swarlippi-part-1.jpg', 'Bhatkhande Swarlippi Sangrah', 1, false, true, true, array['vocal','bhatkhande','notation','beginner','class-9-10']),
  ('rsp-3', 'raag-shastra-parichay-part-3', 'राग शास्त्र परिचय भाग-3', 'Raag Shastra Parichay Part 3', 225, 'raag-theory', 'intermediate', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव','डॉ. अल्पना खरे'], 'For Sangit Prabhakar, B.A. and equivalent students. Covers 36 ragas including Ramkali, Lalit, Kamod, Shuddh Kalyan, Darbari Kanhada, Adana, Rageshri, Chhayanat, Puriya, Sohni, Basant, Puriya Dhanashri, Shri, Todi, Multani, Miyan Malhar, Jhinjhoti, Pahadi, Maand, and Aasa. Also includes raga comparison, Hindustani vs Carnatic systems, Indian music history, gharanas, biographies and Western notation.', null, '/covers/raag-shastra-parichay-part-3.jpg', 'Raag Shastra Parichay', 3, false, false, true, array['raag-theory','theory','intermediate','ba','prabhakar']),
  ('rsp-2', 'raag-shastra-parichay-part-2', 'राग शास्त्र परिचय भाग-2', 'Raag Shastra Parichay Part 2', 175, 'raag-theory', 'intermediate', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव','डॉ. अल्पना खरे'], 'For Class 11–12 boards and Prayag Sangit Samiti / Pracheen Kala Kendra (3rd–4th year). Covers 26 ragas including Bhimpalasi, Patdeep, Kedar, Hamir, Kamod, Jaunpuri, Vrindavani Sarang, Bahar, Tilak Kamod, Gaud Sarang, Marwa, Sohni, Purvi, Todi, Multani, Shankara, Jayjayawanti, Pilu, Ahir Bhairav, Hindol. Also includes laya, maatra, taal, laykari chapters, terminology and biographies.', null, '/covers/raag-shastra-parichay-part-2.jpg', 'Raag Shastra Parichay', 2, false, false, true, array['raag-theory','theory','intermediate','class-11-12']),
  ('rsp-1', 'raag-shastra-parichay-part-1', 'राग शास्त्र परिचय भाग-1', 'Raag Shastra Parichay Part 1', 99, 'raag-theory', 'beginner', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव','डॉ. अल्पना खरे'], 'For Class 9–10 boards, Prayag Sangit Samiti and Pracheen Kala Kendra (1st–2nd year). Covers 19 ragas including Kalyan, Bihag, Kafi, Bhupali, Alhaya Bilawal, Khamaj, Tilang, Bhairav, Bhairavi, Malkaus, Bhimpalasi, Bageshri, Asavari, Jaunpuri, Vrindavani Sarang, Desh, Tilak Kamod, Durga, and Kedar. Also includes taal, laya, terminology, instruments, brief music history and musician biographies.', null, '/covers/raag-shastra-parichay-part-1.jpg', 'Raag Shastra Parichay', 1, false, true, true, array['raag-theory','theory','beginner','class-9-10']),
  ('ior-2', 'introduction-of-raags-part-2', 'Introduction of Raags भाग-2', 'Introduction of Raags Part 2', 249, 'raag-theory', 'intermediate', 'english', array['Pt. Satish Chandra Srivastava','Rohit Kumar'], 'A complete book of Theory and Practical for students of Class 11–12 appearing through English medium in ISC Board, U.P. Board and equivalent examinations. Also covers the syllabus of Prayag Sangit Samiti Allahabad and Pracheen Kala Kendra Chandigarh for the 3rd and 4th years.', null, '/covers/introduction-of-raags-part-2.jpg', 'Introduction of Raags', 2, false, false, true, array['raag-theory','english-medium','intermediate','class-11-12','isc']),
  ('ior-1', 'introduction-of-raags-part-1', 'Introduction of Raags भाग-1', 'Introduction of Raags Part 1', 199, 'raag-theory', 'beginner', 'english', array['Pt. Satish Chandra Srivastava','Rohit Kumar'], 'A complete book of Theory and Practical for students of Class 9–10 appearing through English medium in ICSE Board, U.P. Board and equivalent examinations. Also covers the complete syllabus of Prayag Sangit Samiti Allahabad and Pracheen Kala Kendra Chandigarh for the first two years.', null, '/covers/introduction-of-raags-part-1.jpg', 'Introduction of Raags', 1, false, false, true, array['raag-theory','english-medium','beginner','class-9-10','icse']),
  ('kathak-1', 'kathak-shastra-parichay-part-1', 'कथक शास्त्र परिचय भाग-1', 'Kathak Shastra Parichay Part 1', 149, 'kathak', 'beginner', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव','डॉ. अल्पना खरे'], 'For Prayag Sangit Samiti and Pracheen Kala Kendra (1st–4th year). Covers Bhatkhande and Vishnu Digambar taal-lipis, Tandav and Laasya dance, Bharatnatyam, Kathakali, Manipuri, Kathak, folk dances, brief history of Kathak, gharanas, tabla, pakhawaj, taals, laykari, biographies, mudras, ang-sanchalan, dancer''s attire, rasa and bhaav, nayak-nayika bhed, kavitt and thumri, dance laheras, gharanedar bandishes and detailed terminology.', null, '/covers/kathak-shastra-parichay-part-1.jpg', 'Kathak Shastra Parichay', 1, false, true, true, array['kathak','dance','beginner','theory']),
  ('malhar-darshan', 'malhar-darshan', 'मल्हार दर्शन', 'Malhar Darshan', 300, 'research', 'research', 'hindi', array['डॉ. गीता बनर्जी (अवकाश प्राप्त अध्यक्षा, संगीत विभाग, इलाहाबाद विश्वविद्यालय)'], 'A scholarly work covering 30 types of ancient, medieval and modern Malhar ragas. Establishes the pure form of Malhar ragas by dispelling misconceptions. Includes Megh Malhar, Gaud Malhar, Miyan Malhar, Sur Malhar, Ramdasi Malhar, Nat Malhar, Meera Malhar, Dhulia Malhar, Gaudgiri Malhar, Charaju Ki Malhar, Jayant Malhar, Samant Malhar, Chanchalas Malhar, Aruna Malhar, Rupamanjari Malhar, Chhaaya Malhar, Tilak Malhar, Sorath Malhar, Kedar Malhar, Jhanjh Malhar, Chandra Malhar, Mahendra Malhar, Anjani Malhar, Janaki Malhar and many more compositions. An invaluable resource for artists, researchers, teachers and music enthusiasts.', null, '/covers/malhar-darshan.jpg', null, null, false, true, true, array['research','malhar','raaga','scholarly','advanced']),
  ('cbse-vocal-9', 'concepts-of-vocal-music-class-9', 'Concepts of Vocal Music - कक्षा IX', 'Concepts of Vocal Music - Class IX', 159, 'cbse', 'beginner', 'english', array['Pt. Satish Chandra Srivastava','Dr. Alpana Khare'], 'Covers the entire CBSE syllabus for Class IX Hindustani Music (Code 034). Contains both Theory and Practical sections. Includes objective questions as per the new pattern. Suitable for English medium students appearing in board examinations.', null, '/covers/concepts-of-vocal-music-class-9.jpg', 'Concepts of Vocal Music', 9, false, false, true, array['vocal','cbse','class-9','english-medium','beginner']),
  ('cbse-vocal-10', 'concepts-of-vocal-music-class-10', 'Concepts of Vocal Music - कक्षा X', 'Concepts of Vocal Music - Class X', 159, 'cbse', 'beginner', 'english', array['Pt. Satish Chandra Srivastava','Dr. Alpana Khare'], 'Covers the entire CBSE syllabus for Class X Hindustani Music (Code 034). Contains both Theory and Practical sections. Includes objective questions as per the new pattern. Suitable for English medium students appearing in board examinations.', null, '/covers/concepts-of-vocal-music-class-10.jpg', 'Concepts of Vocal Music', 10, false, false, true, array['vocal','cbse','class-10','english-medium','beginner']),
  ('cbse-vocal-11', 'concepts-of-vocal-music-class-11', 'Concepts of Vocal Music - कक्षा XI', 'Concepts of Vocal Music - Class XI', 159, 'cbse', 'intermediate', 'english', array['Pt. Satish Chandra Srivastava','Dr. Alpana Khare'], 'Covers the entire CBSE syllabus for Class XI Hindustani Music (Code 034). Contains both Theory and Practical sections. Includes objective questions as per the new pattern. Suitable for English medium students appearing in board examinations.', null, '/covers/concepts-of-vocal-music-class-11.jpg', 'Concepts of Vocal Music', 11, false, false, true, array['vocal','cbse','class-11','english-medium','intermediate']),
  ('cbse-vocal-12', 'concepts-of-vocal-music-class-12', 'Concepts of Vocal Music - कक्षा XII', 'Concepts of Vocal Music - Class XII', 159, 'cbse', 'intermediate', 'english', array['Pt. Satish Chandra Srivastava','Dr. Alpana Khare'], 'Covers the entire CBSE syllabus for Class XII Hindustani Music (Code 034). Contains both Theory and Practical sections. Includes objective questions as per the new pattern. Suitable for English medium students appearing in board examinations.', null, '/covers/concepts-of-vocal-music-class-12.jpg', 'Concepts of Vocal Music', 12, false, false, true, array['vocal','cbse','class-12','english-medium','intermediate']),
  ('cbse-inst-9', 'concepts-of-instrumental-music-class-9', 'Concepts of Instrumental Music - कक्षा IX', 'Concepts of Instrumental Music - Class IX', 149, 'cbse', 'beginner', 'english', array['Pt. Satish Chandra Srivastava','Dr. Alpana Khare'], 'Covers the entire CBSE syllabus for Class IX Hindustani Music (Code 035). Suitable for students who opt for Guitar, Sitar, Sarod, Harmonium, Sarangi, Flute and more. Contains Theory and Practical sections with objective questions as per the new pattern.', null, '/covers/concepts-of-instrumental-music-class-9.jpg', 'Concepts of Instrumental Music', 9, false, false, true, array['instrumental','cbse','class-9','english-medium','beginner']),
  ('cbse-inst-10', 'concepts-of-instrumental-music-class-10', 'Concepts of Instrumental Music - कक्षा X', 'Concepts of Instrumental Music - Class X', 149, 'cbse', 'beginner', 'english', array['Pt. Satish Chandra Srivastava','Dr. Alpana Khare'], 'Covers the entire CBSE syllabus for Class X Hindustani Music (Code 035). Suitable for students who opt for Guitar, Sitar, Sarod, Harmonium, Sarangi, Flute and more. Contains Theory and Practical sections with objective questions as per the new pattern.', null, '/covers/concepts-of-instrumental-music-class-10.jpg', 'Concepts of Instrumental Music', 10, false, false, true, array['instrumental','cbse','class-10','english-medium','beginner']),
  ('cbse-inst-11', 'concepts-of-instrumental-music-class-11', 'Concepts of Instrumental Music - कक्षा XI', 'Concepts of Instrumental Music - Class XI', 149, 'cbse', 'intermediate', 'english', array['Pt. Satish Chandra Srivastava','Dr. Alpana Khare'], 'Covers the entire CBSE syllabus for Class XI Hindustani Music (Code 035). Suitable for students who opt for Guitar, Sitar, Sarod, Harmonium, Sarangi, Flute and more. Contains Theory and Practical sections with objective questions as per the new pattern.', null, '/covers/concepts-of-instrumental-music-class-11.jpg', 'Concepts of Instrumental Music', 11, false, false, true, array['instrumental','cbse','class-11','english-medium','intermediate']),
  ('cbse-inst-12', 'concepts-of-instrumental-music-class-12', 'Concepts of Instrumental Music - कक्षा XII', 'Concepts of Instrumental Music - Class XII', 149, 'cbse', 'intermediate', 'english', array['Pt. Satish Chandra Srivastava','Dr. Alpana Khare'], 'Covers the entire CBSE syllabus for Class XII Hindustani Music (Code 035). Suitable for students who opt for Guitar, Sitar, Sarod, Harmonium, Sarangi, Flute and more. Contains Theory and Practical sections with objective questions as per the new pattern.', null, '/covers/concepts-of-instrumental-music-class-12.jpg', 'Concepts of Instrumental Music', 12, false, false, true, array['instrumental','cbse','class-12','english-medium','intermediate']),
  ('cbse-gayan-11', 'sangit-saar-gayan-class-11', 'संगीत सार गायन कक्षा-XI', 'Sangit Saar: Gayan Class XI', 125, 'cbse', 'intermediate', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव','डॉ. अल्पना खरे'], 'Specially written for CBSE Class 11 vocal music students (Subject Code 034). Covers the complete CBSE syllabus with detailed raga notations, theory, and practical guidance for board examinations.', null, '/covers/sangit-saar-gayan-class-11.jpg', 'Sangit Saar', 11, false, false, true, array['vocal','cbse','class-11','intermediate']),
  ('cbse-gayan-12', 'sangit-saar-gayan-class-12', 'संगीत सार गायन कक्षा-XII', 'Sangit Saar: Gayan Class XII', 125, 'cbse', 'intermediate', 'hindi', array['पं० सतीश चन्द्र श्रीवास्तव','डॉ. अल्पना खरे'], 'Specially written for CBSE Class 12 vocal music students (Subject Code 034). Covers the complete CBSE syllabus with detailed raga notations, theory, and practical guidance for board examinations.', null, '/covers/sangit-saar-gayan-class-12.jpg', 'Sangit Saar', 12, false, false, true, array['vocal','cbse','class-12','intermediate']),
  ('bal-1', 'bal-sangit-sangrah-part-1', 'बाल संगीत संग्रह भाग-1', 'Bal Sangit Sangrah Part 1', 125, 'cbse', 'beginner', 'bilingual', array['पं० सतीश चन्द्र श्रीवास्तव','डॉ. अल्पना खरे'], 'Designed for Class 6 and beginner students. Contains photographs of musicians and instruments, basic music knowledge, ragas Kalyan, Khamaj, Bhupali and Alhaya Bilawal, orchestra pieces, vandana, prayers, patriotic songs, children''s songs and English songs. Also includes biographies of renowned musicians and music terminology.', null, '/covers/bal-sangit-sangrah-part-1.jpg', 'Bal Sangit Sangrah', 1, false, false, true, array['children','beginner','class-6','vocal','bilingual']),
  ('bal-2', 'bal-sangit-sangrah-part-2', 'बाल संगीत संग्रह भाग-2', 'Bal Sangit Sangrah Part 2', 125, 'cbse', 'beginner', 'bilingual', array['पं० सतीश चन्द्र श्रीवास्तव','डॉ. अल्पना खरे'], 'Designed for Class 7 and beginner students. Covers ragas Bageshri, Bhimpalasi, Kafi and Malkaus with alaap, notations and taans. Includes orchestra pieces, prayers, patriotic songs, English songs, biographies of musicians and music terminology.', null, '/covers/bal-sangit-sangrah-part-2.jpg', 'Bal Sangit Sangrah', 2, false, false, true, array['children','beginner','class-7','vocal','bilingual']),
  ('bal-3', 'bal-sangit-sangrah-part-3', 'बाल संगीत संग्रह भाग-3', 'Bal Sangit Sangrah Part 3', 125, 'cbse', 'beginner', 'bilingual', array['पं० सतीश चन्द्र श्रीवास्तव','डॉ. अल्पना खरे'], 'Designed for Class 8 and beginner students. Covers ragas Asavari, Bhairav and Pilu with alaap, notations and taans. Includes orchestra pieces, prayers, patriotic songs, English songs, biographies of musicians and music terminology.', null, '/covers/bal-sangit-sangrah-part-3.jpg', 'Bal Sangit Sangrah', 3, false, false, true, array['children','beginner','class-8','vocal','bilingual']),
  ('treasure-raags-taals', 'treasure-of-raags-and-taals', 'Treasure of Raags & Taals', 'Treasure of Raags & Taals', 150, 'research', 'research', 'english', array['Pt. Satish Chandra Srivastava'], 'A comprehensive reference covering 564 North Indian ragas with Thaat, Jati, Vadi, Samvadi, nature of notes, Aaroha, Avaroha and performing time. Also includes 69 North Indian taals with Matra, Vibhag, Tali, Khali and Theka. Covers 938 South Indian ragas and 175 South Indian taals. An invaluable resource for music lovers, students, teachers and research scholars.', null, '/covers/treasure-of-raags-and-taals.jpg', null, null, false, false, true, array['research','reference','raag','taal','english','scholarly'])
on conflict (id) do nothing;
