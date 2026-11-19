CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
      AND (_user_id = auth.uid() OR auth.role() = 'service_role' OR auth.uid() IS NULL AND current_user IN ('postgres','supabase_admin'))
  )
$function$;

DROP POLICY IF EXISTS "Users can insert own subscriber row" ON public.subscribers;

DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert valid page views" ON public.page_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(page) BETWEEN 1 AND 500
    AND (referrer IS NULL OR length(referrer) <= 1000)
    AND (user_agent IS NULL OR length(user_agent) <= 500)
    AND (session_id IS NULL OR length(session_id) <= 100)
  );

DROP POLICY IF EXISTS "Avatars bucket public read" ON storage.objects;
CREATE POLICY "Users read own avatar file" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.uid())::text);

DROP POLICY IF EXISTS "Public can view content media" ON storage.objects;
CREATE POLICY "Admins can read content media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'content-media' AND public.has_role(auth.uid(), 'admin'));