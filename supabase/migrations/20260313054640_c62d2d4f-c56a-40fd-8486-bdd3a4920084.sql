ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS deposit_id text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'ZMW',
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'ZMB',
  ADD COLUMN IF NOT EXISTS failure_reason text,
  ADD COLUMN IF NOT EXISTS provider_transaction_id text;

CREATE POLICY "Service role can update payments"
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);