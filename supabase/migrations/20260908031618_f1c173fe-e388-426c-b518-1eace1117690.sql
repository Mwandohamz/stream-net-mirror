CREATE TABLE public.content_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.content_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_categories TO authenticated;
GRANT ALL ON public.content_categories TO service_role;
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active categories" ON public.content_categories FOR SELECT TO anon, authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage categories" ON public.content_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_content_categories_updated_at BEFORE UPDATE ON public.content_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.content_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.content_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  url text NOT NULL,
  logo_url text,
  platform text NOT NULL DEFAULT 'web',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.content_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_links TO authenticated;
GRANT ALL ON public.content_links TO service_role;
ALTER TABLE public.content_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active links" ON public.content_links FOR SELECT TO anon, authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage links" ON public.content_links FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_content_links_category ON public.content_links(category_id, sort_order);
CREATE TRIGGER update_content_links_updated_at BEFORE UPDATE ON public.content_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS category_slugs text[] NOT NULL DEFAULT ARRAY['netmirror']::text[];
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

INSERT INTO public.content_categories (slug, name, description, icon, sort_order) VALUES
  ('netmirror', 'NetMirror Streaming', 'Verified NetMirror portal links and the Android app, giving you Netflix, Disney+, HBO Max and 50+ more platforms in one place.', 'Clapperboard', 1),
  ('live-sports', 'Live Sports', 'We find, verify and maintain free live football streaming links so you can watch UEFA Champions League, Premier League, LaLiga, Bundesliga and Sky Sports Football from anywhere in the world. We do the dirty work and keep the links working; the streams themselves are run by third parties, so we provide support but are not responsible for those sites.', 'Trophy', 2),
  ('downloads', 'Movie Downloads', 'Links and software tools for downloading movies and shows — with guides for getting the best results safely.', 'Download', 3)
ON CONFLICT (slug) DO NOTHING;