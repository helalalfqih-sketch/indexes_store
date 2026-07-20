
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS external_id  text,
  ADD COLUMN IF NOT EXISTS availability text,
  ADD COLUMN IF NOT EXISTS condition    text,
  ADD COLUMN IF NOT EXISTS source_url   text;

CREATE UNIQUE INDEX IF NOT EXISTS products_tenant_external_id_key
  ON public.products (tenant_id, external_id)
  WHERE external_id IS NOT NULL;
