CREATE TABLE public.apk_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  user_id uuid,
  user_agent text,
  platform text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.apk_downloads TO authenticated;
GRANT ALL ON public.apk_downloads TO service_role;

ALTER TABLE public.apk_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read apk downloads"
ON public.apk_downloads FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));