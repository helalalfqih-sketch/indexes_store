-- =========================================================
-- Harden order INSERT security (PR #2 security-review follow-up: F2 + F5)
-- =========================================================
-- All legitimate order creation now flows through the `createOrder` server
-- function (service_role, which bypasses RLS). Direct client-side INSERT into
-- orders / order_items is therefore unnecessary attack surface (fake-order
-- spam, item injection) and is removed at BOTH layers: RLS policies and
-- table-level grants.
--
-- Kept intact:
--   * Customer SELECT policies (own orders / own order items).
--   * Staff/admin SELECT + UPDATE via can_manage_tenant (orders), and the
--     staff-only INSERT policy on order_status_history — so the
--     authenticated role KEEPS table-level UPDATE on orders and INSERT on
--     order_status_history (a policy is useless without its grant).
--   * service_role full access for server functions.
--   * Guest checkout: unaffected — guests create orders via the server
--     function, never by direct table INSERT.

-- 1) Drop client-side INSERT policies (creation is server-function-only now).
DROP POLICY IF EXISTS "Anyone can create orders (guarded)" ON public.orders;
DROP POLICY IF EXISTS "Create items for creatable order (guarded)" ON public.order_items;

-- 2) Revoke write grants from anon (RLS already denies, this is defense-in-depth).
REVOKE INSERT, UPDATE ON public.orders FROM anon;
REVOKE INSERT, UPDATE ON public.order_items FROM anon;
REVOKE INSERT ON public.order_status_history FROM anon;

-- 3) Revoke direct INSERT from authenticated as well — customers create orders
--    through the server function; no authenticated INSERT policy remains on
--    these two tables. (UPDATE on orders stays granted: the staff RLS UPDATE
--    policy depends on it. INSERT on order_status_history stays granted: the
--    staff-only RLS INSERT policy depends on it.)
REVOKE INSERT ON public.orders FROM authenticated;
REVOKE INSERT ON public.order_items FROM authenticated;

-- =========================================================
-- End hardening migration
-- =========================================================
