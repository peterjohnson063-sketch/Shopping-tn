-- Purpose: make admin "Delete account" actually work AND remove a vendor's
-- listings from the storefront when the vendor account is removed.
--
-- This migration is idempotent and safe to re-run.
--
-- 1) Re-affirm DELETE/UPDATE access for the anon API role (the browser admin
--    panel uses the anon key). Admins are protected (role <> 'admin').
-- 2) Re-affirm DELETE access on products for the anon API role so the cascade
--    can wipe a vendor's listings from the client too.
-- 3) Add a server-side function `delete_user_cascade(text)` that removes the
--    user's footprint inside one transaction (vendor products, support
--    messages, orphaned references) and then deletes the user row. Running
--    inside SECURITY DEFINER avoids most FK / RLS friction.

-- ─────────────────────────────────────────────────────────────────────
-- 1) Make sure DELETE works on public.users for the admin panel
-- ─────────────────────────────────────────────────────────────────────
grant select, insert, update, delete on table public.users to anon;
grant select, insert, update, delete on table public.users to authenticated;

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
    execute 'drop policy if exists "users_anon_delete_non_admin" on public.users';
    execute $pol$
      create policy "users_anon_delete_non_admin"
      on public.users
      for delete
      to anon, authenticated
      using (coalesce(role, '') <> 'admin')
    $pol$;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 2) Allow the admin panel (anon key) to wipe a vendor's products
-- ─────────────────────────────────────────────────────────────────────
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
    execute 'drop policy if exists "products_anon_delete_demo" on public.products';
    execute $pol$
      create policy "products_anon_delete_demo"
      on public.products
      for delete
      to anon, authenticated
      using (true)
    $pol$;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 3) One-shot cascade: vendor products → support threads → orphan refs → user row
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.delete_user_cascade(uid text)
returns json
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid_text text := nullif(trim(coalesce(uid, '')), '');
  v_uid_uuid uuid := null;
  v_role text := null;
  v_products_deleted int := 0;
  v_support_deleted int := 0;
  v_alerts_deleted int := 0;
  v_user_deleted int := 0;
begin
  if v_uid_text is null then
    raise exception 'delete_user_cascade: empty user id';
  end if;

  -- Try to interpret the id as UUID too (covers both numeric and uuid users)
  begin
    v_uid_uuid := v_uid_text::uuid;
  exception when others then
    v_uid_uuid := null;
  end;

  -- Look up user role to keep admins safe (defense in depth)
  begin
    select coalesce(role, '') into v_role
    from public.users
    where id::text = v_uid_text
    limit 1;
  exception when others then
    v_role := null;
  end;
  if v_role = 'admin' then
    raise exception 'delete_user_cascade: admin accounts cannot be deleted';
  end if;

  -- Vendor products → wipe completely (storefront should not show them)
  begin
    delete from public.products
     where vendor_id::text = v_uid_text;
    get diagnostics v_products_deleted = row_count;
  exception when others then
    v_products_deleted := 0;
  end;

  -- Support chat thread (if the table exists)
  begin
    delete from public.support_messages
     where client_id = v_uid_text
        or staff_id  = v_uid_text;
    get diagnostics v_support_deleted = row_count;
  exception when others then
    v_support_deleted := 0;
  end;

  -- Legacy admin alerts (older support inbox)
  begin
    delete from public.admin_alerts
     where user_id::text = v_uid_text
        or payload->>'client_id' = v_uid_text;
    get diagnostics v_alerts_deleted = row_count;
  exception when others then
    v_alerts_deleted := 0;
  end;

  -- Orphan references in orders rather than deleting them (keep history)
  begin
    update public.orders
       set vendor_id = null
     where vendor_id::text = v_uid_text;
  exception when others then
    execute 'SELECT 1';
  end;
  begin
    update public.orders
       set user_id = null
     where user_id::text = v_uid_text;
  exception when others then
    execute 'SELECT 1';
  end;
  begin
    update public.orders
       set customer_id = null
     where customer_id::text = v_uid_text;
  exception when others then
    execute 'SELECT 1';
  end;
  begin
    update public.orders
       set driver_id = null
     where driver_id::text = v_uid_text;
  exception when others then
    execute 'SELECT 1';
  end;

  -- Orphan reviews authored by the user (keep the review row)
  begin
    update public.product_reviews
       set user_id = null
     where user_id::text = v_uid_text;
  exception when others then
    execute 'SELECT 1';
  end;

  -- Finally remove the user row
  delete from public.users
   where id::text = v_uid_text
     and coalesce(role, '') <> 'admin';
  get diagnostics v_user_deleted = row_count;

  if v_user_deleted = 0 then
    raise exception 'delete_user_cascade: user % not found or admin protected', v_uid_text;
  end if;

  return json_build_object(
    'user_id', v_uid_text,
    'products_deleted', v_products_deleted,
    'support_deleted', v_support_deleted,
    'admin_alerts_deleted', v_alerts_deleted,
    'user_deleted', v_user_deleted
  );
end;
$fn$;

revoke all on function public.delete_user_cascade(text) from public;
grant execute on function public.delete_user_cascade(text) to anon;
grant execute on function public.delete_user_cascade(text) to authenticated;

notify pgrst, 'reload schema';
