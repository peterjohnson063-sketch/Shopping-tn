-- OPTIONAL: run only if Ban / Unban / Timeout / soft-delete fail with RLS on public.users.
-- This lets the browser anon key PATCH any row (demo / Everest-style password auth).
-- Replace with proper policies before production.

drop policy if exists "users_anon_update_demo" on public.users;

create policy "users_anon_update_demo"
on public.users
for update
to anon
using (true)
with check (true);
