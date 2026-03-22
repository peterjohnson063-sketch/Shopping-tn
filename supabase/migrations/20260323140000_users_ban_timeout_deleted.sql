-- Ban / timeout / soft-delete columns for public.users (Everest admin panel + driver app)
alter table public.users
  add column if not exists banned boolean default false,
  add column if not exists ban_reason text,
  add column if not exists banned_at timestamptz,
  add column if not exists timeout_until timestamptz,
  add column if not exists timeout_hours int,
  add column if not exists deleted_at timestamptz;

comment on column public.users.banned is 'Admin rejected / banned; blocks login and driver app';
comment on column public.users.deleted_at is 'Soft-delete timestamp when hard DELETE is not allowed by RLS';

-- If Ban / Unban / Timeout from the admin panel fails with RLS, run this in SQL Editor
-- (only when Row Level Security is already enabled on public.users):
--
-- drop policy if exists "users_anon_update_demo" on public.users;
-- create policy "users_anon_update_demo"
-- on public.users for update to anon using (true) with check (true);
