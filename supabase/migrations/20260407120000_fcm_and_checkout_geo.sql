-- FCM device tokens on users; optional checkout geo timestamp on orders (lat/lng already exist).

alter table public.users
  add column if not exists fcm_token text,
  add column if not exists fcm_token_updated_at timestamptz;

alter table public.orders
  add column if not exists checkout_geo_captured_at timestamptz;

comment on column public.users.fcm_token is 'Firebase Cloud Messaging registration token for web push';
comment on column public.orders.customer_lat is 'Buyer device latitude at checkout (Geolocation API), if shared';
comment on column public.orders.customer_lng is 'Buyer device longitude at checkout (Geolocation API), if shared';
comment on column public.orders.checkout_geo_captured_at is 'When checkout GPS was captured';

notify pgrst, 'reload schema';
