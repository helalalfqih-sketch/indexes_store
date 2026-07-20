ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku                text,
  ADD COLUMN IF NOT EXISTS barcode            text,
  ADD COLUMN IF NOT EXISTS compare_at_price   numeric(12,2),
  ADD COLUMN IF NOT EXISTS cost_price          numeric(12,2),
  ADD COLUMN IF NOT EXISTS model_3d_url        text,
  ADD COLUMN IF NOT EXISTS model_3d_thumbnail  text,
  ADD COLUMN IF NOT EXISTS model_3d_status     text DEFAULT 'pending';
