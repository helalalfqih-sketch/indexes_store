-- =========================================================
-- Store Domain Layer (Tenant = Electronic Store) — Phases 1, 2, 3, 7
-- =========================================================
-- Architecture decision (approved): NO independent `stores` table. The tenant
-- IS the electronic store; these tables extend it with store-facing data,
-- all keyed by tenant_id. Fully additive + idempotent; single-store mode
-- (default tenant) keeps working untouched.

-- ---------------------------------------------------------
-- Phase 3 — role hierarchy: owner > manager > staff > viewer
-- (replaces the 20250720 version; manager gets products/orders/inventory/
--  reports — i.e. everything staff can do and above, below owner)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_tenant_permission(
  _tenant_id uuid,
  _user_id uuid,
  _required_role public.tenant_role
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_role public.tenant_role;
BEGIN
  -- Platform admins have all permissions
  IF public.has_role(_user_id, 'admin'::public.app_role) THEN
    RETURN true;
  END IF;

  SELECT role INTO _user_role
  FROM public.tenant_members
  WHERE tenant_id = _tenant_id AND user_id = _user_id;

  IF _user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Hierarchy: owner > manager > staff > viewer
  IF _required_role = 'viewer'::public.tenant_role THEN
    RETURN true;
  ELSIF _required_role = 'staff'::public.tenant_role THEN
    RETURN _user_role IN ('staff'::public.tenant_role, 'manager'::public.tenant_role, 'owner'::public.tenant_role);
  ELSIF _required_role = 'manager'::public.tenant_role THEN
    RETURN _user_role IN ('manager'::public.tenant_role, 'owner'::public.tenant_role);
  ELSIF _required_role = 'owner'::public.tenant_role THEN
    RETURN _user_role = 'owner'::public.tenant_role;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_tenant_permission(uuid, uuid, public.tenant_role) TO authenticated, service_role;

-- ---------------------------------------------------------
-- Phase 1 — tenant_store_profiles (store identity, NOT a separate entity)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_store_profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  display_name  text NOT NULL,
  slug          text UNIQUE,
  logo_url      text,
  banner_url    text,
  description   text,
  business_type text,
  phone         text,
  email         text,
  social_links  jsonb NOT NULL DEFAULT '{}'::jsonb,
  branding      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_profiles_tenant ON public.tenant_store_profiles(tenant_id);

ALTER TABLE public.tenant_store_profiles ENABLE ROW LEVEL SECURITY;

-- Public storefront may show active stores' identity (name/logo/…).
DROP POLICY IF EXISTS "Public view active store profiles" ON public.tenant_store_profiles;
CREATE POLICY "Public view active store profiles"
  ON public.tenant_store_profiles FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND t.status = 'active'));

-- Store identity edits are owner-level (managers run operations, not identity).
DROP POLICY IF EXISTS "Owners manage store profile" ON public.tenant_store_profiles;
CREATE POLICY "Owners manage store profile"
  ON public.tenant_store_profiles FOR ALL TO authenticated
  USING (public.has_tenant_permission(tenant_id, auth.uid(), 'owner'::public.tenant_role))
  WITH CHECK (public.has_tenant_permission(tenant_id, auth.uid(), 'owner'::public.tenant_role));

GRANT SELECT ON public.tenant_store_profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tenant_store_profiles TO authenticated;
GRANT ALL ON public.tenant_store_profiles TO service_role;

DROP TRIGGER IF EXISTS trg_store_profiles_updated ON public.tenant_store_profiles;
CREATE TRIGGER trg_store_profiles_updated
  BEFORE UPDATE ON public.tenant_store_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------
-- Phase 2 — tenant_store_settings (key/value: payment, shipping, contact,
-- working_hours, policies, visibility). NEVER store secrets here.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_store_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key         text NOT NULL,
  value       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key)
);

CREATE INDEX IF NOT EXISTS idx_store_settings_tenant ON public.tenant_store_settings(tenant_id);

ALTER TABLE public.tenant_store_settings ENABLE ROW LEVEL SECURITY;

-- Members read their store's settings; owner (+ platform admin) writes.
DROP POLICY IF EXISTS "Members view store settings" ON public.tenant_store_settings;
CREATE POLICY "Members view store settings"
  ON public.tenant_store_settings FOR SELECT TO authenticated
  USING (public.has_tenant_permission(tenant_id, auth.uid(), 'viewer'::public.tenant_role));

DROP POLICY IF EXISTS "Owners manage store settings" ON public.tenant_store_settings;
CREATE POLICY "Owners manage store settings"
  ON public.tenant_store_settings FOR ALL TO authenticated
  USING (public.has_tenant_permission(tenant_id, auth.uid(), 'owner'::public.tenant_role))
  WITH CHECK (public.has_tenant_permission(tenant_id, auth.uid(), 'owner'::public.tenant_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_store_settings TO authenticated;
GRANT ALL ON public.tenant_store_settings TO service_role;
REVOKE ALL ON public.tenant_store_settings FROM anon;

DROP TRIGGER IF EXISTS trg_store_settings_updated ON public.tenant_store_settings;
CREATE TRIGGER trg_store_settings_updated
  BEFORE UPDATE ON public.tenant_store_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------
-- Phase 7 — marketplace preparation (schema only; NO payout system yet)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan                  public.tenant_plan NOT NULL DEFAULT 'free',
  status                text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled')),
  current_period_start  timestamptz NOT NULL DEFAULT now(),
  current_period_end    timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON public.tenant_subscriptions(tenant_id);

ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view own subscription" ON public.tenant_subscriptions;
CREATE POLICY "Members view own subscription"
  ON public.tenant_subscriptions FOR SELECT TO authenticated
  USING (public.has_tenant_permission(tenant_id, auth.uid(), 'viewer'::public.tenant_role));
-- Writes: platform billing only (service role / platform admin via has_role).
DROP POLICY IF EXISTS "Platform admins manage subscriptions" ON public.tenant_subscriptions;
CREATE POLICY "Platform admins manage subscriptions"
  ON public.tenant_subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_subscriptions TO authenticated;
GRANT ALL ON public.tenant_subscriptions TO service_role;
REVOKE ALL ON public.tenant_subscriptions FROM anon;

-- Commission RULES (percentage/fixed). tenant_id NULL = platform default rule.
CREATE TABLE IF NOT EXISTS public.tenant_commissions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  type           text NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value          numeric(12,4) NOT NULL CHECK (value >= 0),
  active         boolean NOT NULL DEFAULT true,
  effective_from timestamptz NOT NULL DEFAULT now(),
  created_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_commissions_tenant ON public.tenant_commissions(tenant_id);

ALTER TABLE public.tenant_commissions ENABLE ROW LEVEL SECURITY;

-- Store members see their own rules + the platform default (tenant_id IS NULL).
DROP POLICY IF EXISTS "Members view applicable commission rules" ON public.tenant_commissions;
CREATE POLICY "Members view applicable commission rules"
  ON public.tenant_commissions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (tenant_id IS NOT NULL AND public.is_tenant_member(tenant_id, auth.uid()))
    OR (tenant_id IS NULL AND auth.uid() IS NOT NULL)
  );

DROP POLICY IF EXISTS "Platform admins manage commission rules" ON public.tenant_commissions;
CREATE POLICY "Platform admins manage commission rules"
  ON public.tenant_commissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_commissions TO authenticated;
GRANT ALL ON public.tenant_commissions TO service_role;
REVOKE ALL ON public.tenant_commissions FROM anon;

-- Commission CALCULATIONS history — append-only financial ledger (prep).
-- INSERT happens via service role only when the engine ships; NO client
-- UPDATE/DELETE policies will ever exist on this table.
CREATE TABLE IF NOT EXISTS public.tenant_commission_calculations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id           uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rule_id            uuid REFERENCES public.tenant_commissions(id) ON DELETE SET NULL,
  base_amount        numeric(12,2) NOT NULL CHECK (base_amount >= 0),
  commission_amount  numeric(12,2) NOT NULL CHECK (commission_amount >= 0),
  store_earnings     numeric(12,2) NOT NULL CHECK (store_earnings >= 0),
  calculated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_calc_tenant ON public.tenant_commission_calculations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commission_calc_order ON public.tenant_commission_calculations(order_id);

ALTER TABLE public.tenant_commission_calculations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view own commission history" ON public.tenant_commission_calculations;
CREATE POLICY "Members view own commission history"
  ON public.tenant_commission_calculations FOR SELECT TO authenticated
  USING (public.has_tenant_permission(tenant_id, auth.uid(), 'viewer'::public.tenant_role));

GRANT SELECT ON public.tenant_commission_calculations TO authenticated;
GRANT ALL ON public.tenant_commission_calculations TO service_role;
REVOKE ALL ON public.tenant_commission_calculations FROM anon;

-- =========================================================
-- End store domain migration
-- =========================================================
