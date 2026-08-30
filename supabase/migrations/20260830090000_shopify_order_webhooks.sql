BEGIN;

ALTER TABLE public.webhook_events DROP CONSTRAINT IF EXISTS webhook_events_provider_check;
ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_provider_check
  CHECK (provider IN ('whatsapp', 'stripe', 'meta', 'shopify', 'other'));

CREATE TABLE IF NOT EXISTS public.shopify_order_events (
  shopify_order_id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_name TEXT NOT NULL,
  customer_shopify_id TEXT,
  customer_email TEXT,
  financial_status TEXT,
  fulfillment_status TEXT,
  currency_code TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payload JSONB NOT NULL,
  shopify_created_at TIMESTAMPTZ,
  shopify_updated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shopify_order_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shopify_order_events FROM anon, authenticated;
CREATE POLICY "service_role_shopify_order_events" ON public.shopify_order_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS shopify_order_events_tenant_updated_idx
  ON public.shopify_order_events(tenant_id, shopify_updated_at DESC);

COMMIT;
