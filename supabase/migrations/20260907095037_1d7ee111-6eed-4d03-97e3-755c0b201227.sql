-- 1) Influencer real credential
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS password_hash text;

-- 2) Influencer login using a hashed password instead of phone digits
DROP FUNCTION IF EXISTS public.influencer_login(text, text, text);
DROP FUNCTION IF EXISTS public.influencer_payments(text, text, text);

CREATE OR REPLACE FUNCTION public.influencer_login(_promo_code text, _email text, _password text)
RETURNS TABLE(full_name text, promo_code text, discount_percent integer, revenue_share_percent numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  rec public.influencers%ROWTYPE;
BEGIN
  IF _password IS NULL OR length(_password) < 8 THEN
    RETURN;
  END IF;

  SELECT * INTO rec
  FROM public.influencers i
  WHERE upper(i.promo_code) = upper(trim(_promo_code))
    AND lower(i.email) = lower(trim(_email))
    AND i.is_active = true
  LIMIT 1;

  IF NOT FOUND OR rec.password_hash IS NULL THEN
    RETURN;
  END IF;

  IF extensions.crypt(_password, rec.password_hash) <> rec.password_hash THEN
    RETURN;
  END IF;

  RETURN QUERY SELECT rec.full_name, rec.promo_code, rec.discount_percent, rec.revenue_share_percent;
END;
$$;

-- Payments view for influencers: masked customer identity, no raw email/name
CREATE OR REPLACE FUNCTION public.influencer_payments(_promo_code text, _email text, _password text)
RETURNS TABLE(customer text, amount numeric, currency text, status text, created_at timestamp with time zone, promo_code text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  ok boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.influencer_login(_promo_code, _email, _password)) INTO ok;
  IF NOT ok THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    left(coalesce(p.email, 'unknown'), 2) || '***@' || split_part(coalesce(p.email, 'x@x'), '@', 2) AS customer,
    p.amount, p.currency, p.status, p.created_at, p.promo_code
  FROM public.payments p
  WHERE p.status = 'completed'
    AND upper(coalesce(p.promo_code,'')) = upper(trim(_promo_code))
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.influencer_login(text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.influencer_payments(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.influencer_login(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.influencer_payments(text, text, text) TO anon, authenticated;

-- Admin-only helper to set an influencer password (hashed server side)
CREATE OR REPLACE FUNCTION public.set_influencer_password(_influencer_id uuid, _password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _password IS NULL OR length(_password) < 8 THEN
    RAISE EXCEPTION 'password must be at least 8 characters';
  END IF;

  UPDATE public.influencers
  SET password_hash = extensions.crypt(_password, extensions.gen_salt('bf', 10))
  WHERE id = _influencer_id;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.set_influencer_password(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_influencer_password(uuid, text) TO authenticated;

-- validate_promo_code stays public but only for anon/authenticated explicitly
REVOKE ALL ON FUNCTION public.validate_promo_code(text) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(text) TO anon, authenticated;

-- 3) Payments: no client-side inserts at all (server/service role only)
DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;
REVOKE INSERT ON public.payments FROM anon, authenticated;

-- 4) Storage: remove blanket public read of the app-files bucket
DROP POLICY IF EXISTS "Public can read app files" ON storage.objects;

CREATE POLICY "Public can read app downloads"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'app-files'
  AND (
    (storage.foldername(name))[1] = 'avatars'
    OR name ILIKE '%.apk'
  )
);

CREATE POLICY "Admins can read all app files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'app-files' AND public.has_role(auth.uid(), 'admin'));