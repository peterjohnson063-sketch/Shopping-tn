-- Idempotent: add checkout GPS columns. Previous versions gated on information_schema.tables (BASE TABLE), which could skip ALTER on some setups.
-- Run the whole file in the Supabase SQL editor if you see: column "customer_lat" of relation "public.orders" does not exist.

do $$
begin
  alter table public.orders add column customer_lat double precision;
exception
  when duplicate_column then null;
  when undefined_table then null;
end $$;

do $$
begin
  alter table public.orders add column customer_lng double precision;
exception
  when duplicate_column then null;
  when undefined_table then null;
end $$;

do $$
begin
  alter table public.orders add column checkout_geo_captured_at timestamptz;
exception
  when duplicate_column then null;
  when undefined_table then null;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_attribute a
    join pg_catalog.pg_class c on c.oid = a.attrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'orders' and a.attname = 'customer_lat' and a.attnum > 0 and not a.attisdropped
  ) then
    execute 'comment on column public.orders.customer_lat is ' || quote_literal('Buyer device latitude at checkout (Geolocation API), if shared');
  end if;
  if exists (
    select 1
    from pg_catalog.pg_attribute a
    join pg_catalog.pg_class c on c.oid = a.attrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'orders' and a.attname = 'customer_lng' and a.attnum > 0 and not a.attisdropped
  ) then
    execute 'comment on column public.orders.customer_lng is ' || quote_literal('Buyer device longitude at checkout (Geolocation API), if shared');
  end if;
  if exists (
    select 1
    from pg_catalog.pg_attribute a
    join pg_catalog.pg_class c on c.oid = a.attrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'orders' and a.attname = 'checkout_geo_captured_at' and a.attnum > 0 and not a.attisdropped
  ) then
    execute 'comment on column public.orders.checkout_geo_captured_at is ' || quote_literal('When checkout GPS was captured');
  end if;
end $$;

notify pgrst, 'reload schema';
