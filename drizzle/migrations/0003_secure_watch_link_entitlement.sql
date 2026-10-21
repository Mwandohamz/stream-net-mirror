CREATE OR REPLACE FUNCTION public.resolve_watch_link(p_link_id uuid, p_platform text DEFAULT NULL::text)
RETURNS TABLE(id uuid, title text, url text, embed_mode text, allow_fullscreen boolean, logo_url text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_entitled boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.list_content_links() l
    JOIN public.content_categories c ON c.id = l.category_id
    WHERE l.id = p_link_id AND NULLIF(l.url, '') IS NOT NULL AND c.is_active
      AND c.slug IN ('netmirror', 'live-sports')
  ) INTO v_entitled;
  IF NOT v_entitled THEN RETURN; END IF;
  INSERT INTO public.stream_sessions(user_id, link_id, platform, embed_mode)
    SELECT auth.uid(), p_link_id, p_platform, cl.embed_mode
    FROM public.content_links cl WHERE cl.id = p_link_id AND cl.is_active;
  RETURN QUERY SELECT cl.id, cl.title, cl.url, cl.embed_mode, cl.allow_fullscreen, cl.logo_url
    FROM public.content_links cl WHERE cl.id = p_link_id AND cl.is_active;
END;
$function$;