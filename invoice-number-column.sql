-- ── Order invoice numbering (admin "Print Invoice" feature) ──────────────────
-- Run this once in the Supabase SQL Editor (a fresh New Query tab). Isolated
-- into its own file rather than appended to the full schema.sql, since a
-- long multi-statement paste runs as one implicit transaction — a single
-- unrelated failing statement earlier in a big file can silently roll back
-- everything after it (this bit the books-table migration earlier; see
-- CLAUDE.md's Known Issues history).
--
-- IMPORTANT — set the starting number before running:
-- Sangit Shree Prakashan already issues invoices today (e.g. Invoice #469)
-- through a process outside this codebase. Replace 470 below with whatever
-- number comes immediately after the last one actually issued, so this new
-- sequence doesn't collide with or restart behind it.

create sequence if not exists orders_invoice_number_seq start with 470;

alter table orders add column if not exists invoice_number bigint;

comment on column orders.invoice_number is
  'Sequential Bill of Supply invoice number. Assigned lazily (on first admin '
  'print, via orders_invoice_number_seq) rather than at order-creation time, '
  'so only orders someone actually prints ever consume a number. Never '
  'reassigned once set.';

-- The Supabase JS client (used by app/api/admin/orders/[id]/invoice/route.ts)
-- has no way to call a sequence's nextval() directly — this small RPC wraps
-- it so the route can call supabase.rpc('next_invoice_number') instead.
-- security definer so it can advance the sequence regardless of who's calling
-- it; the route itself is what's gated (admin-cookie check), not this function.
create or replace function next_invoice_number()
returns bigint
language sql
security definer
as $$
  select nextval('orders_invoice_number_seq');
$$;
