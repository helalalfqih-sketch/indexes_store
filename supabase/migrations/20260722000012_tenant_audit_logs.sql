-- =========================================================
-- Store audit log (Admin Store Management) — append-only
-- =========================================================
-- Tracks store-level administrative events: permission changes, status
-- changes, plan changes, profile/configuration updates.
-- Append-only ledger: NO UPDATE/DELETE policies will ever exist.

CREATE TABLE IF NOT EXISTS public.tenant_audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email  text,
  action       text NOT NULL,          -- e.g. status_change | plan_change | member_upsert | member_remove | profile_update | setting_update
  details      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_audit_tenant ON public.tenant_audit_logs(tenant_id, created_at DESC);

ALTER TABLE public.tenant_audit_logs ENABLE ROW LEVEL SECURITY;

-- Platform admins + the store's own members may read its audit trail.
DROP POLICY IF EXISTS "Admins and members view store audit" ON public.tenant_audit_logs;
CREATE POLICY "Admins and members view store audit"
  ON public.tenant_audit_logs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_tenant_permission(tenant_id, auth.uid(), 'viewer'::public.tenant_role)
  );

-- Writes: platform admins only (admin server functions with RLS client).
DROP POLICY IF EXISTS "Admins insert store audit" ON public.tenant_audit_logs;
CREATE POLICY "Admins insert store audit"
  ON public.tenant_audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

GRANT SELECT, INSERT ON public.tenant_audit_logs TO authenticated;
GRANT ALL ON public.tenant_audit_logs TO service_role;
REVOKE ALL ON public.tenant_audit_logs FROM anon;
