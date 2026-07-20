-- =========================================================
-- Migration: 20250720_multi_store_features
-- Multi-Store Platform + Rating System + Notifications + WhatsApp Business
-- =========================================================

-- =========================================================
-- 1. Branches System (فروع المتجر)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.branches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name            text NOT NULL,
  slug            text NOT NULL,
  address         text,
  city            text,
  country         text DEFAULT 'Yemen',
  phone           text,
  email           text,
  latitude        numeric(10, 8),
  longitude       numeric(11, 8),
  is_main_branch  boolean NOT NULL DEFAULT false,
  is_active       boolean NOT NULL DEFAULT true,
  opening_hours   jsonb DEFAULT '{}',
  manager_name    text,
  manager_phone   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members view branches"
  ON public.branches FOR SELECT TO authenticated
  USING (public.has_tenant_permission(tenant_id, auth.uid(), 'viewer'));

CREATE POLICY "Staff manage branches"
  ON public.branches FOR ALL TO authenticated
  USING (public.has_tenant_permission(tenant_id, auth.uid(), 'staff'))
  WITH CHECK (public.has_tenant_permission(tenant_id, auth.uid(), 'staff'));

CREATE INDEX idx_branches_tenant ON public.branches(tenant_id);
CREATE INDEX idx_branches_slug ON public.branches(tenant_id, slug);
CREATE INDEX idx_branches_location ON public.branches(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;

-- =========================================================
-- 2. Product Reviews & Ratings System (نظام التقييم)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id      uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id        uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  rating          integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title           text,
  content         text,
  is_verified_purchase boolean NOT NULL DEFAULT false,
  is_approved     boolean NOT NULL DEFAULT false,
  helpful_count   integer NOT NULL DEFAULT 0,
  images          jsonb DEFAULT '[]',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view approved reviews"
  ON public.reviews FOR SELECT TO anon
  USING (is_approved = true);

CREATE POLICY "Tenant members view all reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (public.has_tenant_permission(tenant_id, auth.uid(), 'viewer'));

CREATE POLICY "Users create reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff manage reviews"
  ON public.reviews FOR UPDATE TO authenticated
  USING (public.has_tenant_permission(tenant_id, auth.uid(), 'staff'));

CREATE INDEX idx_reviews_product ON public.reviews(product_id, is_approved);
CREATE INDEX idx_reviews_tenant ON public.reviews(tenant_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_created ON public.reviews(created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

-- Product average rating view
CREATE OR REPLACE VIEW public.product_ratings AS
SELECT
  product_id,
  tenant_id,
  COUNT(*) as total_reviews,
  AVG(rating) as average_rating,
  COUNT(*) FILTER (WHERE rating = 5) as five_star,
  COUNT(*) FILTER (WHERE rating = 4) as four_star,
  COUNT(*) FILTER (WHERE rating = 3) as three_star,
  COUNT(*) FILTER (WHERE rating = 2) as two_star,
  COUNT(*) FILTER (WHERE rating = 1) as one_star
FROM public.reviews
WHERE is_approved = true
GROUP BY product_id, tenant_id;

-- =========================================================
-- 3. Notification System (نظام الإشعارات)
-- =========================================================
CREATE TYPE public.notification_type AS ENUM (
  'order_new', 'order_status', 'order_cancelled',
  'review_new', 'review_reply',
  'inventory_low', 'inventory_out',
  'product_published', 'product_updated',
  'system', 'promotion', 'whatsapp_message'
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type            public.notification_type NOT NULL,
  title           text NOT NULL,
  message         text NOT NULL,
  data            jsonb DEFAULT '{}',
  is_read         boolean NOT NULL DEFAULT false,
  read_at         timestamptz,
  action_url      text,
  image_url       text,
  priority        text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_tenant_permission(tenant_id, auth.uid(), 'staff'));

CREATE POLICY "Users mark notifications read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_tenant ON public.notifications(tenant_id, created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- =========================================================
-- 4. Best-Sellers & Sales Analytics (المنتجات الأكثر مبيعاً)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.sales_analytics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id      uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  branch_id       uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  order_id        uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  quantity_sold   integer NOT NULL DEFAULT 1,
  revenue         numeric(12,2) NOT NULL DEFAULT 0,
  cost            numeric(12,2) NOT NULL DEFAULT 0,
  profit          numeric(12,2) NOT NULL DEFAULT 0,
  sale_date       date NOT NULL DEFAULT CURRENT_DATE,
  hour_of_day     integer CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week     integer CHECK (day_of_week >= 0 AND day_of_week <= 6),
  customer_type   text DEFAULT 'new' CHECK (customer_type IN ('new', 'returning', 'vip')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view analytics"
  ON public.sales_analytics FOR SELECT TO authenticated
  USING (public.has_tenant_permission(tenant_id, auth.uid(), 'staff'));

CREATE INDEX idx_sales_tenant_date ON public.sales_analytics(tenant_id, sale_date DESC);
CREATE INDEX idx_sales_product ON public.sales_analytics(product_id, sale_date DESC);
CREATE INDEX idx_sales_branch ON public.sales_analytics(branch_id, sale_date DESC);

GRANT SELECT ON public.sales_analytics TO authenticated;
GRANT ALL ON public.sales_analytics TO service_role;

-- Best sellers view
CREATE OR REPLACE VIEW public.best_sellers AS
SELECT
  tenant_id,
  product_id,
  SUM(quantity_sold) as total_sold,
  SUM(revenue) as total_revenue,
  SUM(profit) as total_profit,
  COUNT(DISTINCT order_id) as order_count,
  MAX(sale_date) as last_sale_date
FROM public.sales_analytics
WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY tenant_id, product_id
ORDER BY total_sold DESC;

-- =========================================================
-- 5. WhatsApp Business Configuration (إعدادات WhatsApp Business)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_configs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id       uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  phone_number    text NOT NULL,
  display_name    text,
  business_id     text,
  api_token       text,
  webhook_url     text,
  is_active       boolean NOT NULL DEFAULT true,
  auto_reply      boolean NOT NULL DEFAULT true,
  welcome_message text DEFAULT 'مرحباً بك في متجرنا! كيف يمكننا مساعدتك؟',
  order_template  text DEFAULT 'طلب جديد #{order_id}: {product_name} - {total} ريال',
  notify_on_order boolean NOT NULL DEFAULT true,
  notify_on_status boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, phone_number)
);

ALTER TABLE public.whatsapp_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage whatsapp configs"
  ON public.whatsapp_configs FOR ALL TO authenticated
  USING (public.has_tenant_permission(tenant_id, auth.uid(), 'staff'))
  WITH CHECK (public.has_tenant_permission(tenant_id, auth.uid(), 'staff'));

CREATE INDEX idx_whatsapp_tenant ON public.whatsapp_configs(tenant_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_configs TO authenticated;
GRANT ALL ON public.whatsapp_configs TO service_role;

-- =========================================================
-- 6. WhatsApp Message Logs (سجل رسائل WhatsApp)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  config_id       uuid REFERENCES public.whatsapp_configs(id) ON DELETE SET NULL,
  order_id        uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_phone  text NOT NULL,
  message_type    text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'template', 'order_notification', 'status_update')),
  message_content text NOT NULL,
  template_name   text,
  template_params jsonb DEFAULT '[]',
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  wa_message_id   text,
  error_message   text,
  sent_at         timestamptz,
  delivered_at    timestamptz,
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view whatsapp messages"
  ON public.whatsapp_messages FOR SELECT TO authenticated
  USING (public.has_tenant_permission(tenant_id, auth.uid(), 'staff'));

CREATE INDEX idx_whatsapp_messages_tenant ON public.whatsapp_messages(tenant_id, created_at DESC);
CREATE INDEX idx_whatsapp_messages_order ON public.whatsapp_messages(order_id);
CREATE INDEX idx_whatsapp_messages_status ON public.whatsapp_messages(status);

GRANT SELECT, INSERT, UPDATE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;

-- =========================================================
-- 7. Product Comparison (نظام المقارنة)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.product_comparisons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_ids     uuid[] NOT NULL,
  name            text,
  is_saved        boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own comparisons"
  ON public.product_comparisons FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_comparisons_user ON public.product_comparisons(user_id);
CREATE INDEX idx_comparisons_tenant ON public.product_comparisons(tenant_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_comparisons TO authenticated;
GRANT ALL ON public.product_comparisons TO service_role;

-- =========================================================
-- 8. Order Branch Assignment (ربط الطلبات بالفروع)
-- =========================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_branch ON public.orders(branch_id) WHERE branch_id IS NOT NULL;

-- =========================================================
-- 9. Idempotent guard: ensure set_updated_at() exists
-- (defined in earlier migration, but guarded here for safety)
-- =========================================================
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

-- =========================================================
-- 10. Functions for Notifications & Analytics
-- =========================================================

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  _tenant_id uuid,
  _user_id uuid,
  _type public.notification_type,
  _title text,
  _message text,
  _data jsonb DEFAULT '{}',
  _action_url text DEFAULT NULL,
  _priority text DEFAULT 'normal'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id uuid;
BEGIN
  INSERT INTO public.notifications (tenant_id, user_id, type, title, message, data, action_url, priority)
  VALUES (_tenant_id, _user_id, _type, _title, _message, _data, _action_url, _priority)
  RETURNING id INTO _notification_id;
  
  RETURN _notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_notification(uuid, uuid, public.notification_type, text, text, jsonb, text, text) TO authenticated, service_role;

-- Function to record sale analytics
CREATE OR REPLACE FUNCTION public.record_sale(
  _tenant_id uuid,
  _product_id uuid,
  _order_id uuid,
  _quantity integer,
  _revenue numeric,
  _cost numeric,
  _branch_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.sales_analytics (
    tenant_id, product_id, order_id, branch_id, quantity_sold, revenue, cost, profit, sale_date, hour_of_day, day_of_week
  )
  VALUES (
    _tenant_id, _product_id, _order_id, _branch_id, _quantity, _revenue, _cost, _revenue - _cost,
    CURRENT_DATE, EXTRACT(HOUR FROM now()), EXTRACT(DOW FROM now())
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_sale(uuid, uuid, uuid, integer, numeric, numeric, uuid) TO authenticated, service_role;

-- Function to get best sellers
CREATE OR REPLACE FUNCTION public.get_best_sellers(
  _tenant_id uuid,
  _days integer DEFAULT 30,
  _limit integer DEFAULT 10
)
RETURNS TABLE (
  product_id uuid,
  total_sold bigint,
  total_revenue numeric,
  total_profit numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sa.product_id,
    SUM(sa.quantity_sold) as total_sold,
    SUM(sa.revenue) as total_revenue,
    SUM(sa.profit) as total_profit
  FROM public.sales_analytics sa
  WHERE sa.tenant_id = _tenant_id
    AND sa.sale_date >= CURRENT_DATE - (_days || ' days')::interval
  GROUP BY sa.product_id
  ORDER BY total_sold DESC
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_best_sellers(uuid, integer, integer) TO authenticated, anon, service_role;

-- Function to update order with branch
CREATE OR REPLACE FUNCTION public.update_order_branch(
  _order_id uuid,
  _branch_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id uuid;
BEGIN
  SELECT tenant_id INTO _tenant_id FROM public.orders WHERE id = _order_id;
  
  IF NOT public.has_tenant_permission(_tenant_id, auth.uid(), 'staff') THEN
    RAISE EXCEPTION 'Forbidden: staff permission required';
  END IF;
  
  UPDATE public.orders SET branch_id = _branch_id WHERE id = _order_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_branch(uuid, uuid) TO authenticated;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trg_branches_updated ON public.branches;
CREATE TRIGGER trg_branches_updated
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_reviews_updated ON public.reviews;
CREATE TRIGGER trg_reviews_updated
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_whatsapp_configs_updated ON public.whatsapp_configs;
CREATE TRIGGER trg_whatsapp_configs_updated
  BEFORE UPDATE ON public.whatsapp_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_product_comparisons_updated ON public.product_comparisons;
CREATE TRIGGER trg_product_comparisons_updated
  BEFORE UPDATE ON public.product_comparisons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 10. Seed data for testing (optional, remove in production)
-- =========================================================

-- Grant all permissions to service_role
-- =========================================================
-- 11. Atomic increment helper for review helpful_count
-- =========================================================
CREATE OR REPLACE FUNCTION public.increment_review_helpful(_review_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reviews
  SET helpful_count = helpful_count + 1
  WHERE id = _review_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_review_helpful(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.increment_review_helpful(uuid) FROM PUBLIC, anon;

GRANT ALL ON public.product_ratings TO service_role;
GRANT ALL ON public.best_sellers TO service_role;

-- End of migration
