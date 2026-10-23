-- ============================================================
-- Stock quantities: run ONCE in the Supabase SQL Editor on the live database
-- (Dashboard -> SQL Editor -> New query). Safe to re-run.
-- Lets a book have a number of copies left that goes down as orders arrive, instead of
-- only the on/off "In Stock" switch. Books with no number keep working exactly as before.
-- The site works without this (the quantity field in the admin simply isn't saved), so it
-- is safe to deploy the code first.
-- ============================================================

-- null = copies are not counted (only the In Stock switch applies).
alter table books
  add column if not exists stock_quantity integer
  check (stock_quantity is null or stock_quantity >= 0);

-- Called by the server after a payment is verified: takes `p_qty` copies off the shelf in
-- one step, so two people buying the last copy at once can't both succeed silently.
--   returns null  -> the book's copies are not counted (nothing changed)
--   returns 0     -> there were enough copies
--   returns n > 0 -> n copies were short: the customer already paid for them, so the order
--                    stands and the stock goes to 0, but the shop has to sort out the gap
create or replace function take_stock(p_book_id text, p_qty integer)
returns integer
language plpgsql
as $$
declare
  before_qty integer;
begin
  select stock_quantity into before_qty from books where id = p_book_id for update;
  if before_qty is null then
    return null;
  end if;

  update books
     set stock_quantity = greatest(before_qty - p_qty, 0),
         in_stock       = greatest(before_qty - p_qty, 0) > 0
   where id = p_book_id;

  return greatest(p_qty - before_qty, 0);
end;
$$;

-- Only the server (service-role key) may call it. Without this, anyone with the public key
-- could empty the shop's stock through the data API.
revoke all on function take_stock(text, integer) from public, anon, authenticated;
grant execute on function take_stock(text, integer) to service_role;
