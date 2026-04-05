-- FCM on users; checkout GPS on orders. No COMMENT on orders geo here — COMMENT ON COLUMN fails with 42703 if the column is missing.

alter table public.users
  add column if not exists fcm_token text,
  add column if not exists fcm_token_updated_at timestamptz;

alter table public.orders
  add column if not exists customer_lat double precision,
  add column if not exists customer_lng double precision,
  add column if not exists checkout_geo_captured_at timestamptz;

comment on column public.users.fcm_token is 'Firebase Cloud Messaging registration token for web push';

notify pgrst, 'reload schema';
