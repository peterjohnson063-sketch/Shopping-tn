-- Allow vendor product edits from current frontend (anon key PATCH requests).
-- Apply in Supabase SQL editor or via migration runner.
--
-- NOTE: This is demo-style permissive access (matches existing users demo policies).
-- In production, replace with authenticated JWT + vendor ownership policy.

grant select, insert, update, delete on table public.products to anon;
grant select, insert, update, delete on table public.products to authenticated;

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'products'
      and c.relrowsecurity = true
  ) then
    execute 'drop policy if exists "products_anon_update_demo" on public.products';
    execute $pol$
      create policy "products_anon_update_demo"
      on public.products
      for update
      to anon, authenticated
      using (true)
      with check (true)
    $pol$;
  end if;
end $$;

notify pgrst, 'reload schema';
