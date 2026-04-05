-- Add-only heal (no COMMENT). Paste this alone in SQL Editor if customer_lat is missing.

alter table public.orders
  add column if not exists customer_lat double precision,
  add column if not exists customer_lng double precision,
  add column if not exists checkout_geo_captured_at timestamptz;

notify pgrst, 'reload schema';
