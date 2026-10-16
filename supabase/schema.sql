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

create policy "anon_all_notification_rules" on notification_rules for all to anon using (true) with check (true);
create policy "anon_all_notification_logs"  on notification_logs  for all to anon using (true) with check (true);
