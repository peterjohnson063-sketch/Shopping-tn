-- Optional: remove commission columns if you already ran an older Phase 1 migration that added them.
drop index if exists public.idx_vendors_promotion_slot;
alter table public.vendors drop column if exists promotion_slot;
alter table public.vendors drop column if exists commission_rate;

notify pgrst, 'reload schema';
