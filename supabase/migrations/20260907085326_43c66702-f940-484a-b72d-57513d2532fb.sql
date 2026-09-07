CREATE POLICY "Admins can delete payments" ON public.payments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert email log" ON public.email_log FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT, INSERT ON public.email_log TO authenticated;
GRANT ALL ON public.email_log TO service_role;
GRANT DELETE ON public.payments TO authenticated;