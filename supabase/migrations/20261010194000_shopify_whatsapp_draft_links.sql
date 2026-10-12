-- Deploy only to the verified Indexes Store Supabase project.
-- No exposure to anonymous clients: service_role is the only data API writer.
-- A composite reference prevents mistakenly linking one tenant to another's order.
CREATE UNIQUE INDEX IF NOT EXISTS orders_id_tenant_for_shopify_drafts_idx
  ON public.orders(id, tenant_id);

CREATE TABLE IF NOT EXISTS public.shopify_whatsapp_draft_links (
  order_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  shopify_draft_id text UNIQUE,
  shopify_draft_name text,
  CONSTRAINT shopify_whatsapp_draft_local_order_tenant_fk
    FOREIGN KEY (order_id, tenant_id) REFERENCES public.orders(id, tenant_id)
    ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('creating','verifying','ready','needs_reconciliation')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'ready' OR shopify_draft_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS shopify_whatsapp_draft_links_tenant_idx
  ON public.shopify_whatsapp_draft_links(tenant_id, created_at DESC);
ALTER TABLE public.shopify_whatsapp_draft_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shopify_whatsapp_draft_links FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.shopify_whatsapp_draft_links TO service_role;
-- A claim or an unknown outcome is never automatically released or re-run.
COMMENT ON TABLE public.shopify_whatsapp_draft_links IS
  'Durable Shopify draft creation claims; creating/verifying require reconciliation before retry.';
