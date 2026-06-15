-- Reviews & ratings
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, listing_id)
);

CREATE INDEX reviews_listing_idx ON public.reviews(listing_id, created_at DESC);
CREATE INDEX reviews_store_idx ON public.reviews(store_id, created_at DESC);
CREATE INDEX reviews_buyer_idx ON public.reviews(buyer_id);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Reviews are public" ON public.reviews FOR SELECT USING (true);

-- Buyer can write only for their own paid orders containing the listing
CREATE POLICY "Buyer can insert review for paid order" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = buyer_id
    AND EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.order_items oi ON oi.order_id = o.id
      WHERE o.id = reviews.order_id
        AND o.buyer_id = auth.uid()
        AND o.status = 'paid'
        AND oi.listing_id = reviews.listing_id
    )
  );

CREATE POLICY "Buyer can update own review" ON public.reviews
  FOR UPDATE USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyer can delete own review" ON public.reviews
  FOR DELETE USING (auth.uid() = buyer_id);

CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Aggregate columns on listings & stores
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

-- Trigger to maintain aggregates
CREATE OR REPLACE FUNCTION public.recalc_review_aggregates(_listing_id UUID, _store_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listings SET
    rating_avg = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews WHERE listing_id = _listing_id), 0),
    rating_count = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE listing_id = _listing_id), 0)
  WHERE id = _listing_id;

  UPDATE public.stores SET
    rating_avg = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews WHERE store_id = _store_id), 0),
    rating_count = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE store_id = _store_id), 0)
  WHERE id = _store_id;
END; $$;

CREATE OR REPLACE FUNCTION public.reviews_aggregate_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_review_aggregates(OLD.listing_id, OLD.store_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalc_review_aggregates(NEW.listing_id, NEW.store_id);
    IF TG_OP = 'UPDATE' AND (OLD.listing_id <> NEW.listing_id OR OLD.store_id <> NEW.store_id) THEN
      PERFORM public.recalc_review_aggregates(OLD.listing_id, OLD.store_id);
    END IF;
    RETURN NEW;
  END IF;
END; $$;

CREATE TRIGGER reviews_after_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.reviews_aggregate_trigger();