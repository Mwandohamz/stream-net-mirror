REVOKE ALL ON public.influencers FROM anon;
REVOKE ALL ON public.influencers FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.influencers TO authenticated;
REVOKE SELECT (password_hash), UPDATE (password_hash) ON public.influencers FROM authenticated;
GRANT ALL ON public.influencers TO service_role;
CREATE POLICY "Deny anonymous access to influencers" ON public.influencers AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);