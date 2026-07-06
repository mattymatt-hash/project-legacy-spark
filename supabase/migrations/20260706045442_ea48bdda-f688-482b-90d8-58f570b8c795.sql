
-- 1. Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Admin moderation policies
CREATE POLICY "Admins can update any listing"
ON public.listings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any listing"
ON public.listings FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any review"
ON public.reviews FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all stores"
ON public.stores FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Storage RLS for listing-images bucket
CREATE POLICY "Listing images readable by authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'listing-images');

CREATE POLICY "Users upload to their own listing folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listing-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users update their own listing images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listing-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users delete their own listing images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'listing-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
