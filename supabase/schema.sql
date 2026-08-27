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
-- Orders/order_items SELECT stays fully open (not scoped to auth.uid()) because the
-- admin panel reads all orders via this same anon-key client with no Supabase Auth
-- session of its own (it's still gated by the separate localStorage password, not
-- real auth — see CLAUDE.md Phase 2). Restricting SELECT here would silently break
-- admin. The customer-facing "My Orders" page filters to the signed-in user's own
-- orders with an explicit `.eq('user_id', ...)` query instead of relying on RLS.
-- Once admin gets real Supabase Auth accounts (Phase 2), this should be revisited —
-- tracked in tasks.md under Security & maintenance.
alter table orders      enable row level security;
alter table order_items enable row level security;

-- Anyone can insert (customers placing orders via checkout, logged in or as guest)
create policy "insert_orders"      on orders      for insert with check (true);
create policy "insert_order_items" on order_items for insert with check (true);

-- Anyone can read (admin panel — will be restricted to authenticated admins in Phase 2)
create policy "read_orders"      on orders      for select using (true);
create policy "read_order_items" on order_items for select using (true);

-- Anyone can update status (admin panel — will be restricted in Phase 2)
create policy "update_orders" on orders for update using (true);

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
