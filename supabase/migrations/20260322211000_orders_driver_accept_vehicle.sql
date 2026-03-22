-- Shown to customer after driver accepts the delivery
alter table public.orders
  add column if not exists driver_accepted_at timestamptz,
  add column if not exists delivery_vehicle_plate text,
  add column if not exists delivery_vehicle_model text,
  add column if not exists delivery_vehicle_color text;

comment on column public.orders.driver_accepted_at is 'When assigned driver tapped Accept; vehicle snapshot filled at same time';
comment on column public.orders.delivery_vehicle_plate is 'Copy of driver vehicle_plate_number at accept time';
