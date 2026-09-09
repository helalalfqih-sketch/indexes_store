CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS auth;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END
$$;

CREATE TABLE auth.users (
  id uuid PRIMARY KEY
);

CREATE TABLE public.tenants (
  id uuid PRIMARY KEY,
  status text NOT NULL
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  is_published boolean NOT NULL DEFAULT false,
  price numeric(12, 2),
  currency text,
  stock integer,
  name text NOT NULL,
  sku text
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  customer_email text,
  notes text,
  status text NOT NULL,
  payment_status text NOT NULL,
  payment_provider text,
  total numeric(12, 2) NOT NULL,
  currency text NOT NULL,
  coupon_code text,
  discount_amount numeric(12, 2) NOT NULL DEFAULT 0
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL,
  unit_price numeric(12, 2) NOT NULL,
  total_price numeric(12, 2) NOT NULL,
  product_name_snapshot text,
  product_sku_snapshot text
);

CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  from_status text,
  to_status text NOT NULL,
  changed_by uuid,
  note text
);

CREATE TABLE public.storefront_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  key text NOT NULL,
  value jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
