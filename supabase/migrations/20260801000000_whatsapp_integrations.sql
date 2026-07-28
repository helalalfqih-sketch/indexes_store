-- Phase 8: Database Migrations for WhatsApp Webhooks Security

-- 1. Create whatsapp_integrations table for tenant mapping
CREATE TABLE IF NOT EXISTS public.whatsapp_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  waba_id text NOT NULL UNIQUE,
  phone_number_id text,
  app_secret text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.whatsapp_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage whatsapp integrations"
  ON public.whatsapp_integrations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Tenant owners can read their whatsapp integrations"
  ON public.whatsapp_integrations
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tm.tenant_id FROM public.tenant_members tm
      WHERE tm.user_id = auth.uid()
    )
  );

-- 2. Create whatsapp_webhook_events table for idempotency
CREATE TABLE IF NOT EXISTS public.whatsapp_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  message_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'processed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;
