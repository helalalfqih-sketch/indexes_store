-- =========================================================
-- P3 — store members read their OWN tenant's full catalog
-- =========================================================
-- Gap found during P3 audit: products/categories SELECT policies only allow
-- (published/active) OR platform admin — so a store owner/manager could not
-- see their own DRAFT products in the /store dashboard. Add member-scoped
-- read policies (policies OR together; public storefront behavior unchanged).

DROP POLICY IF EXISTS "Members view own tenant products" ON public.products;
CREATE POLICY "Members view own tenant products"
  ON public.products FOR SELECT TO authenticated
  USING (public.can_manage_tenant(tenant_id, auth.uid()));

DROP POLICY IF EXISTS "Members view own tenant categories" ON public.categories;
CREATE POLICY "Members view own tenant categories"
  ON public.categories FOR SELECT TO authenticated
  USING (public.can_manage_tenant(tenant_id, auth.uid()));
