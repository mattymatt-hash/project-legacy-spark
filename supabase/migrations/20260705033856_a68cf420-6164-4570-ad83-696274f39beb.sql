
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_amount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_refund_id text;

-- Tighten review policies: buyer may review only while order is paid or fulfilled
-- (not refunded/cancelled/pending).
DROP POLICY IF EXISTS "Buyer can insert review for paid order" ON public.reviews;
CREATE POLICY "Buyer can insert review for paid order"
ON public.reviews FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = buyer_id
  AND EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.id = reviews.order_id
      AND o.buyer_id = auth.uid()
      AND o.status IN ('paid'::order_status, 'fulfilled'::order_status)
      AND oi.listing_id = reviews.listing_id
  )
);

DROP POLICY IF EXISTS "Buyer can update own review" ON public.reviews;
CREATE POLICY "Buyer can update own review"
ON public.reviews FOR UPDATE TO authenticated
USING (auth.uid() = buyer_id)
WITH CHECK (
  auth.uid() = buyer_id
  AND EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.id = reviews.order_id
      AND o.buyer_id = auth.uid()
      AND o.status IN ('paid'::order_status, 'fulfilled'::order_status)
      AND oi.listing_id = reviews.listing_id
  )
);
