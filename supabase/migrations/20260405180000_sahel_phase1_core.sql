-- Everest Phase 1 — Sahel launch: vendor onboarding, commission promo, hub QC, universal SKU columns
-- Run after 20260404120000_yasmine_service_routing.sql

-- Vendors: onboarding gate, Sahel verification, first-100 promotion (1% commission)
alter table public.vendors add column if not exists onboarding_status text;
alter table public.vendors add column if not exists commission_rate numeric(8, 5);
alter table public.vendors add column if not exists sahel_verified boolean;
alter table public.vendors add column if not exists sahel_verified_at timestamptz;
alter table public.vendors add column if not exists promotion_slot integer;

alter table public.vendors drop constraint if exists vendors_onboarding_status_check;
alter table public.vendors
  add constraint vendors_onboarding_status_check
  check (onboarding_status is null or onboarding_status in ('inactive', 'pending_verification', 'active'));

-- Existing rows: keep routing working until admin re-classifies (Phase 1 backfill)
update public.vendors
set
  onboarding_status = coalesce(nullif(trim(onboarding_status), ''), 'active'),
  commission_rate = coalesce(commission_rate, 0.01000),
  sahel_verified = coalesce(sahel_verified, true)
where onboarding_status is null or commission_rate is null or sahel_verified is null;

alter table public.vendors alter column onboarding_status set default 'inactive';
alter table public.vendors alter column onboarding_status set not null;
alter table public.vendors alter column commission_rate set default 0.01000;
alter table public.vendors alter column commission_rate set not null;
alter table public.vendors alter column sahel_verified set default false;
alter table public.vendors alter column sahel_verified set not null;

comment on column public.vendors.onboarding_status is 'inactive for new signups until admin verifies Sahel location; active = routable';
comment on column public.vendors.commission_rate is '0.01 = 1%; first 100 partners get promo rate';
comment on column public.vendors.promotion_slot is '1–100 cohort; null outside first 100';

create index if not exists idx_vendors_promotion_slot on public.vendors (promotion_slot) where promotion_slot is not null;

-- Products
alter table public.products
  add column if not exists category_id text,
  add column if not exists brand_id text,
  add column if not exists universal_sku text;

create index if not exists idx_products_universal_sku on public.products (universal_sku);

comment on column public.products.universal_sku is 'SAHEL-{CAT}-{BRAND}-{SEQ}-{COLOR}-{SIZE}';

-- Orders: Hub QC
alter table public.orders
  add column if not exists hub_quality_passed_at timestamptz,
  add column if not exists hub_quality_passed_by text;

comment on column public.orders.hub_quality_passed_at is 'Hub staff QC before Everest-branded seal';

notify pgrst, 'reload schema';
