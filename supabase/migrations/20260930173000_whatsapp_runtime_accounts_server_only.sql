-- Finalize WhatsApp runtime metadata writes as server-only.
-- Whapi credentials remain in Vercel; authenticated staff may only read tenant-scoped metadata.

BEGIN;

DROP POLICY IF EXISTS "WhatsApp runtime staff insert" ON public.whatsapp_runtime_accounts;
DROP POLICY IF EXISTS "WhatsApp runtime staff update" ON public.whatsapp_runtime_accounts;

REVOKE ALL ON public.whatsapp_runtime_accounts FROM anon;
REVOKE ALL ON public.whatsapp_runtime_accounts FROM authenticated;
GRANT SELECT ON public.whatsapp_runtime_accounts TO authenticated;
GRANT ALL ON public.whatsapp_runtime_accounts TO service_role;

COMMIT;
