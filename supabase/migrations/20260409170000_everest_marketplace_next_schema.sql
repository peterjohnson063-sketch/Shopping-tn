-- Everest marketplace schema for Next.js app

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'vendor', 'client');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'client',
  created_at timestamptz not null default now()
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid unique references auth.users(id) on delete set null,
  company_name text not null,
  location text not null,
  specialist_type text not null,
  account_status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  base_price numeric(12,2) not null default 0,
  dimensions_l numeric(10,2) not null default 0,
  dimensions_w numeric(10,2) not null default 0,
  dimensions_h numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_albums (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  material text not null,
  availability text not null default 'made_to_order',
  model_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.product_album_images (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.product_albums(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.custom_orders (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  client_user_id uuid references auth.users(id) on delete set null,
  client_name text not null,
  notes text,
  requested_dimensions jsonb,
  blender_model_url text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.products enable row level security;
alter table public.product_albums enable row level security;
alter table public.product_album_images enable row level security;
alter table public.custom_orders enable row level security;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles
for select using (id = auth.uid());

drop policy if exists "admin full vendors" on public.vendors;
create policy "admin full vendors" on public.vendors
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "vendor read own vendor" on public.vendors;
create policy "vendor read own vendor" on public.vendors
for select using (owner_user_id = auth.uid());

drop policy if exists "products read all" on public.products;
create policy "products read all" on public.products
for select using (true);

drop policy if exists "vendor manage own products" on public.products;
create policy "vendor manage own products" on public.products
for all using (
  exists (
    select 1 from public.vendors v
    where v.id = products.vendor_id and v.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.vendors v
    where v.id = products.vendor_id and v.owner_user_id = auth.uid()
  )
);

drop policy if exists "albums read all" on public.product_albums;
create policy "albums read all" on public.product_albums
for select using (true);

drop policy if exists "vendor manage own albums" on public.product_albums;
create policy "vendor manage own albums" on public.product_albums
for all using (
  exists (
    select 1
    from public.products p
    join public.vendors v on v.id = p.vendor_id
    where p.id = product_albums.product_id and v.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.products p
    join public.vendors v on v.id = p.vendor_id
    where p.id = product_albums.product_id and v.owner_user_id = auth.uid()
  )
);

drop policy if exists "images read all" on public.product_album_images;
create policy "images read all" on public.product_album_images
for select using (true);

drop policy if exists "vendor manage own images" on public.product_album_images;
create policy "vendor manage own images" on public.product_album_images
for all using (
  exists (
    select 1
    from public.product_albums a
    join public.products p on p.id = a.product_id
    join public.vendors v on v.id = p.vendor_id
    where a.id = product_album_images.album_id and v.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.product_albums a
    join public.products p on p.id = a.product_id
    join public.vendors v on v.id = p.vendor_id
    where a.id = product_album_images.album_id and v.owner_user_id = auth.uid()
  )
);

drop policy if exists "vendor read own custom orders" on public.custom_orders;
create policy "vendor read own custom orders" on public.custom_orders
for select using (
  exists (
    select 1 from public.vendors v
    where v.id = custom_orders.vendor_id and v.owner_user_id = auth.uid()
  )
);

drop policy if exists "client create custom orders" on public.custom_orders;
create policy "client create custom orders" on public.custom_orders
for insert with check (
  auth.uid() is not null and
  (client_user_id = auth.uid() or client_user_id is null)
);
