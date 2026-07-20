
-- =========================================================
-- 1. ENUMS
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_plan') THEN
    CREATE TYPE public.tenant_plan AS ENUM ('free','pro','enterprise');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_status') THEN
    CREATE TYPE public.tenant_status AS ENUM ('active','suspended','pending');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_role') THEN
    CREATE TYPE public.tenant_role AS ENUM ('owner','staff','viewer');
  END IF;
END
$$;

-- =========================================================
-- 2. TENANTS TABLE
-- =========================================================
CREATE TABLE public.tenants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text NOT NULL UNIQUE,
  name           text NOT NULL,
  owner_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  plan           public.tenant_plan   NOT NULL DEFAULT 'free',
  status         public.tenant_status NOT NULL DEFAULT 'active',
  settings       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tenants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tenants_owner  ON public.tenants(owner_user_id);
CREATE INDEX idx_tenants_status ON public.tenants(status);

CREATE TRIGGER trg_tenants_updated
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 3. TENANT MEMBERS
-- =========================================================
CREATE TABLE public.tenant_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        public.tenant_role NOT NULL DEFAULT 'staff',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_members TO authenticated;
GRANT ALL ON public.tenant_members TO service_role;

ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tenant_members_tenant ON public.tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_user   ON public.tenant_members(user_id);

-- =========================================================
-- 4. HELPER FUNCTIONS (SECURITY DEFINER to avoid RLS recursion)
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = _tenant_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(_tenant_id uuid, _user_id uuid, _role public.tenant_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = _tenant_id
      AND user_id   = _user_id
      AND role      = _role
  );
$$;

-- Convenience: is caller either a tenant member OR a platform admin?
CREATE OR REPLACE FUNCTION public.can_manage_tenant(_tenant_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::public.app_role)
    OR public.is_tenant_member(_tenant_id, _user_id);
$$;

-- =========================================================
-- 5. TENANTS / MEMBERS RLS POLICIES
-- =========================================================
CREATE POLICY "Members and admins can view their tenant"
  ON public.tenants FOR SELECT TO authenticated
  USING (public.can_manage_tenant(id, auth.uid()));

CREATE POLICY "Only platform admins insert tenants"
  ON public.tenants FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Owner or platform admin can update tenant"
  ON public.tenants FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only platform admins delete tenants"
  ON public.tenants FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Members view their memberships"
  ON public.tenant_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_tenant(tenant_id, auth.uid()));

CREATE POLICY "Owners and admins add members"
  ON public.tenant_members FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_tenant_role(tenant_id, auth.uid(), 'owner'::public.tenant_role)
  );

CREATE POLICY "Owners and admins update members"
  ON public.tenant_members FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_tenant_role(tenant_id, auth.uid(), 'owner'::public.tenant_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_tenant_role(tenant_id, auth.uid(), 'owner'::public.tenant_role)
  );

CREATE POLICY "Owners and admins remove members"
  ON public.tenant_members FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_tenant_role(tenant_id, auth.uid(), 'owner'::public.tenant_role)
  );

-- =========================================================
-- 6. DEFAULT TENANT (backward compatibility)
-- =========================================================
INSERT INTO public.tenants (slug, name, plan, status)
VALUES ('default', 'Default Store', 'enterprise', 'active')
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- 7. ADD tenant_id TO EXISTING TABLES + BACKFILL
-- =========================================================
-- categories
ALTER TABLE public.categories
  ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.categories
  SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'default')
  WHERE tenant_id IS NULL;
ALTER TABLE public.categories ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX idx_categories_tenant ON public.categories(tenant_id);

-- Slug is scoped per-tenant. Drop global unique, add composite unique.
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_slug_key;
ALTER TABLE public.categories ADD CONSTRAINT categories_tenant_slug_key UNIQUE (tenant_id, slug);

-- products
ALTER TABLE public.products
  ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.products
  SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'default')
  WHERE tenant_id IS NULL;
ALTER TABLE public.products ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX idx_products_tenant ON public.products(tenant_id);

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_slug_key;
ALTER TABLE public.products ADD CONSTRAINT products_tenant_slug_key UNIQUE (tenant_id, slug);

-- inventory_movements
ALTER TABLE public.inventory_movements
  ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.inventory_movements m
  SET tenant_id = p.tenant_id
  FROM public.products p
  WHERE p.id = m.product_id AND m.tenant_id IS NULL;
ALTER TABLE public.inventory_movements ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX idx_inventory_tenant ON public.inventory_movements(tenant_id);

-- =========================================================
-- 8. TENANT-AWARE RLS ON EXISTING TABLES
--    Public reads are preserved. Writes now require tenant membership OR platform admin.
-- =========================================================

-- --- CATEGORIES ---
DROP POLICY IF EXISTS "Admins insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins delete categories" ON public.categories;

CREATE POLICY "Tenant members insert categories"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_tenant(tenant_id, auth.uid()));

CREATE POLICY "Tenant members update categories"
  ON public.categories FOR UPDATE TO authenticated
  USING (public.can_manage_tenant(tenant_id, auth.uid()))
  WITH CHECK (public.can_manage_tenant(tenant_id, auth.uid()));

CREATE POLICY "Tenant members delete categories"
  ON public.categories FOR DELETE TO authenticated
  USING (public.can_manage_tenant(tenant_id, auth.uid()));

-- --- PRODUCTS ---
DROP POLICY IF EXISTS "Admins insert products" ON public.products;
DROP POLICY IF EXISTS "Admins update products" ON public.products;
DROP POLICY IF EXISTS "Admins delete products" ON public.products;

CREATE POLICY "Tenant members insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_tenant(tenant_id, auth.uid()));

CREATE POLICY "Tenant members update products"
  ON public.products FOR UPDATE TO authenticated
  USING (public.can_manage_tenant(tenant_id, auth.uid()))
  WITH CHECK (public.can_manage_tenant(tenant_id, auth.uid()));

CREATE POLICY "Tenant members delete products"
  ON public.products FOR DELETE TO authenticated
  USING (public.can_manage_tenant(tenant_id, auth.uid()));

-- --- INVENTORY ---
DROP POLICY IF EXISTS "Admins view inventory"   ON public.inventory_movements;
DROP POLICY IF EXISTS "Admins insert inventory" ON public.inventory_movements;

CREATE POLICY "Tenant members view inventory"
  ON public.inventory_movements FOR SELECT TO authenticated
  USING (public.can_manage_tenant(tenant_id, auth.uid()));

CREATE POLICY "Tenant members insert inventory"
  ON public.inventory_movements FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_tenant(tenant_id, auth.uid()));

-- =========================================================
-- 9. AUTO-MEMBERSHIP TRIGGER — tenant owner becomes owner-member
-- =========================================================
CREATE OR REPLACE FUNCTION public.attach_tenant_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_user_id IS NOT NULL THEN
    INSERT INTO public.tenant_members (tenant_id, user_id, role)
    VALUES (NEW.id, NEW.owner_user_id, 'owner'::public.tenant_role)
    ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tenants_owner_membership
  AFTER INSERT OR UPDATE OF owner_user_id ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.attach_tenant_owner();
