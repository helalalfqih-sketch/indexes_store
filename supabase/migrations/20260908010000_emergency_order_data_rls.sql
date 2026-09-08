-- P0: production drift restored public read/write policies on customer orders.
-- Fail closed at both the table-grant and RLS layers while preserving scoped
-- customer history and tenant-staff order management.

BEGIN;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Customers view own orders" ON public.orders;
DROP POLICY IF EXISTS "Staff view tenant orders" ON public.orders;
DROP POLICY IF EXISTS "Staff update tenant orders" ON public.orders;

DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Create items for creatable order (guarded)" ON public.order_items;
DROP POLICY IF EXISTS "Customers view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff view tenant order items" ON public.order_items;

DROP POLICY IF EXISTS "Public can view order status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Public can insert order status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Customers view own order status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Staff view tenant order status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Staff insert order status history" ON public.order_status_history;

REVOKE ALL ON TABLE public.orders FROM anon, authenticated;
REVOKE ALL ON TABLE public.order_items FROM anon, authenticated;
REVOKE ALL ON TABLE public.order_status_history FROM anon, authenticated;

GRANT SELECT ON TABLE public.orders TO authenticated;
GRANT UPDATE (status, updated_at) ON TABLE public.orders TO authenticated;
GRANT SELECT ON TABLE public.order_items TO authenticated;
GRANT SELECT, INSERT ON TABLE public.order_status_history TO authenticated;

GRANT ALL ON TABLE public.orders TO service_role;
GRANT ALL ON TABLE public.order_items TO service_role;
GRANT ALL ON TABLE public.order_status_history TO service_role;

CREATE POLICY "Customers view own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND user_id = (SELECT auth.uid())
  );

CREATE POLICY "Staff view tenant orders"
  ON public.orders FOR SELECT TO authenticated
  USING (
    public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );

CREATE POLICY "Staff update tenant orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (
    public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  )
  WITH CHECK (
    public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );

CREATE POLICY "Customers view own order items"
  ON public.order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders AS customer_order
      WHERE customer_order.id = order_items.order_id
        AND customer_order.tenant_id = order_items.tenant_id
        AND customer_order.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Staff view tenant order items"
  ON public.order_items FOR SELECT TO authenticated
  USING (
    public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );

CREATE POLICY "Customers view own order status history"
  ON public.order_status_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders AS customer_order
      WHERE customer_order.id = order_status_history.order_id
        AND customer_order.tenant_id = order_status_history.tenant_id
        AND customer_order.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Staff view tenant order status history"
  ON public.order_status_history FOR SELECT TO authenticated
  USING (
    public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );

CREATE POLICY "Staff insert order status history"
  ON public.order_status_history FOR INSERT TO authenticated
  WITH CHECK (
    changed_by = (SELECT auth.uid())
    AND public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
    AND EXISTS (
      SELECT 1
      FROM public.orders AS managed_order
      WHERE managed_order.id = order_status_history.order_id
        AND managed_order.tenant_id = order_status_history.tenant_id
    )
  );

COMMIT;
