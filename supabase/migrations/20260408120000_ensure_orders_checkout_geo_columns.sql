-- Same as add-only: COMMENT on customer_* was removed — it caused 42703 when run before columns existed.

alter table public.orders
  add column if not exists customer_lat double precision,
  add column if not exists customer_lng double precision,
  add column if not exists checkout_geo_captured_at timestamptz;

notify pgrst, 'reload schema';
