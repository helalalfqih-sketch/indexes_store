-- =========================================================
-- P5 — Per-store CMS ACTIVATION (executes the plan documented in 000009)
-- =========================================================
-- Model: layered settings —
--   global rows (tenant_id IS NULL)  = platform defaults (admin-managed)
--   tenant rows (tenant_id = store)  = per-store overrides (owner-managed)
-- Reads merge tenant-over-global per key (in the service layer), so the
-- current single-store deployment keeps working with ZERO data changes.

-- 1) The original UNIQUE(key) constraint blocks per-tenant rows — replace it
--    with a PARTIAL unique index that keeps "one GLOBAL row per key".
--    (The (tenant_id, key) partial unique from 000009 already guards tenant rows.)
DO $$
DECLARE
  _con text;
BEGIN
  SELECT c.conname INTO _con
  FROM pg_constraint c
  WHERE c.conrelid = 'public.storefront_settings'::regclass
    AND c.contype = 'u'
    AND array_length(c.conkey, 1) = 1
    AND c.conkey[1] = (
      SELECT a.attnum FROM pg_attribute a
      WHERE a.attrelid = 'public.storefront_settings'::regclass AND a.attname = 'key'
    );
  IF _con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.storefront_settings DROP CONSTRAINT %I', _con);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS storefront_settings_global_key_uniq
  ON public.storefront_settings(key)
  WHERE tenant_id IS NULL;

-- 2) Store owners manage THEIR OWN tenant's CMS rows. Global rows stay
--    platform-admin-only (the existing admin policies are unchanged; platform
--    admins also pass has_tenant_permission for any tenant row).
DROP POLICY IF EXISTS "Store owners manage own CMS rows" ON public.storefront_settings;
CREATE POLICY "Store owners manage own CMS rows"
  ON public.storefront_settings FOR ALL TO authenticated
  USING (
    tenant_id IS NOT NULL
    AND public.has_tenant_permission(tenant_id, auth.uid(), 'owner'::public.tenant_role)
  )
  WITH CHECK (
    tenant_id IS NOT NULL
    AND public.has_tenant_permission(tenant_id, auth.uid(), 'owner'::public.tenant_role)
  );

-- Public reads: unchanged — the existing public SELECT policy covers tenant
-- rows too, and the column-scoped anon grant (000007) keeps drafts hidden.
