DROP POLICY IF EXISTS "Anyone can read active influencers for validation" ON public.influencers;

CREATE OR REPLACE FUNCTION public.validate_promo_code(_promo_code text)
RETURNS TABLE(promo_code text, discount_percent integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.promo_code, i.discount_percent
  FROM public.influencers i
  WHERE i.is_active = true
    AND upper(i.promo_code) = upper(trim(_promo_code))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.validate_promo_code(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.influencer_login(_promo_code text, _email text, _phone text)
RETURNS TABLE(full_name text, promo_code text, discount_percent integer, revenue_share_percent numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.influencers%ROWTYPE;
  stored_digits text;
  input_digits text;
BEGIN
  SELECT * INTO rec
  FROM public.influencers i
  WHERE upper(i.promo_code) = upper(trim(_promo_code))
    AND lower(i.email) = lower(trim(_email))
    AND i.is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF rec.phone IS NOT NULL AND length(regexp_replace(coalesce(rec.phone,''), '\D', '', 'g')) >= 9 THEN
    stored_digits := right(regexp_replace(rec.phone, '\D', '', 'g'), 9);
    input_digits := right(regexp_replace(coalesce(_phone,''), '\D', '', 'g'), 9);
    IF stored_digits <> input_digits THEN
      RETURN;
    END IF;
  END IF;

  RETURN QUERY SELECT rec.full_name, rec.promo_code, rec.discount_percent, rec.revenue_share_percent;
END;
$$;

GRANT EXECUTE ON FUNCTION public.influencer_login(text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.influencer_payments(_promo_code text, _email text, _phone text)
RETURNS TABLE(name text, email text, amount numeric, currency text, status text, created_at timestamptz, promo_code text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ok boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.influencer_login(_promo_code, _email, _phone)) INTO ok;
  IF NOT ok THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.name, p.email, p.amount, p.currency, p.status, p.created_at, p.promo_code
  FROM public.payments p
  WHERE p.status = 'completed'
    AND upper(coalesce(p.promo_code,'')) = upper(trim(_promo_code))
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.influencer_payments(text, text, text) TO anon, authenticated;