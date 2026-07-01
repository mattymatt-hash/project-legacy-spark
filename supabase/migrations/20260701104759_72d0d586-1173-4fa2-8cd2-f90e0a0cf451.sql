DROP POLICY IF EXISTS "Buyer can update own review" ON public.reviews;

CREATE POLICY "Buyer can update own review"
ON public.reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = buyer_id)
WITH CHECK (
  auth.uid() = buyer_id
  AND EXISTS (
    SELECT 1
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.id = reviews.order_id
      AND o.buyer_id = auth.uid()
      AND o.status = 'paid'
      AND oi.listing_id = reviews.listing_id
  )
);