
CREATE OR REPLACE FUNCTION public.has_active_access(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = _user_id
        AND s.status IN ('active','trialing','grace')
        AND (s.current_period_end + make_interval(days => COALESCE(s.grace_days,0))) > now()
    )
    OR EXISTS (
      SELECT 1 FROM public.subscribers sb
      WHERE sb.user_id = _user_id AND sb.status = 'active'
    )
    OR public.has_role(_user_id, 'admin')
  );
$$;
GRANT EXECUTE ON FUNCTION public.has_active_access(uuid) TO anon, authenticated;

ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS member_only boolean NOT NULL DEFAULT false;
UPDATE public.app_settings SET member_only = true
 WHERE key = 'portal_url' OR key = 'apk_file_name' OR key LIKE 'streaming_link%';

DROP POLICY IF EXISTS "Anyone can read settings" ON public.app_settings;
CREATE POLICY "Public settings readable" ON public.app_settings
FOR SELECT TO anon, authenticated
USING (member_only = false OR public.has_active_access(auth.uid()));

DROP POLICY IF EXISTS "Anyone can read active links" ON public.content_links;
CREATE POLICY "Members and admins read links" ON public.content_links
FOR SELECT TO authenticated
USING ((is_active = true AND public.has_active_access(auth.uid())) OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.list_content_links()
RETURNS TABLE(id uuid, category_id uuid, title text, description text, url text,
              logo_url text, platform text, sort_order integer, is_active boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.id, l.category_id, l.title, l.description,
         CASE WHEN public.has_active_access(auth.uid()) THEN l.url ELSE '' END,
         l.logo_url, l.platform, l.sort_order, l.is_active
  FROM public.content_links l
  WHERE l.is_active = true
  ORDER BY l.sort_order;
$$;
GRANT EXECUTE ON FUNCTION public.list_content_links() TO anon, authenticated;
