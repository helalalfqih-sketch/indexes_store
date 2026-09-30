-- WhatsApp runtime account metadata for Indexes Store.
-- Target production project: wtudcippyxbaobqzbmok
-- Provider credentials/tokens MUST remain server-only in Vercel and are never stored here.
-- Application writes are service-role only; authenticated staff receive tenant-scoped read access.

BEGIN;

CREATE TABLE IF NOT EXISTS public.whatsapp_runtime_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('whapi')),
  channel_id text NOT NULL,
  phone text NOT NULL,
  display_name text NOT NULL,
  connection_state text NOT NULL DEFAULT 'UNKNOWN',
  authorized boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_runtime_accounts_tenant
  ON public.whatsapp_runtime_accounts (tenant_id, provider);

ALTER TABLE public.whatsapp_runtime_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "WhatsApp runtime staff read" ON public.whatsapp_runtime_accounts;
CREATE POLICY "WhatsApp runtime staff read"
  ON public.whatsapp_runtime_accounts
  FOR SELECT TO authenticated
  USING (
    public.has_tenant_permission(
      tenant_id,
      (SELECT auth.uid()),
      'staff'::public.tenant_role
    )
  );

DROP POLICY IF EXISTS "WhatsApp runtime managers manage" ON public.whatsapp_runtime_accounts;

REVOKE ALL ON public.whatsapp_runtime_accounts FROM anon;
REVOKE ALL ON public.whatsapp_runtime_accounts FROM authenticated;
GRANT SELECT ON public.whatsapp_runtime_accounts TO authenticated;
GRANT ALL ON public.whatsapp_runtime_accounts TO service_role;

COMMIT;
