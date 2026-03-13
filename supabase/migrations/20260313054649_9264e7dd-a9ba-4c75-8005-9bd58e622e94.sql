DROP POLICY IF EXISTS "Service role can update payments" ON public.payments;

CREATE POLICY "Admins can update payments"
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));