-- Run this entire file in Supabase → SQL Editor for the SAME project your app uses.
-- App in this repo points at project ref: kmwqffaphhcbzboiwosj (see supabase-fixed.js SUPABASE_URL).

-- 1) What is "orders" in public?
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relkind,
  case c.relkind
    when 'r' then 'ordinary table'
    when 'p' then 'partitioned table'
    when 'v' then 'view (cannot ADD COLUMN here — fix the base table)'
    when 'm' then 'materialized view'
    else c.relkind::text
  end as meaning
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and lower(c.relname) = 'orders';

-- 2) Geo columns present?
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'orders'
  and column_name in ('customer_lat', 'customer_lng', 'checkout_geo_captured_at');

-- 3) Add columns only if public.orders is a real table (r or p), using the real relname casing.
do $$
declare
  fq text;
  k "char";
begin
  select c.relkind, format('%I.%I', n.nspname, c.relname)
  into k, fq
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and lower(c.relname) = 'orders'
    and c.relkind in ('r', 'p', 'v', 'm')
  order by case when c.relname = 'orders' then 0 else 1 end
  limit 1;

  if fq is null then
    raise exception 'No relation named orders in schema public. Create or rename your table, or you are on the wrong Supabase project.';
  end if;

  if k not in ('r', 'p') then
    raise exception 'Relation % is not a normal table (relkind=%). ADD COLUMN only works on tables. Use the underlying table or recreate as a table.', fq, k;
  end if;

  execute format(
    'alter table %s add column if not exists customer_lat double precision, add column if not exists customer_lng double precision, add column if not exists checkout_geo_captured_at timestamptz',
    fq
  );
end $$;

notify pgrst, 'reload schema';
