-- =========================================================
-- Fix storefront_settings Production Schema & Schema Cache (Idempotent)
-- =========================================================

-- 1. Ensure all required columns exist on public.storefront_settings
ALTER TABLE public.storefront_settings
  ADD COLUMN IF NOT EXISTS draft_value jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS published_value jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2. Ensure permissions are properly granted on all columns
GRANT SELECT, INSERT, UPDATE, DELETE ON public.storefront_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.storefront_settings TO service_role;
GRANT SELECT ON public.storefront_settings TO anon;

-- 3. Ensure partial UNIQUE indexes exist for global and multi-tenant scoping
DO $$
DECLARE
  _con text;
BEGIN
  FOR _con IN (
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.storefront_settings'::regclass
      AND c.contype = 'u'
      AND array_length(c.conkey, 1) = 1
      AND c.conkey[1] = (
        SELECT a.attnum FROM pg_attribute a
        WHERE a.attrelid = 'public.storefront_settings'::regclass AND a.attname = 'key'
      )
  ) LOOP
    EXECUTE format('ALTER TABLE public.storefront_settings DROP CONSTRAINT IF EXISTS %I', _con);
  END LOOP;
END $$;

DROP INDEX IF EXISTS public.storefront_settings_key_key;

CREATE UNIQUE INDEX IF NOT EXISTS storefront_settings_global_key_uniq
  ON public.storefront_settings(key)
  WHERE tenant_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS storefront_settings_tenant_key_uniq
  ON public.storefront_settings(tenant_id, key)
  WHERE tenant_id IS NOT NULL;

-- 4. Explicitly notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
