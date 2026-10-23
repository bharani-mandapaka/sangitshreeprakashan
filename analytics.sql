-- ============================================================
-- Real analytics: run ONCE in the Supabase SQL Editor on the live database
-- (Dashboard -> SQL Editor -> New query). Safe to re-run.
-- Records anonymous page views, add-to-cart clicks and checkout starts so the admin
-- dashboard shows real visitor numbers instead of numbers kept in each browser.
-- No cookies and no personal data: a visitor is a one-way hash of IP + browser that
-- changes every day, so nobody can be followed across days or identified from it.
-- The site works without this table (nothing is recorded; the dashboard says analytics
-- isn't switched on), so it is safe to deploy the code first.
-- ============================================================

create table if not exists analytics_events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  type       text not null check (type in ('page_view', 'add_to_cart', 'checkout_start')),
  path       text,                       -- e.g. '/books/swar-vadan-part-1' (no query string)
  book_slug  text,                       -- set for book pages and add-to-cart
  visitor    text not null               -- daily-rotating anonymous hash, see lib/analytics-server.ts
);

create index if not exists analytics_events_created_at_idx on analytics_events (created_at);
create index if not exists analytics_events_type_created_at_idx on analytics_events (type, created_at);

-- Only the server (service-role key, which bypasses RLS) may read or write this table.
-- RLS on with NO policies means the public anon key can do nothing with it.
alter table analytics_events enable row level security;
