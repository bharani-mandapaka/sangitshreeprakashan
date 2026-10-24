-- ============================================================
-- Error log: run ONCE in the Supabase SQL Editor on the live database
-- (Dashboard -> SQL Editor -> New query). Safe to re-run.
-- Keeps a record of server and browser errors (checkout failures, payments that were
-- taken but whose order was not saved, notification failures, page crashes) so they can
-- be reviewed in Admin -> System instead of disappearing from Vercel's short-lived logs.
-- The site works without this table (errors still go to Vercel's logs), so it is safe
-- to deploy the code first.
-- ============================================================

create table if not exists error_logs (
  id          bigint generated always as identity primary key,
  source      text not null,                       -- e.g. 'checkout/verify', 'browser'
  severity    text not null default 'error'
              check (severity in ('critical', 'error', 'warning')),
  message     text not null,
  details     jsonb,                                -- ids and context needed to fix it by hand
  occurrences integer not null default 1,           -- identical errors are grouped, not repeated
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  resolved    boolean not null default false
);

create index if not exists error_logs_open_idx on error_logs (resolved, last_seen desc);

-- Only the server (service-role key, which bypasses RLS) may read or write this table.
-- RLS on with NO policies means the public anon key can do nothing with it.
alter table error_logs enable row level security;
