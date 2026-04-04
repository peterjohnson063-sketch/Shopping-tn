-- Heal: add checkout GPS columns using to_regclass('public.orders') so ALTER targets the real relation.
-- Run in Supabase SQL Editor if you still see 42703 on customer_lat. Then: notify pgrst (below) or reload schema cache.

do $$
declare
  r regclass;
begin
  r := to_regclass('public.orders');
  if r is null then
    raise exception 'public.orders not found — check schema and table name.';
  end if;
  execute format('alter table %s add column if not exists customer_lat double precision', r);
  execute format('alter table %s add column if not exists customer_lng double precision', r);
  execute format('alter table %s add column if not exists checkout_geo_captured_at timestamptz', r);
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
    execute 'comment on column public.orders.customer_lat is ' ||
      quote_literal('Buyer device latitude at checkout (Geolocation API), if shared');
  end if;
  if exists (
    select 1
    from pg_catalog.pg_attribute a
    join pg_catalog.pg_class c on c.oid = a.attrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'orders' and a.attname = 'customer_lng' and a.attnum > 0 and not a.attisdropped
  ) then
    execute 'comment on column public.orders.customer_lng is ' ||
      quote_literal('Buyer device longitude at checkout (Geolocation API), if shared');
  end if;
  if exists (
    select 1
    from pg_catalog.pg_attribute a
    join pg_catalog.pg_class c on c.oid = a.attrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'orders' and a.attname = 'checkout_geo_captured_at' and a.attnum > 0 and not a.attisdropped
  ) then
    execute 'comment on column public.orders.checkout_geo_captured_at is ' ||
      quote_literal('When checkout GPS was captured');
  end if;
end $$;

notify pgrst, 'reload schema';
