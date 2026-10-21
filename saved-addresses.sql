-- ============================================================
-- Saved addresses: run ONCE in the Supabase SQL Editor on the live database
-- (Dashboard -> SQL Editor -> New query). Safe to re-run.
-- Lets a signed-in customer keep delivery addresses and reuse them at checkout.
-- The site works without this table (the feature just stays empty), so it is safe
-- to deploy the code first, but addresses can only be saved once this has been run.
-- ============================================================

create table if not exists saved_addresses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  label           text,                       -- optional: "Home", "Office"
  full_name       text not null,
  phone           text not null,
  address_line1   text not null,
  address_city    text not null,
  address_state   text not null,
  address_pincode text not null,
  is_default      boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists saved_addresses_user_id_idx on saved_addresses(user_id);

-- At most one default address per customer.
create unique index if not exists saved_addresses_one_default_idx
  on saved_addresses(user_id) where is_default;

-- Each customer sees and changes only their own addresses (same idea as the wishlist).
alter table saved_addresses enable row level security;

drop policy if exists "select_own_saved_addresses" on saved_addresses;
drop policy if exists "insert_own_saved_addresses" on saved_addresses;
drop policy if exists "update_own_saved_addresses" on saved_addresses;
drop policy if exists "delete_own_saved_addresses" on saved_addresses;
create policy "select_own_saved_addresses" on saved_addresses for select using (auth.uid() = user_id);
create policy "insert_own_saved_addresses" on saved_addresses for insert with check (auth.uid() = user_id);
create policy "update_own_saved_addresses" on saved_addresses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_saved_addresses" on saved_addresses for delete using (auth.uid() = user_id);

-- Cap of 5 saved addresses per customer, enforced by the database itself.
create or replace function enforce_saved_addresses_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from saved_addresses where user_id = new.user_id) >= 5 then
    raise exception 'You can save up to 5 addresses. Delete one to add another.';
  end if;
  return new;
end;
$$;

drop trigger if exists saved_addresses_limit on saved_addresses;
create trigger saved_addresses_limit
  before insert on saved_addresses
  for each row execute function enforce_saved_addresses_limit();
