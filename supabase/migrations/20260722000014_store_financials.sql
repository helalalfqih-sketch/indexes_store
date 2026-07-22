-- =========================================================
-- P4 — Store Financial Engine: immutable ledger
-- =========================================================
-- tenant_financial_transactions: APPEND-ONLY financial ledger per store.
--   * NO client INSERT policy — rows are written EXCLUSIVELY by the service
--     role inside server functions (order completion workflow), so members
--     can never forge ledger entries even with direct PostgREST access.
--   * NO UPDATE/DELETE policies will ever exist (immutability).
--
-- Fee configuration: intentionally NOT a new table — the approved P1 table
-- `tenant_commissions` (type percentage/fixed, value, active, tenant or
-- platform-default) IS the platform-fee configuration. Creating a parallel
-- tenant_platform_fees table would duplicate that logic.

CREATE TABLE IF NOT EXISTS public.tenant_financial_transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('order_income', 'platform_fee', 'refund', 'adjustment', 'subscription_charge')),
  amount          numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency        text NOT NULL DEFAULT 'YER',
  reference_type  text,          -- e.g. 'order' | 'subscription' | 'manual'
  reference_id    uuid,          -- e.g. orders.id
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fin_tx_tenant ON public.tenant_financial_transactions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fin_tx_reference ON public.tenant_financial_transactions(reference_id, type);

ALTER TABLE public.tenant_financial_transactions ENABLE ROW LEVEL SECURITY;

-- Reads: store owner + manager (has_tenant_permission 'manager') — staff and
-- viewers do NOT see financials. Platform admins pass via the helper.
DROP POLICY IF EXISTS "Managers view store financials" ON public.tenant_financial_transactions;
CREATE POLICY "Managers view store financials"
  ON public.tenant_financial_transactions FOR SELECT TO authenticated
  USING (public.has_tenant_permission(tenant_id, auth.uid(), 'manager'::public.tenant_role));

-- Writes: service role ONLY (no authenticated INSERT policy at all).
GRANT SELECT ON public.tenant_financial_transactions TO authenticated;
GRANT ALL ON public.tenant_financial_transactions TO service_role;
REVOKE ALL ON public.tenant_financial_transactions FROM anon;
