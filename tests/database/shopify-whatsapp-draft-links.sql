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

-- Transactional fixtures are rolled back after uniqueness checks.
BEGIN;
INSERT INTO public.tenants(id, status) VALUES
  ('11111111-1111-4111-8111-111111111111', 'active'),
  ('22222222-2222-4222-8222-222222222222', 'active');
INSERT INTO public.orders(
  id,tenant_id,customer_name,customer_phone,customer_address,
  status,payment_status,total,currency
) VALUES
  ('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111',
   'Fixture','000000000','Fixture address','pending','pending',9500,'YER'),
  ('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222',
   'Fixture','000000000','Fixture address','pending','pending',9500,'YER');
INSERT INTO public.shopify_whatsapp_draft_links(order_id,tenant_id,status) VALUES (
  '33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','creating'
);
DO $$
DECLARE saw_duplicate boolean := false;
DECLARE saw_tenant_error boolean := false;
BEGIN
  BEGIN
    INSERT INTO public.shopify_whatsapp_draft_links(order_id,tenant_id,status)
    VALUES('33333333-3333-4333-8333-333333333333',
           '11111111-1111-4111-8111-111111111111','creating');
  EXCEPTION WHEN unique_violation THEN saw_duplicate := true;
  END;
  IF NOT saw_duplicate THEN RAISE EXCEPTION 'Duplicate claim allowed'; END IF;
  BEGIN
    INSERT INTO public.shopify_whatsapp_draft_links(order_id,tenant_id,status)
    VALUES('44444444-4444-4444-8444-444444444444',
           '11111111-1111-4111-8111-111111111111','creating');
  EXCEPTION WHEN foreign_key_violation THEN saw_tenant_error := true;
  END;
  IF NOT saw_tenant_error THEN RAISE EXCEPTION 'Cross-tenant claim allowed'; END IF;
END
$$;
ROLLBACK;
