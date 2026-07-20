-- Storefront resolution needs anon SELECT on active tenants (public data: name/slug/plan/status).
CREATE POLICY "Storefront resolution — active tenants are publicly visible"
  ON public.tenants FOR SELECT TO anon
  USING (status = 'active');

-- Also allow authenticated users to see active tenants (for onboarding slug checks, storefront browsing while signed in).
CREATE POLICY "Storefront resolution — active tenants visible to authenticated"
  ON public.tenants FOR SELECT TO authenticated
  USING (status = 'active');