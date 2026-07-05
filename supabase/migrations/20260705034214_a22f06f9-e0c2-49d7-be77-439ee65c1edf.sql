
-- Restrict anonymous SELECT on stores to non-sensitive columns only.
-- Stripe integration fields must not be readable by unauthenticated clients.

DROP POLICY IF EXISTS "Stores are viewable by everyone" ON public.stores;

CREATE POLICY "Stores are viewable by anon"
ON public.stores FOR SELECT
TO anon
USING (true);

CREATE POLICY "Stores are viewable by authenticated"
ON public.stores FOR SELECT
TO authenticated
USING (true);

-- Column-level grants: anon can only read safe public columns.
REVOKE SELECT ON public.stores FROM anon;
GRANT SELECT (
  id, owner_id, handle, name, bio, logo_url, banner_url,
  created_at, updated_at, rating_avg, rating_count
) ON public.stores TO anon;

-- Authenticated + service_role keep full SELECT (RLS still applies row-wise).
GRANT SELECT ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
