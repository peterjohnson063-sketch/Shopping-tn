-- After admin deletes public.users, Supabase Dashboard → Authentication still listed
-- those users because auth.users was never removed. This migration:
-- 1) Extends delete_user_cascade to delete auth.users when id is a UUID.
-- 2) Adds delete_auth_if_no_public_profile(uid) for the REST DELETE fallback (hard delete),
--    callable only when the profile row is already gone so sign-in identities are wiped too.

-- Safe RPC for the browser client after a successful REST DELETE on public.users
create or replace function public.delete_auth_if_no_public_profile(uid text)
returns json
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid_text text := nullif(trim(coalesce(uid, '')), '');
  v_uid_uuid uuid;
  v_n int := 0;
begin
  if v_uid_text is null then
    return json_build_object('auth_deleted', 0);
  end if;

  begin
    v_uid_uuid := v_uid_text::uuid;
  exception when others then
    return json_build_object('auth_deleted', 0);
  end;

  if exists (select 1 from public.users where id::text = v_uid_text limit 1) then
    return json_build_object('auth_deleted', 0, 'reason', 'profile_still_exists');
  end if;

  begin
    delete from auth.users where id = v_uid_uuid;
    get diagnostics v_n = row_count;
  exception when others then
    v_n := 0;
  end;

  return json_build_object('auth_deleted', v_n);
end;
$fn$;

revoke all on function public.delete_auth_if_no_public_profile(text) from public;
grant execute on function public.delete_auth_if_no_public_profile(text) to anon;
grant execute on function public.delete_auth_if_no_public_profile(text) to authenticated;

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
  v_auth_deleted int := 0;
begin
  if v_uid_text is null then
    raise exception 'delete_user_cascade: empty user id';
  end if;

  begin
    v_uid_uuid := v_uid_text::uuid;
  exception when others then
    v_uid_uuid := null;
  end;

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

  begin
    delete from public.products
     where vendor_id::text = v_uid_text;
    get diagnostics v_products_deleted = row_count;
  exception when others then
    v_products_deleted := 0;
  end;

  begin
    delete from public.support_messages
     where client_id = v_uid_text
        or staff_id  = v_uid_text;
    get diagnostics v_support_deleted = row_count;
  exception when others then
    v_support_deleted := 0;
  end;

  begin
    delete from public.admin_alerts
     where user_id::text = v_uid_text
        or payload->>'client_id' = v_uid_text;
    get diagnostics v_alerts_deleted = row_count;
  exception when others then
    v_alerts_deleted := 0;
  end;

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

  begin
    update public.product_reviews
       set user_id = null
     where user_id::text = v_uid_text;
  exception when others then
    execute 'SELECT 1';
  end;

  delete from public.users
   where id::text = v_uid_text
     and coalesce(role, '') <> 'admin';
  get diagnostics v_user_deleted = row_count;

  if v_user_deleted = 0 then
    raise exception 'delete_user_cascade: user % not found or admin protected', v_uid_text;
  end if;

  if v_uid_uuid is not null then
    begin
      delete from auth.users where id = v_uid_uuid;
      get diagnostics v_auth_deleted = row_count;
    exception when others then
      v_auth_deleted := 0;
    end;
  end if;

  return json_build_object(
    'user_id', v_uid_text,
    'products_deleted', v_products_deleted,
    'support_deleted', v_support_deleted,
    'admin_alerts_deleted', v_alerts_deleted,
    'user_deleted', v_user_deleted,
    'auth_deleted', v_auth_deleted
  );
end;
$fn$;

revoke all on function public.delete_user_cascade(text) from public;
grant execute on function public.delete_user_cascade(text) to anon;
grant execute on function public.delete_user_cascade(text) to authenticated;

notify pgrst, 'reload schema';
