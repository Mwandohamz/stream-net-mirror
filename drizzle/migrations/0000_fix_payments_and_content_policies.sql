DROP POLICY IF EXISTS "Users can read own payment by email" ON public.payments;
CREATE POLICY "Users can read own payment by email" ON public.payments FOR SELECT TO authenticated
USING (user_id = auth.uid() OR lower(email) = lower(coalesce((SELECT auth.jwt() ->> 'email'), '')));

DROP POLICY IF EXISTS "Anyone can read active categories" ON public.content_categories;
CREATE POLICY "Anyone can read active categories" ON public.content_categories FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins read all categories" ON public.content_categories FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));