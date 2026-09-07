REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.set_influencer_password(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_influencer_password(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_influencer_password(uuid, text) TO authenticated, service_role;