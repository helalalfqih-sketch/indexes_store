-- Run against an isolated CI fixture only.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE oid = 'public.shopify_whatsapp_draft_links'::regclass AND relrowsecurity
  ) THEN
    RAISE EXCEPTION 'Draft link RLS must be enabled';
  END IF;
  IF has_table_privilege('anon', 'public.shopify_whatsapp_draft_links', 'SELECT')
    OR has_table_privilege('authenticated', 'public.shopify_whatsapp_draft_links', 'INSERT')
  THEN
    RAISE EXCEPTION 'Unexpected public draft link grants';
  END IF;
  IF NOT has_table_privilege('service_role', 'public.shopify_whatsapp_draft_links', 'UPDATE') THEN
    RAISE EXCEPTION 'Service role lacks update access';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shopify_whatsapp_draft_local_order_tenant_fk'
      AND conrelid = 'public.shopify_whatsapp_draft_links'::regclass
  ) THEN
    RAISE EXCEPTION 'Tenant-scoped order reference missing';
  END IF;
END
$$;
