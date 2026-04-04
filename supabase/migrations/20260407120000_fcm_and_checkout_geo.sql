-- FCM device tokens on users; checkout GPS on orders (lat/lng included here so this migration is self-contained).

alter table public.users
  add column if not exists fcm_token text,
  add column if not exists fcm_token_updated_at timestamptz;

-- Do not gate on information_schema.tables (BASE TABLE); that can skip real tables (e.g. partitioned). Add columns with exceptions instead.
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

comment on column public.users.fcm_token is 'Firebase Cloud Messaging registration token for web push';

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
