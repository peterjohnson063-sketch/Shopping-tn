-- Delivery driver assignments & live GPS on orders (run in Supabase SQL editor if not using CLI)
-- Adjust types if your `users.id` / `orders.id` differ.

-- driver_id: same type as public.users.id (uuid or bigint — adjust one line to match your schema)
alter table public.orders
  add column if not exists driver_id uuid;

-- If users.id is bigint instead, use:
-- alter table public.orders add column if not exists driver_id bigint references public.users (id) on delete set null;

alter table public.orders
  add column if not exists driver_lat double precision,
  add column if not exists driver_lng double precision;

comment on column public.orders.driver_id is 'User id (role driver) assigned to deliver this order';
comment on column public.orders.driver_lat is 'Last known driver GPS latitude (optional live tracking)';
comment on column public.orders.driver_lng is 'Last known driver GPS longitude';

-- RLS: tighten in production — example policies (adjust to your auth model):
-- create policy "drivers read assigned orders" on public.orders for select
--   using (driver_id = auth.uid());
-- create policy "drivers update assigned orders" on public.orders for update
--   using (driver_id = auth.uid());
