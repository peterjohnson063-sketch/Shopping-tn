-- Idempotent: add checkout GPS columns even if earlier migrations were skipped or only partially applied.
-- Run this in the Supabase SQL editor if you still see: column "customer_lat" of relation "public.orders" does not exist.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'orders' and table_type = 'BASE TABLE'
  ) then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'orders' and column_name = 'customer_lat'
    ) then
      alter table public.orders add column customer_lat double precision;
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'orders' and column_name = 'customer_lng'
    ) then
      alter table public.orders add column customer_lng double precision;
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'orders' and column_name = 'checkout_geo_captured_at'
    ) then
      alter table public.orders add column checkout_geo_captured_at timestamptz;
    end if;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'customer_lat'
  ) then
    comment on column public.orders.customer_lat is 'Buyer device latitude at checkout (Geolocation API), if shared';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'customer_lng'
  ) then
    comment on column public.orders.customer_lng is 'Buyer device longitude at checkout (Geolocation API), if shared';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'checkout_geo_captured_at'
  ) then
    comment on column public.orders.checkout_geo_captured_at is 'When checkout GPS was captured';
  end if;
end $$;

notify pgrst, 'reload schema';
