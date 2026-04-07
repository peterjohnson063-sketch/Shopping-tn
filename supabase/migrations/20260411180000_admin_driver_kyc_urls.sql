-- Staff onboarded drivers: store CIN / licence / portrait image URLs on users.
-- Replaces RPC signatures from 20260410140000_driver_invites_one_time.sql.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS driver_photo_url text;

COMMENT ON COLUMN public.users.driver_photo_url IS 'Staff-uploaded face photo for driver verification (public Storage URL)';

-- Previous 13-arg admin RPC
DROP FUNCTION IF EXISTS public.stn_admin_create_driver(
  text, boolean, text, text, text, text, text, text, text, text, text, text, text
);

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
  p_driver_photo_url text DEFAULT ''
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
    driver_photo_url
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
    nullif(trim(p_driver_photo_url), '')
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

-- Previous 12-arg redeem RPC
DROP FUNCTION IF EXISTS public.stn_redeem_driver_invite(
  text, text, text, text, text, text, text, text, text, text, text, text
);

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
  p_driver_photo_url text DEFAULT ''
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
    driver_photo_url
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
    nullif(trim(p_driver_photo_url), '')
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

GRANT EXECUTE ON FUNCTION public.stn_admin_create_driver(
  text, boolean, text, text, text, text, text, text, text, text, text, text, text, text, text, text
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.stn_redeem_driver_invite(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, text
) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
