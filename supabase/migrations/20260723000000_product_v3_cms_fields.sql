-- ============================================================
-- Migration: Product V3 CMS Fields
-- Adds: featured, is_deal, deal_start, deal_end columns
-- Required for the Admin Product Editor CMS deal/featured flags
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS featured   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_deal    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deal_start timestamptz NULL,
  ADD COLUMN IF NOT EXISTS deal_end   timestamptz NULL;

-- Index for fast deal filtering on storefront
CREATE INDEX IF NOT EXISTS idx_products_is_deal     ON public.products (tenant_id, is_deal)   WHERE is_deal = true;
CREATE INDEX IF NOT EXISTS idx_products_featured    ON public.products (tenant_id, featured)   WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (tenant_id, category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug        ON public.products (tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_products_sku         ON public.products (tenant_id, sku)        WHERE sku IS NOT NULL;
