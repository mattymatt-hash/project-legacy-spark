
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS from_address jsonb;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS weight_oz numeric,
  ADD COLUMN IF NOT EXISTS length_in numeric,
  ADD COLUMN IF NOT EXISTS width_in numeric,
  ADD COLUMN IF NOT EXISTS height_in numeric;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS to_address jsonb,
  ADD COLUMN IF NOT EXISTS easypost_shipment_id text,
  ADD COLUMN IF NOT EXISTS easypost_rate_id text,
  ADD COLUMN IF NOT EXISTS easypost_tracker_id text,
  ADD COLUMN IF NOT EXISTS tracking_code text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS label_url text,
  ADD COLUMN IF NOT EXISTS carrier text,
  ADD COLUMN IF NOT EXISTS service text,
  ADD COLUMN IF NOT EXISTS shipping_status text;
