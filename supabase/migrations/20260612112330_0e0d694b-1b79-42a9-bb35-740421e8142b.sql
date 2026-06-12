
CREATE TYPE public.listing_status AS ENUM ('draft', 'active', 'sold', 'archived');
CREATE TYPE public.listing_condition AS ENUM ('new', 'like_new', 'good', 'vintage');

CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  condition public.listing_condition NOT NULL DEFAULT 'new',
  category text NOT NULL,
  stock integer NOT NULL DEFAULT 1 CHECK (stock >= 0),
  weight_oz numeric(8,2) NOT NULL DEFAULT 8,
  shipping_cents integer NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0),
  status public.listing_status NOT NULL DEFAULT 'active',
  image_urls text[] NOT NULL DEFAULT '{}',
  original_price_cents integer,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);

GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active listings are public"
  ON public.listings FOR SELECT
  USING (status = 'active' OR EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = listings.store_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "Owners insert listings on their store"
  ON public.listings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = listings.store_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "Owners update their listings"
  ON public.listings FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = listings.store_id AND s.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = listings.store_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "Owners delete their listings"
  ON public.listings FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = listings.store_id AND s.owner_id = auth.uid()
  ));

CREATE TRIGGER listings_set_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX listings_store_id_idx ON public.listings (store_id);
CREATE INDEX listings_status_created_idx ON public.listings (status, created_at DESC);
CREATE INDEX listings_category_idx ON public.listings (category);
