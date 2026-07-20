-- =========================================================
-- Phase A: Foundation â€” profiles, roles, has_role, triggers
-- =========================================================

-- Role enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
  END IF;
END
$$;

-- =============== profiles ===============
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  preferred_lang TEXT NOT NULL DEFAULT 'ar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
CREATE POLICY "Authenticated can view profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =============== user_roles ===============
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Authenticated can view roles" ON public.user_roles;
CREATE POLICY "Authenticated can view roles"
  ON public.user_roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins insert roles" ON public.user_roles;
CREATE POLICY "Admins insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update roles" ON public.user_roles;
CREATE POLICY "Admins update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete roles" ON public.user_roles;
CREATE POLICY "Admins delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============== updated_at trigger helper ===============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============== auto-provision profile + customer role on signup ===============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

-- =========================================================
-- CATEGORIES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  image_url text,
  icon text,
  color text,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sort integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories"
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert categories" ON public.categories;
CREATE POLICY "Admins insert categories"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update categories" ON public.categories;
CREATE POLICY "Admins update categories"
  ON public.categories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete categories" ON public.categories;
CREATE POLICY "Admins delete categories"
  ON public.categories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories(sort);

DROP TRIGGER IF EXISTS trg_categories_updated ON public.categories;
CREATE TRIGGER trg_categories_updated
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- PRODUCTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  old_price numeric(12,2) CHECK (old_price IS NULL OR old_price >= 0),
  currency text NOT NULL DEFAULT 'YER',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  brand text,
  images text[] NOT NULL DEFAULT ARRAY[]::text[],
  model_url text,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  reserved_stock integer NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  rating numeric(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count integer NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  badge text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published products" ON public.products;
CREATE POLICY "Public can view published products"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert products" ON public.products;
CREATE POLICY "Admins insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update products" ON public.products;
CREATE POLICY "Admins update products"
  ON public.products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete products" ON public.products;
CREATE POLICY "Admins delete products"
  ON public.products FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_published ON public.products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products(created_at DESC);

DROP TRIGGER IF EXISTS trg_products_updated ON public.products;
CREATE TRIGGER trg_products_updated
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- INVENTORY MOVEMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL,
  reference text,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view inventory" ON public.inventory_movements;
CREATE POLICY "Admins view inventory"
  ON public.inventory_movements FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert inventory" ON public.inventory_movements;
CREATE POLICY "Admins insert inventory"
  ON public.inventory_movements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_created ON public.inventory_movements(created_at DESC);

-- =========================================================
-- STOCK APPLY TRIGGER
-- =========================================================
CREATE OR REPLACE FUNCTION public.apply_inventory_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(stock + NEW.delta, 0)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_apply ON public.inventory_movements;
CREATE TRIGGER trg_inventory_apply
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_inventory_movement();

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
CREATE TABLE IF NOT EXISTS public.tenants (
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

CREATE INDEX IF NOT EXISTS idx_tenants_owner  ON public.tenants(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);

DROP TRIGGER IF EXISTS trg_tenants_updated ON public.tenants;
CREATE TRIGGER trg_tenants_updated
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 3. TENANT MEMBERS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.tenant_members (
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

CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON public.tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user   ON public.tenant_members(user_id);

-- =========================================================
-- ORDERS & CHECKOUT SYSTEM
-- =========================================================

-- Enums for orders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE public.order_status AS ENUM (
      'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM (
      'pending', 'paid', 'failed', 'refunded', 'cod'
    );
  END IF;
END
$$;

-- =============== orders ===============
CREATE TABLE IF NOT EXISTS public.orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_name     text,
  customer_phone    text,
  customer_address  text,
  customer_email    text,
  notes             text,
  status            public.order_status NOT NULL DEFAULT 'pending',
  payment_status    public.payment_status NOT NULL DEFAULT 'pending',
  payment_provider  text,
  total             numeric(12,2) NOT NULL CHECK (total >= 0),
  currency          text NOT NULL DEFAULT 'YER',
  coupon_code       text,
  discount_amount   numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
CREATE POLICY "Public can view orders"
  ON public.orders FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders"
  ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_orders_tenant ON public.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

DROP TRIGGER IF EXISTS trg_orders_updated ON public.orders;
CREATE TRIGGER trg_orders_updated
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============== order_items ===============
CREATE TABLE IF NOT EXISTS public.order_items (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id               uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tenant_id              uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id             uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity               integer NOT NULL CHECK (quantity > 0),
  unit_price             numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  total_price            numeric(12,2) NOT NULL CHECK (total_price >= 0),
  product_name_snapshot  text NOT NULL,
  product_sku_snapshot   text,
  created_at             timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.order_items TO anon, authenticated;
GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
CREATE POLICY "Public can view order items"
  ON public.order_items FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
CREATE POLICY "Public can insert order items"
  ON public.order_items FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_tenant ON public.order_items(tenant_id);

-- =============== order_status_history ===============
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  from_status  public.order_status,
  to_status    public.order_status NOT NULL,
  changed_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.order_status_history TO anon, authenticated;
GRANT ALL ON public.order_status_history TO service_role;

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view order status history" ON public.order_status_history;
CREATE POLICY "Public can view order status history"
  ON public.order_status_history FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can insert order status history" ON public.order_status_history;
CREATE POLICY "Public can insert order status history"
  ON public.order_status_history FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history(order_id);

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
DROP POLICY IF EXISTS "Members and admins can view their tenant" ON public.tenants;
CREATE POLICY "Members and admins can view their tenant"
  ON public.tenants FOR SELECT TO authenticated
  USING (public.can_manage_tenant(id, auth.uid()));

DROP POLICY IF EXISTS "Only platform admins insert tenants" ON public.tenants;
CREATE POLICY "Only platform admins insert tenants"
  ON public.tenants FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Owner or platform admin can update tenant" ON public.tenants;
CREATE POLICY "Owner or platform admin can update tenant"
  ON public.tenants FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Only platform admins delete tenants" ON public.tenants;
CREATE POLICY "Only platform admins delete tenants"
  ON public.tenants FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Members view their memberships" ON public.tenant_members;
CREATE POLICY "Members view their memberships"
  ON public.tenant_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_tenant(tenant_id, auth.uid()));

DROP POLICY IF EXISTS "Owners and admins add members" ON public.tenant_members;
CREATE POLICY "Owners and admins add members"
  ON public.tenant_members FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_tenant_role(tenant_id, auth.uid(), 'owner'::public.tenant_role)
  );

DROP POLICY IF EXISTS "Owners and admins update members" ON public.tenant_members;
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

DROP POLICY IF EXISTS "Owners and admins remove members" ON public.tenant_members;
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
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.categories
  SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'default')
  WHERE tenant_id IS NULL;
ALTER TABLE public.categories ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_tenant ON public.categories(tenant_id);

-- Slug is scoped per-tenant. Drop global unique, add composite unique.
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_slug_key;
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_tenant_slug_key;
ALTER TABLE public.categories ADD CONSTRAINT categories_tenant_slug_key UNIQUE (tenant_id, slug);

-- products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.products
  SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'default')
  WHERE tenant_id IS NULL;
ALTER TABLE public.products ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_tenant ON public.products(tenant_id);

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_slug_key;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_tenant_slug_key;
ALTER TABLE public.products ADD CONSTRAINT products_tenant_slug_key UNIQUE (tenant_id, slug);

-- inventory_movements
ALTER TABLE public.inventory_movements
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.inventory_movements m
  SET tenant_id = p.tenant_id
  FROM public.products p
  WHERE p.id = m.product_id AND m.tenant_id IS NULL;
ALTER TABLE public.inventory_movements ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_tenant ON public.inventory_movements(tenant_id);

-- =========================================================
-- 8. TENANT-AWARE RLS ON EXISTING TABLES
--    Public reads are preserved. Writes now require tenant membership OR platform admin.
-- =========================================================

-- --- CATEGORIES ---
DROP POLICY IF EXISTS "Admins insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins delete categories" ON public.categories;
DROP POLICY IF EXISTS "Tenant members insert categories" ON public.categories;
DROP POLICY IF EXISTS "Tenant members update categories" ON public.categories;
DROP POLICY IF EXISTS "Tenant members delete categories" ON public.categories;

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
DROP POLICY IF EXISTS "Tenant members insert products" ON public.products;
DROP POLICY IF EXISTS "Tenant members update products" ON public.products;
DROP POLICY IF EXISTS "Tenant members delete products" ON public.products;

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
DROP POLICY IF EXISTS "Tenant members view inventory" ON public.inventory_movements;
DROP POLICY IF EXISTS "Tenant members insert inventory" ON public.inventory_movements;

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

DROP TRIGGER IF EXISTS trg_tenants_owner_membership ON public.tenants;
CREATE TRIGGER trg_tenants_owner_membership
  AFTER INSERT OR UPDATE OF owner_user_id ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.attach_tenant_owner();

DROP POLICY IF EXISTS "Storefront resolution — active tenants are publicly visible" ON public.tenants;
CREATE POLICY "Storefront resolution — active tenants are publicly visible"
  ON public.tenants FOR SELECT TO anon
  USING (status = 'active');

DROP POLICY IF EXISTS "Storefront resolution — active tenants visible to authenticated" ON public.tenants;
CREATE POLICY "Storefront resolution — active tenants visible to authenticated"
  ON public.tenants FOR SELECT TO authenticated
  USING (status = 'active');

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.has_tenant_role(uuid, uuid, public.tenant_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_tenant(uuid, uuid) TO authenticated, service_role;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS external_id  text,
  ADD COLUMN IF NOT EXISTS availability text,
  ADD COLUMN IF NOT EXISTS condition    text,
  ADD COLUMN IF NOT EXISTS source_url   text;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_tenant_external_id_key;

DROP INDEX IF EXISTS public.products_tenant_external_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_tenant_external_id_key'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_tenant_external_id_key UNIQUE (tenant_id, external_id);
  END IF;
END
$$;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku                text,
  ADD COLUMN IF NOT EXISTS barcode            text,
  ADD COLUMN IF NOT EXISTS compare_at_price   numeric(12,2),
  ADD COLUMN IF NOT EXISTS cost_price          numeric(12,2),
  ADD COLUMN IF NOT EXISTS model_3d_url        text,
  ADD COLUMN IF NOT EXISTS model_3d_thumbnail  text,
  ADD COLUMN IF NOT EXISTS model_3d_status     text DEFAULT 'pending';

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS meta_sync_status text DEFAULT 'not_synced';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS video_playback_id text;
