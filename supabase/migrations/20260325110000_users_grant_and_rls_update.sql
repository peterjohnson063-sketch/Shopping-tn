-- Everest admin panel: approve drivers, verify vendors, ban/timeout (browser uses anon key + PATCH).
-- Apply in Supabase SQL Editor or: supabase db push
--
-- 1) Ensure API roles can UPDATE public.users (RLS may still block without a policy).
grant update on table public.users to anon;
grant update on table public.users to authenticated;

-- 2) If RLS is enabled on public.users, allow UPDATE for anon/authenticated (demo-style).
--    If RLS is off, this block is skipped so we do not enable RLS by accident.
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'users'
      and c.relrowsecurity = true
  ) then
    execute 'drop policy if exists "users_anon_update_demo" on public.users';
    execute $pol$
      create policy "users_anon_update_demo"
      on public.users
      for update
      to anon, authenticated
      using (true)
      with check (true)
    $pol$;
  end if;
end $$;
