-- Reconcile production after the initial whatsapp_runtime_accounts migration.
-- Metadata is non-secret; provider credentials remain server-only in Vercel.

BEGIN;

DROP POLICY IF EXISTS "WhatsApp runtime staff insert" ON public.whatsapp_runtime_accounts;
CREATE POLICY "WhatsApp runtime staff insert"
  ON public.whatsapp_runtime_accounts
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );

DROP POLICY IF EXISTS "WhatsApp runtime staff update" ON public.whatsapp_runtime_accounts;
CREATE POLICY "WhatsApp runtime staff update"
  ON public.whatsapp_runtime_accounts
  FOR UPDATE TO authenticated
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

REVOKE ALL ON public.whatsapp_runtime_accounts FROM anon;
REVOKE ALL ON public.whatsapp_runtime_accounts FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.whatsapp_runtime_accounts TO authenticated;
GRANT ALL ON public.whatsapp_runtime_accounts TO service_role;

COMMIT;
