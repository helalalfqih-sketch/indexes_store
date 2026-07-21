-- Create product_video_requests table
CREATE TABLE IF NOT EXISTS public.product_video_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    text NOT NULL,
  product_name  text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.product_video_requests ENABLE ROW LEVEL SECURITY;

-- Allow public insert (storefront visitors can submit requests)
DROP POLICY IF EXISTS product_video_requests_insert ON public.product_video_requests;
CREATE POLICY product_video_requests_insert ON public.product_video_requests
  FOR INSERT TO public
  WITH CHECK (true);

-- Allow authenticated read (admin logs)
DROP POLICY IF EXISTS product_video_requests_read ON public.product_video_requests;
CREATE POLICY product_video_requests_read ON public.product_video_requests
  FOR SELECT TO authenticated
  USING (true);
