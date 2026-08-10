-- =====================================================================
-- SECURITY FIX — Close public (anon) read access to orders & order_items
-- =====================================================================
-- Problem:
--   The policies "Public can view orders" and "Public can view order items"
--   used `USING (true)` for the `anon` role. This let ANY unauthenticated
--   visitor read every order row — customer names, phone numbers, addresses
--   and order contents. On a live production storefront this is a customer
--   PII leak.
--
-- Fix:
--   * Drop the permissive public SELECT policies.
--   * Allow SELECT only to tenant staff/owners (platform admins pass through
--     `has_tenant_permission`, which short-circuits to true for `has_role
--     (uid,'admin')`).
--   * Revoke the SELECT/UPDATE grants from `anon` as defense-in-depth.
--
-- Preserved on purpose:
--   * Guest checkout still works — the INSERT policies for anon/authenticated
--     are left untouched, and `submitOrder` does not read the row back
--     (`.insert()` is not chained with `.select()`).
--
-- Notes:
--   * The `orders` table has no `user_id` column today, so a customer
--     "my orders" history cannot be scoped by owner yet. Restoring that
--     feature requires adding `orders.user_id` plus an owner SELECT policy
--     (`user_id = auth.uid()`); tracked as a separate follow-up.
--   * Idempotent & defensive: guarded by `to_regclass`, uses
--     `DROP POLICY IF EXISTS`, and is safe to re-run.
-- =====================================================================

-- ---------- orders ----------
DO $$
BEGIN
  IF to_regclass('public.orders') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY';

    -- Remove the insecure public read policy (the leak).
    EXECUTE 'DROP POLICY IF EXISTS "Public can view orders" ON public.orders';

    -- Staff / owners / platform admins of the tenant may read orders.
    EXECUTE 'DROP POLICY IF EXISTS "Staff view orders" ON public.orders';
    EXECUTE $pol$
      CREATE POLICY "Staff view orders"
        ON public.orders
        FOR SELECT
        TO authenticated
        USING (public.has_tenant_permission(tenant_id, auth.uid(), 'staff'::public.tenant_role))
    $pol$;

    -- Defense-in-depth: anon needs INSERT for guest checkout only, never read/update.
    EXECUTE 'REVOKE SELECT, UPDATE ON public.orders FROM anon';
  END IF;
END $$;

-- ---------- order_items ----------
DO $$
BEGIN
  IF to_regclass('public.order_items') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY';

    -- Remove the insecure public read policy (the leak).
    EXECUTE 'DROP POLICY IF EXISTS "Public can view order items" ON public.order_items';

    -- Staff / owners / platform admins of the tenant may read order items.
    EXECUTE 'DROP POLICY IF EXISTS "Staff view order items" ON public.order_items';
    EXECUTE $pol$
      CREATE POLICY "Staff view order items"
        ON public.order_items
        FOR SELECT
        TO authenticated
        USING (public.has_tenant_permission(tenant_id, auth.uid(), 'staff'::public.tenant_role))
    $pol$;

    -- Defense-in-depth: anon needs INSERT only, never read.
    EXECUTE 'REVOKE SELECT ON public.order_items FROM anon';
  END IF;
END $$;
