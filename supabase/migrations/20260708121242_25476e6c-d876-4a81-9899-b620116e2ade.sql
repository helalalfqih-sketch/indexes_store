
DROP INDEX IF EXISTS public.products_tenant_external_id_key;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_tenant_external_id_key;

ALTER TABLE public.products
  ADD CONSTRAINT products_tenant_external_id_key
  UNIQUE (tenant_id, external_id);
