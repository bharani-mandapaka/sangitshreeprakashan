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

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Phase 1: fully open (no auth yet). Tightened in Phase 2 with NextAuth.
alter table orders      enable row level security;
alter table order_items enable row level security;

-- Anyone can insert (customers placing orders via checkout)
create policy "insert_orders"      on orders      for insert with check (true);
create policy "insert_order_items" on order_items for insert with check (true);

-- Anyone can read (admin panel — will be restricted to authenticated admins in Phase 2)
create policy "read_orders"      on orders      for select using (true);
create policy "read_order_items" on order_items for select using (true);

-- Anyone can update status (admin panel — will be restricted in Phase 2)
create policy "update_orders" on orders for update using (true);

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
