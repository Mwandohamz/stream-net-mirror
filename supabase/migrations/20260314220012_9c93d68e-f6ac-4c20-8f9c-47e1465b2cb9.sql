
-- Influencer profiles
CREATE TABLE public.influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  promo_code text NOT NULL UNIQUE,
  discount_percent numeric NOT NULL DEFAULT 10,
  revenue_share_percent numeric NOT NULL DEFAULT 20,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage influencers" ON public.influencers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read active influencers for validation" ON public.influencers
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Add promo tracking columns to payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS promo_code text DEFAULT NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS discount_applied numeric DEFAULT 0;
