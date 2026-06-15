REVOKE ALL ON FUNCTION public.recalc_review_aggregates(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reviews_aggregate_trigger() FROM PUBLIC, anon, authenticated;