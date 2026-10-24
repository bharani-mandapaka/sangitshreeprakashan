-- ============================================================
-- Rate limiting: run ONCE in the Supabase SQL Editor on the live database
-- (Dashboard -> SQL Editor -> New query). Safe to re-run.
-- Counts recent attempts (admin login failures, login-code requests) so one visitor
-- cannot guess the admin password or trigger unlimited paid WhatsApp messages.
-- The site works without this table (lib/rate-limit.ts falls back to a per-server
-- in-memory counter, which is weaker because serverless instances do not share
-- memory), so it is safe to deploy the code first.
-- ============================================================

create table if not exists rate_limit_hits (
  id         bigint generated always as identity primary key,
  key        text not null,                    -- e.g. 'admin-login:203.0.113.7'
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_key_created_at_idx
  on rate_limit_hits (key, created_at);

-- Only the server (service-role key, which bypasses RLS) may read or write this table.
-- RLS on with NO policies means the public anon key can do nothing with it.
alter table rate_limit_hits enable row level security;
