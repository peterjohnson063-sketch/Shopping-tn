-- Dashboard delete on public.users fails while orders.user_id still references that row
-- (FK orders_user_id_fkey). Match delete_user_cascade: orphan orders.user_id on user delete.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'user_id'
  ) then
    alter table public.orders drop constraint if exists orders_user_id_fkey;

    begin
      alter table public.orders alter column user_id drop not null;
    exception when others then
      execute 'SELECT 1';
    end;

    alter table public.orders
      add constraint orders_user_id_fkey
      foreign key (user_id) references public.users (id) on delete set null;
  end if;
end $$;

notify pgrst, 'reload schema';
