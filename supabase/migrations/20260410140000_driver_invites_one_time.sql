-- One-time driver invite links + operations secret for admin mint / admin-created drivers.
-- Public signup must NOT insert role=driver directly (trigger); use invite redeem RPC or admin RPC.
--
-- After apply:
--   UPDATE public.stn_driver_invite_settings
--   SET invite_ops_secret = '<long random string>'
--   WHERE id = 1;

CREATE TABLE IF NOT EXISTS public.stn_driver_invite_settings (
  id int PRIMARY KEY DEFAULT 1,
  invite_ops_secret text NOT NULL DEFAULT 'CHANGE_ME_SET_IN_SUPABASE_SQL_EDITOR',
  CONSTRAINT stn_driver_invite_settings_single CHECK (id = 1)
);

INSERT INTO public.stn_driver_invite_settings (id, invite_ops_secret)
VALUES (1, 'CHANGE_ME_SET_IN_SUPABASE_SQL_EDITOR')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.driver_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_driver_invites_token_unused ON public.driver_invites (token) WHERE used_at IS NULL;

ALTER TABLE public.driver_invites ENABLE ROW LEVEL SECURITY;

-- Block direct REST on invites (only SECURITY DEFINER functions touch rows)
REVOKE ALL ON public.driver_invites FROM anon, authenticated;
GRANT SELECT ON public.driver_invites TO postgres;

CREATE OR REPLACE FUNCTION public.stn_enforce_driver_insert_path()
RETURNS trigger
LANGUAGE plpgsql
AS $f$
BEGIN
  IF NEW.role IS NOT NULL AND lower(trim(NEW.role::text)) = 'driver' THEN
    IF current_setting('app.stn_driver_sql_gate', true) IS DISTINCT FROM '1' THEN
      RAISE EXCEPTION 'Driver registration is locked: use a valid invite link or the admin create-driver action.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$f$;

DROP TRIGGER IF EXISTS stn_users_driver_insert_gate ON public.users;
CREATE TRIGGER stn_users_driver_insert_gate
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.stn_enforce_driver_insert_path();

CREATE OR REPLACE FUNCTION public.stn_mint_driver_invite(p_ops_secret text, p_ttl_hours int DEFAULT 168)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $f$
DECLARE
  v_secret text;
  v_tok text;
  v_exp timestamptz;
  v_hours int;
BEGIN
  SELECT invite_ops_secret INTO v_secret FROM public.stn_driver_invite_settings WHERE id = 1;
  IF v_secret IS NULL OR p_ops_secret IS DISTINCT FROM v_secret THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_secret');
  END IF;
  v_hours := COALESCE(p_ttl_hours, 168);
  IF v_hours < 1 OR v_hours > 24 * 90 THEN
    v_hours := 168;
  END IF;
  v_tok := encode(gen_random_bytes(32), 'hex');
  v_exp := now() + (v_hours::text || ' hours')::interval;
  INSERT INTO public.driver_invites (token, expires_at) VALUES (v_tok, v_exp);
  RETURN jsonb_build_object('ok', true, 'token', v_tok, 'expires_at', v_exp);
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
  p_vcolor text DEFAULT ''
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
    vehicle_color
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
    nullif(trim(p_vcolor), '')
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
  p_vcolor text DEFAULT ''
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
    vehicle_color
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
    nullif(trim(p_vcolor), '')
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

GRANT EXECUTE ON FUNCTION public.stn_mint_driver_invite(text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.stn_redeem_driver_invite(text, text, text, text, text, text, text, text, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.stn_admin_create_driver(text, boolean, text, text, text, text, text, text, text, text, text, text, text) TO anon, authenticated;

COMMENT ON TABLE public.driver_invites IS 'One-time driver onboarding links; consumed by stn_redeem_driver_invite';
COMMENT ON FUNCTION public.stn_mint_driver_invite IS 'Admin: new random token; requires invite_ops_secret';
COMMENT ON FUNCTION public.stn_redeem_driver_invite IS 'Public: consume one invite + insert driver (pending verification)';
COMMENT ON FUNCTION public.stn_admin_create_driver IS 'Admin: insert driver without invite; requires invite_ops_secret';

NOTIFY pgrst, 'reload schema';
