CREATE TABLE IF NOT EXISTS public.request_rate_limits (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bucket text NOT NULL,
  subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS request_rate_limits_lookup ON public.request_rate_limits (bucket, subject, created_at DESC);
ALTER TABLE public.request_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.request_rate_limits FROM anon, authenticated;
GRANT ALL ON public.request_rate_limits TO service_role;

-- Records one attempt and reports whether the subject is still within its limit.
-- Once max_hits is reached inside window_seconds, the subject stays blocked for block_seconds from the last allowed hit.
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_bucket text, p_subject text, p_max integer, p_window_seconds integer, p_block_seconds integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_last timestamptz;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_bucket || ':' || p_subject));
  SELECT count(*), max(created_at) INTO v_count, v_last
  FROM public.request_rate_limits
  WHERE bucket = p_bucket AND subject = p_subject
    AND created_at > now() - make_interval(secs => greatest(p_window_seconds, p_block_seconds));
  IF v_count >= p_max AND v_last > now() - make_interval(secs => p_block_seconds) THEN
    RETURN jsonb_build_object('allowed', false, 'remaining', 0,
      'retry_after', ceil(extract(epoch FROM (v_last + make_interval(secs => p_block_seconds) - now())))::int);
  END IF;
  IF v_count >= p_max THEN
    DELETE FROM public.request_rate_limits WHERE bucket = p_bucket AND subject = p_subject;
    v_count := 0;
  END IF;
  INSERT INTO public.request_rate_limits (bucket, subject) VALUES (p_bucket, p_subject);
  DELETE FROM public.request_rate_limits WHERE created_at < now() - interval '1 day' AND random() < 0.02;
  RETURN jsonb_build_object('allowed', true, 'remaining', p_max - v_count - 1, 'retry_after', 0);
END;
$$;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer, integer) TO service_role;