-- Admin panel: DELETE /rest/v1/users?id=eq.<id> from the browser (anon key).
-- Run ONLY if Row Level Security is already enabled on public.users with your other policies.
-- Do NOT run `enable row level security` here unless you know existing policies still allow SELECT/INSERT/UPDATE.

-- Safer variant: only non-admin rows can be deleted via the anon API key.
-- Still risky in production (anyone with the anon key could delete customers/vendors/drivers).
-- Prefer: Edge Function + service_role, or authenticated admin JWT + policy on auth.uid().

drop policy if exists "users_anon_delete_non_admin" on public.users;

create policy "users_anon_delete_non_admin"
on public.users
for delete
to anon
using (coalesce(role, '') <> 'admin');
