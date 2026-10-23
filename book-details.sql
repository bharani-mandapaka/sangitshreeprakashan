-- ============================================================
-- Book details: run ONCE in the Supabase SQL Editor on the live database
-- (Dashboard -> SQL Editor -> New query). Safe to re-run.
-- Optional extra information for each book, filled in from Admin -> Catalog and shown on the
-- book's page when present: ISBN, edition, number of pages, year, table of contents and a
-- short note about the author(s). Books with none of these look exactly as before.
-- The site works without these columns (the admin form simply hides the fields), so it is
-- safe to deploy the code first.
-- ============================================================

alter table books
  add column if not exists isbn             text,
  add column if not exists edition          text,
  add column if not exists pages            integer check (pages is null or pages > 0),
  add column if not exists publication_year integer check (publication_year is null or publication_year between 1900 and 2100),
  add column if not exists table_of_contents text[],      -- one entry per line
  add column if not exists about_authors    text;
