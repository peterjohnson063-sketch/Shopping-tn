-- Vehicle photo URL for staff-onboarded drivers (with existing KYC URLs).
-- Drops every overload of the RPCs first (avoids "function name is not unique" / wrong signature).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS driver_photo_url text;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS vehicle_photo_url text;

COMMENT ON COLUMN public.users.driver_photo_url IS 'Staff-uploaded face photo (public Storage URL)';
COMMENT ON COLUMN public.users.vehicle_photo_url IS 'Staff-uploaded vehicle image (public Storage URL)';

-- Drop every overload (regprocedure text can be ambiguous in some clients; use arg types).
DO $dropall$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      quote_ident(n.nspname) || '.' || quote_ident(p.proname) || '('
        || pg_catalog.oidvectortypes(p.proargtypes) || ')' AS drop_cmd
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'stn_admin_create_driver'
      AND p.prokind = 'f'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.drop_cmd || ' CASCADE';
  END LOOP;
  FOR r IN
    SELECT
      quote_ident(n.nspname) || '.' || quote_ident(p.proname) || '('
        || pg_catalog.oidvectortypes(p.proargtypes) || ')' AS drop_cmd
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'stn_redeem_driver_invite'
      AND p.prokind = 'f'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.drop_cmd || ' CASCADE';
  END LOOP;
END
$dropall$;

CREATE OR REPLACE FUNCTION public.stn_admin_create_driver(
  p_ops_secret text,
  p_approve_immediate boolean,
  p_email text,
  p_password text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_wilaya text,
  p_delegation text,
  p_id_card text DEFAULT '',
  p_plate text DEFAULT '',
  p_vmodel text DEFAULT '',
  p_vcolor text DEFAULT '',
  p_cin_doc_url text DEFAULT '',
  p_license_doc_url text DEFAULT '',
  p_driver_photo_url text DEFAULT '',
  p_vehicle_photo_url text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE
  v_secret text;
  v_new_id text;
  v_appr boolean;
BEGIN
  SELECT invite_ops_secret INTO v_secret FROM public.stn_driver_invite_settings WHERE id = 1;
  IF v_secret IS NULL OR p_ops_secret IS DISTINCT FROM v_secret THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_secret');
  END IF;

  v_appr := COALESCE(p_approve_immediate, false);

  IF EXISTS (SELECT 1 FROM public.users WHERE lower(trim(email)) = lower(trim(p_email))) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'email_exists');
  END IF;

  PERFORM set_config('app.stn_driver_sql_gate', '1', true);

  INSERT INTO public.users (
    email,
    password,
    first_name,
    last_name,
    phone,
    wilaya,
    delegation,
    role,
    points,
    verified,
    is_verified,
    avatar,
    shop_name,
    specialty,
    id_card_number,
    vehicle_plate_number,
    vehicle_model,
    vehicle_color,
    cin_document_url,
    license_document_url,
    driver_photo_url,
    vehicle_photo_url
  ) VALUES (
    lower(trim(p_email)),
    p_password,
    trim(p_first_name),
    trim(p_last_name),
    trim(p_phone),
    trim(p_wilaya),
    trim(p_delegation),
    'driver',
    100,
    v_appr,
    v_appr,
    '🚚',
    null,
    null,
    nullif(trim(p_id_card), ''),
    nullif(trim(p_plate), ''),
    nullif(trim(p_vmodel), ''),
    nullif(trim(p_vcolor), ''),
    nullif(trim(p_cin_doc_url), ''),
    nullif(trim(p_license_doc_url), ''),
    nullif(trim(p_driver_photo_url), ''),
    nullif(trim(p_vehicle_photo_url), '')
  )
  RETURNING id::text INTO v_new_id;

  RETURN jsonb_build_object('ok', true, 'id', v_new_id);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'email_exists');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insert_failed', 'detail', left(SQLERRM, 200));
END;
$f$;

CREATE OR REPLACE FUNCTION public.stn_redeem_driver_invite(
  p_token text,
  p_email text,
  p_password text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_wilaya text,
  p_delegation text,
  p_id_card text DEFAULT '',
  p_plate text DEFAULT '',
  p_vmodel text DEFAULT '',
  p_vcolor text DEFAULT '',
  p_cin_doc_url text DEFAULT '',
  p_license_doc_url text DEFAULT '',
  p_driver_photo_url text DEFAULT '',
  p_vehicle_photo_url text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE
  v_inv uuid;
  v_new_id text;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_token');
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE lower(trim(email)) = lower(trim(p_email))) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'email_exists');
  END IF;

  UPDATE public.driver_invites
  SET used_at = now()
  WHERE token = trim(p_token)
    AND used_at IS NULL
    AND expires_at > now()
  RETURNING id INTO v_inv;
  IF v_inv IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_used_or_expired');
  END IF;

  PERFORM set_config('app.stn_driver_sql_gate', '1', true);

  INSERT INTO public.users (
    email,
    password,
    first_name,
    last_name,
    phone,
    wilaya,
    delegation,
    role,
    points,
    verified,
    is_verified,
    avatar,
    shop_name,
    specialty,
    id_card_number,
    vehicle_plate_number,
    vehicle_model,
    vehicle_color,
    cin_document_url,
    license_document_url,
    driver_photo_url,
    vehicle_photo_url
  ) VALUES (
    lower(trim(p_email)),
    p_password,
    trim(p_first_name),
    trim(p_last_name),
    trim(p_phone),
    trim(p_wilaya),
    trim(p_delegation),
    'driver',
    100,
    false,
    false,
    '🚚',
    null,
    null,
    nullif(trim(p_id_card), ''),
    nullif(trim(p_plate), ''),
    nullif(trim(p_vmodel), ''),
    nullif(trim(p_vcolor), ''),
    nullif(trim(p_cin_doc_url), ''),
    nullif(trim(p_license_doc_url), ''),
    nullif(trim(p_driver_photo_url), ''),
    nullif(trim(p_vehicle_photo_url), '')
  )
  RETURNING id::text INTO v_new_id;

  RETURN jsonb_build_object('ok', true, 'id', v_new_id);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'email_exists');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insert_failed', 'detail', left(SQLERRM, 200));
END;
$f$;

-- Grant on the exact signature (avoids 42725 when multiple overloads existed before this run).
DO $grants$
DECLARE
  admin_args text;
  redeem_args text;
BEGIN
  SELECT pg_catalog.oidvectortypes(p.proargtypes)
  INTO admin_args
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'stn_admin_create_driver'
  ORDER BY p.oid DESC
  LIMIT 1;

  SELECT pg_catalog.oidvectortypes(p.proargtypes)
  INTO redeem_args
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'stn_redeem_driver_invite'
  ORDER BY p.oid DESC
  LIMIT 1;

  IF admin_args IS NOT NULL THEN
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION public.stn_admin_create_driver(%s) TO anon, authenticated',
      admin_args
    );
  END IF;
  IF redeem_args IS NOT NULL THEN
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION public.stn_redeem_driver_invite(%s) TO anon, authenticated',
      redeem_args
    );
  END IF;
END
$grants$;

NOTIFY pgrst, 'reload schema';
