-- =========================================================
-- Customer Order History — secure authenticated order access
-- =========================================================
-- Goals:
--   * Authenticated customers can read ONLY their own orders/items.
--   * Guest checkout keeps working (orders.user_id stays NULL).
--   * Tenant staff / platform admins keep full access to their tenant's orders.
--   * Remove the insecure `USING (true)` public read that exposed all customer PII.
--   * Never trust a client-provided user_id (enforced in INSERT WITH CHECK + server fns).
--
-- Notes on helpers already present in the schema:
--   can_manage_tenant(_tenant_id, _user_id) = platform admin OR any tenant member.
--   (The spec referenced `has_tenant_permission(...)`, which does not exist; the
--    project-wide convention is can_manage_tenant(...), used here so staff/admin,
--    owners and viewers all keep access.)
-- =========================================================

-- ---------------------------------------------------------
-- PHASE 1 — Schema: add user_id (nullable), FK, index
-- ---------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- FK to auth.users, ON DELETE SET NULL so a deleted account keeps its (now guest) orders.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_fkey'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);

-- ---------------------------------------------------------
-- PHASE 3 — Rebuild RLS policies (orders)
-- Replace the permissive public SELECT with scoped customer + staff policies.
-- Staff access is REBUILT (not removed): they keep read/manage via can_manage_tenant.
-- ---------------------------------------------------------

-- Remove insecure public read (exposed every customer's name/phone/address/email).
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;

-- Customer: read only own orders.
DROP POLICY IF EXISTS "Customers view own orders" ON public.orders;
CREATE POLICY "Customers view own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Staff / admin: read all orders for tenants they manage.
DROP POLICY IF EXISTS "Staff view tenant orders" ON public.orders;
CREATE POLICY "Staff view tenant orders"
  ON public.orders FOR SELECT TO authenticated
  USING (public.can_manage_tenant(tenant_id, auth.uid()));

-- Insert: keep guest + authenticated checkout working, but never allow a spoofed user_id.
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders (guarded)" ON public.orders;
CREATE POLICY "Anyone can create orders (guarded)"
  ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Staff / admin: update orders for tenants they manage (status changes, etc.).
-- (No customer UPDATE/DELETE policy: customers can never mutate orders.)
DROP POLICY IF EXISTS "Staff update tenant orders" ON public.orders;
CREATE POLICY "Staff update tenant orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (public.can_manage_tenant(tenant_id, auth.uid()))
  WITH CHECK (public.can_manage_tenant(tenant_id, auth.uid()));

-- ---------------------------------------------------------
-- PHASE 3 — Rebuild RLS policies (order_items)
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;

-- Customer: read items only for orders they own.
DROP POLICY IF EXISTS "Customers view own order items" ON public.order_items;
CREATE POLICY "Customers view own order items"
  ON public.order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

-- Staff / admin: read items for tenants they manage.
DROP POLICY IF EXISTS "Staff view tenant order items" ON public.order_items;
CREATE POLICY "Staff view tenant order items"
  ON public.order_items FOR SELECT TO authenticated
  USING (public.can_manage_tenant(tenant_id, auth.uid()));

-- Insert: allowed only when the parent order is one the caller could create
-- (guest order with NULL user_id, or the caller's own order). Server fns use the
-- service role, so this is defense-in-depth for any direct client insert.
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Create items for creatable order (guarded)" ON public.order_items;
CREATE POLICY "Create items for creatable order (guarded)"
  ON public.order_items FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id IS NULL OR o.user_id = auth.uid())
    )
  );

-- ---------------------------------------------------------
-- PHASE 3 — Rebuild RLS policies (order_status_history)
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Public can view order status history" ON public.order_status_history;

DROP POLICY IF EXISTS "Customers view own order status history" ON public.order_status_history;
CREATE POLICY "Customers view own order status history"
  ON public.order_status_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_status_history.order_id
        AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff view tenant order status history" ON public.order_status_history;
CREATE POLICY "Staff view tenant order status history"
  ON public.order_status_history FOR SELECT TO authenticated
  USING (public.can_manage_tenant(tenant_id, auth.uid()));

-- Only staff/admin may write status history (service role bypasses RLS for server fns).
DROP POLICY IF EXISTS "Public can insert order status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Staff insert order status history" ON public.order_status_history;
CREATE POLICY "Staff insert order status history"
  ON public.order_status_history FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_tenant(tenant_id, auth.uid()));

-- =========================================================
-- End Customer Order History migration
-- =========================================================
