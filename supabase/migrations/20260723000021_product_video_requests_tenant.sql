-- Migration: 20260723000021_product_video_requests_tenant.sql
-- Ensure product_video_requests table schema & tenant RLS policies

CREATE TABLE IF NOT EXISTS public.product_video_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id    uuid REFERENCES public.products(id) ON DELETE CASCADE,
  product_name  text NOT NULL,
  customer_id   uuid,
  status        text DEFAULT 'pending',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Ensure columns exist if table pre-existed with text fields
ALTER TABLE public.product_video_requests ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.product_video_requests ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.product_video_requests ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Enable Row Level Security (RLS)
ALTER TABLE public.product_video_requests ENABLE ROW LEVEL SECURITY;

-- Allow public insert (storefront visitors & customers can submit requests)
DROP POLICY IF EXISTS product_video_requests_public_insert ON public.product_video_requests;
CREATE POLICY product_video_requests_public_insert ON public.product_video_requests
  FOR INSERT TO public
  WITH CHECK (true);

-- Allow tenant admins to view video requests for their tenant
DROP POLICY IF EXISTS product_video_requests_tenant_read ON public.product_video_requests;
CREATE POLICY product_video_requests_tenant_read ON public.product_video_requests
  FOR SELECT TO authenticated
  USING (
    tenant_id IS NULL OR tenant_id IN (
      SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
    )
  );
