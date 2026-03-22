-- Driver KYC + vehicle on app users table (Everest REST uses public.users)
alter table public.users
  add column if not exists id_card_number text,
  add column if not exists vehicle_plate_number text,
  add column if not exists vehicle_model text,
  add column if not exists vehicle_color text,
  add column if not exists cin_document_url text,
  add column if not exists license_document_url text,
  add column if not exists is_verified boolean;

comment on column public.users.id_card_number is 'Tunisia CIN (national ID)';
comment on column public.users.cin_document_url is 'Stored image URL (Storage) or data URL for admin review';
comment on column public.users.license_document_url is 'Driving licence image URL';
comment on column public.users.is_verified is 'false for new drivers until admin approves documents';

-- Mirror onto public.profiles when that table exists (Supabase Auth pattern)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    alter table public.profiles
      add column if not exists id_card_number text,
      add column if not exists vehicle_plate_number text,
      add column if not exists vehicle_model text,
      add column if not exists vehicle_color text,
      add column if not exists cin_document_url text,
      add column if not exists license_document_url text,
      add column if not exists is_verified boolean;
  end if;
end $$;

-- New drivers: require admin (run once or via trigger — optional)
-- update public.users set is_verified = false where role = 'driver' and is_verified is null;
