-- ============================================================
-- Book sample pages ("Look inside"): run ONCE in the Supabase SQL Editor on the live
-- database (Dashboard -> SQL Editor -> New query). Safe to re-run.
-- Lets each book have up to 8 sample page images, uploaded from Admin -> Catalog and shown
-- on the book's page as a "Look inside" gallery. Books without any look exactly as before.
-- The site works without this column (the admin upload section is simply hidden), so it is
-- safe to deploy the code first.
-- ============================================================

alter table books
  add column if not exists sample_pages text[];   -- image addresses, in the order shown
