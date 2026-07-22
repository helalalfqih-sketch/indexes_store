-- =========================================================
-- Migration: 20260722000008_marketplace_domain_layer.sql
-- Walmart / Amazon-Style Multi-Vendor Marketplace Infrastructure
-- =========================================================

-- 1. Extend app_role enum with marketplace roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'customer', 'manager', 'vendor_owner', 'vendor_staff');
  ELSE
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor_owner';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor_staff';
  END IF;
END
$$;

-- 2. Vendors Table (Tenant-Aware)
CREATE TABLE IF NOT EXISTS public.vendors (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id                   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                      text NOT NULL,
  slug                      text NOT NULL,
  logo_url                  text,
  banner_url                text,
  description               text,
  status                    text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  is_featured               boolean NOT NULL DEFAULT false,
  commission_type           text NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  commission_rate           numeric(5, 2) NOT NULL DEFAULT 10.00,
  fixed_commission_amount   numeric(12, 2) NOT NULL DEFAULT 0.00,
  rating                    numeric(3, 2) DEFAULT 5.00,
  reviews_count             integer DEFAULT 0,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Security helper to get user's vendor ID
CREATE OR REPLACE FUNCTION public.get_user_vendor_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.vendors WHERE user_id = _user_id LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_vendor_id(uuid) TO authenticated, service_role;

-- Policies for vendors table
DROP POLICY IF EXISTS "Public view active vendors" ON public.vendors;
CREATE POLICY "Public view active vendors"
  ON public.vendors FOR SELECT TO anon, authenticated
  USING (status = 'active' OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Vendor owners insert own vendor" ON public.vendors;
CREATE POLICY "Vendor owners insert own vendor"
  ON public.vendors FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Vendor owners update own vendor" ON public.vendors;
CREATE POLICY "Vendor owners update own vendor"
  ON public.vendors FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_vendors_tenant ON public.vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_user ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_slug ON public.vendors(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors(status);

GRANT SELECT, INSERT, UPDATE ON public.vendors TO authenticated;
GRANT SELECT ON public.vendors TO anon;
GRANT ALL ON public.vendors TO service_role;

-- 3. Vendor Profiles Table (Sensitive Financial & Legal Data)
CREATE TABLE IF NOT EXISTS public.vendor_profiles (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id               uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  business_type           text DEFAULT 'individual',
  commercial_register     text,
  tax_number              text,
  national_id             text,
  contact_email           text NOT NULL,
  contact_phone           text NOT NULL,
  bank_name               text,
  bank_account_name       text,
  bank_iban               text,
  wallet_number           text,
  city                    text,
  address                 text,
  country                 text DEFAULT 'Yemen',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(vendor_id)
);

ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendor owner or admin view profile" ON public.vendor_profiles;
CREATE POLICY "Vendor owner or admin view profile"
  ON public.vendor_profiles FOR SELECT TO authenticated
  USING (
    vendor_id = public.get_user_vendor_id(auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Vendor owner or admin edit profile" ON public.vendor_profiles;
CREATE POLICY "Vendor owner or admin edit profile"
  ON public.vendor_profiles FOR ALL TO authenticated
  USING (
    vendor_id = public.get_user_vendor_id(auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    vendor_id = public.get_user_vendor_id(auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  );

GRANT SELECT, INSERT, UPDATE ON public.vendor_profiles TO authenticated;
GRANT ALL ON public.vendor_profiles TO service_role;

-- 4. Vendor Settings Table
CREATE TABLE IF NOT EXISTS public.vendor_settings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id               uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  auto_accept_orders      boolean NOT NULL DEFAULT true,
  notify_email            boolean NOT NULL DEFAULT true,
  notify_whatsapp         boolean NOT NULL DEFAULT true,
  custom_shipping_fee     numeric(12, 2) DEFAULT 0.00,
  min_order_amount        numeric(12, 2) DEFAULT 0.00,
  processing_days         integer DEFAULT 1,
  working_hours           jsonb DEFAULT '{}',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(vendor_id)
);

ALTER TABLE public.vendor_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendor owner manage settings" ON public.vendor_settings;
CREATE POLICY "Vendor owner manage settings"
  ON public.vendor_settings FOR ALL TO authenticated
  USING (
    vendor_id = public.get_user_vendor_id(auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  );

GRANT SELECT, INSERT, UPDATE ON public.vendor_settings TO authenticated;
GRANT ALL ON public.vendor_settings TO service_role;

-- 5. Vendor Subscriptions Table
CREATE TABLE IF NOT EXISTS public.vendor_subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id               uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  plan_name               text NOT NULL DEFAULT 'free',
  monthly_price           numeric(12, 2) NOT NULL DEFAULT 0.00,
  product_limit           integer NOT NULL DEFAULT 50,
  starts_at               timestamptz NOT NULL DEFAULT now(),
  ends_at                 timestamptz,
  is_active               boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendor owner view subscription" ON public.vendor_subscriptions;
CREATE POLICY "Vendor owner view subscription"
  ON public.vendor_subscriptions FOR SELECT TO authenticated
  USING (
    vendor_id = public.get_user_vendor_id(auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  );

GRANT SELECT ON public.vendor_subscriptions TO authenticated;
GRANT ALL ON public.vendor_subscriptions TO service_role;

-- 6. Multi-Vendor Sub-Orders Infrastructure
CREATE TABLE IF NOT EXISTS public.vendor_orders (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id                uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  vendor_id               uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  vendor_order_number     text NOT NULL,
  subtotal                numeric(12, 2) NOT NULL DEFAULT 0.00,
  shipping_fee            numeric(12, 2) NOT NULL DEFAULT 0.00,
  commission_amount       numeric(12, 2) NOT NULL DEFAULT 0.00,
  net_amount              numeric(12, 2) NOT NULL DEFAULT 0.00,
  status                  text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  tracking_number         text,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, vendor_id)
);

ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendor or admin view vendor orders" ON public.vendor_orders;
CREATE POLICY "Vendor or admin view vendor orders"
  ON public.vendor_orders FOR SELECT TO authenticated
  USING (
    vendor_id = public.get_user_vendor_id(auth.uid()) OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_tenant_permission(tenant_id, auth.uid(), 'staff')
  );

DROP POLICY IF EXISTS "Vendor or admin update vendor orders" ON public.vendor_orders;
CREATE POLICY "Vendor or admin update vendor orders"
  ON public.vendor_orders FOR UPDATE TO authenticated
  USING (
    vendor_id = public.get_user_vendor_id(auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_vendor_orders_vendor ON public.vendor_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_main ON public.vendor_orders(order_id);

GRANT SELECT, UPDATE ON public.vendor_orders TO authenticated;
GRANT ALL ON public.vendor_orders TO service_role;

-- 7. Vendor Order Line Items
CREATE TABLE IF NOT EXISTS public.vendor_order_items (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_order_id         uuid NOT NULL REFERENCES public.vendor_orders(id) ON DELETE CASCADE,
  order_item_id           uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  product_id              uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity                integer NOT NULL DEFAULT 1,
  unit_price              numeric(12, 2) NOT NULL DEFAULT 0.00,
  total_price             numeric(12, 2) NOT NULL DEFAULT 0.00,
  created_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendor or admin view vendor order items" ON public.vendor_order_items;
CREATE POLICY "Vendor or admin view vendor order items"
  ON public.vendor_order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_orders vo
      WHERE vo.id = vendor_order_id AND (
        vo.vendor_id = public.get_user_vendor_id(auth.uid()) OR
        public.has_role(auth.uid(), 'admin')
      )
    )
  );

GRANT SELECT ON public.vendor_order_items TO authenticated;
GRANT ALL ON public.vendor_order_items TO service_role;

-- 8. Commission Calculation Logs
CREATE TABLE IF NOT EXISTS public.vendor_commissions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vendor_id               uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  order_id                uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  vendor_order_id         uuid REFERENCES public.vendor_orders(id) ON DELETE CASCADE,
  gross_amount            numeric(12, 2) NOT NULL DEFAULT 0.00,
  commission_type         text NOT NULL DEFAULT 'percentage',
  commission_rate         numeric(5, 2) NOT NULL DEFAULT 10.00,
  commission_amount       numeric(12, 2) NOT NULL DEFAULT 0.00,
  net_amount              numeric(12, 2) NOT NULL DEFAULT 0.00,
  payout_status           text NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'cancelled')),
  payout_date             timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendor owner or admin view commissions" ON public.vendor_commissions;
CREATE POLICY "Vendor owner or admin view commissions"
  ON public.vendor_commissions FOR SELECT TO authenticated
  USING (
    vendor_id = public.get_user_vendor_id(auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_vendor_commissions_vendor ON public.vendor_commissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_commissions_payout ON public.vendor_commissions(payout_status);

GRANT SELECT ON public.vendor_commissions TO authenticated;
GRANT ALL ON public.vendor_commissions TO service_role;

-- 9. Add vendor_id to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_vendor ON public.products(vendor_id) WHERE vendor_id IS NOT NULL;

-- 10. Auto-updated timestamp triggers
DROP TRIGGER IF EXISTS trg_vendors_updated ON public.vendors;
CREATE TRIGGER trg_vendors_updated
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_vendor_profiles_updated ON public.vendor_profiles;
CREATE TRIGGER trg_vendor_profiles_updated
  BEFORE UPDATE ON public.vendor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_vendor_settings_updated ON public.vendor_settings;
CREATE TRIGGER trg_vendor_settings_updated
  BEFORE UPDATE ON public.vendor_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
