-- =========================================================
-- Migration: 20250721_global_storefront_appearance
-- Global Storefront Appearance Management (Table + Seed + RLS)
-- =========================================================

-- 1. Create storefront_settings table
CREATE TABLE IF NOT EXISTS public.storefront_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL UNIQUE,
  value       jsonb NOT NULL,
  type        text NOT NULL DEFAULT 'json',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Enable RLS
ALTER TABLE public.storefront_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Public view (anon + authenticated)
DROP POLICY IF EXISTS "Public view storefront settings" ON public.storefront_settings;
CREATE POLICY "Public view storefront settings"
  ON public.storefront_settings FOR SELECT TO anon, authenticated
  USING (true);

-- Platform Admins manage (insert/update/delete)
DROP POLICY IF EXISTS "Staff manage storefront settings" ON public.storefront_settings;
CREATE POLICY "Staff manage storefront settings"
  ON public.storefront_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4. Grants
GRANT SELECT ON public.storefront_settings TO anon, authenticated;
GRANT ALL ON public.storefront_settings TO service_role;

-- 5. Updated_at Trigger
DROP TRIGGER IF EXISTS trg_storefront_settings_updated ON public.storefront_settings;
CREATE TRIGGER trg_storefront_settings_updated
  BEFORE UPDATE ON public.storefront_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Seed Default Records (Idempotent 100% — matches current UI defaults)

-- Hero Config
INSERT INTO public.storefront_settings (key, value, type)
VALUES (
  'hero',
  '{
    "enabled": true,
    "type": "sphere_3d",
    "badgeText": "INDEXES · LIVE SHOWCASE",
    "title": "معرض المنتجات الذكي",
    "subtitle": "اسحب الكرة — كل وجه منتج، اضغط لتفتحه",
    "bannerImageUrl": "",
    "bannerVideoUrl": "",
    "ctaText": "تصفح العروض الحصرية",
    "ctaLink": "/offers",
    "secondaryCtaText": "المعرض الافتراضي",
    "secondaryCtaLink": "/immersive-store",
    "showParticles": true
  }'::jsonb,
  'json'
) ON CONFLICT (key) DO NOTHING;

-- Theme Config
INSERT INTO public.storefront_settings (key, value, type)
VALUES (
  'theme',
  '{
    "primaryColor": "#4f8cff",
    "secondaryColor": "#a259ff",
    "fontFamily": "Tajawal",
    "defaultMode": "dark",
    "showcaseModeEnabled": true,
    "borderRadius": "xl"
  }'::jsonb,
  'json'
) ON CONFLICT (key) DO NOTHING;

-- Products Layout Config
INSERT INTO public.storefront_settings (key, value, type)
VALUES (
  'products_layout',
  '{
    "columnsDesktop": 6,
    "columnsMobile": 2,
    "cardSize": "medium",
    "showPrice": true,
    "showDiscount": true,
    "showRating": true,
    "showAddToCartButton": true,
    "latestProductsLimit": 12,
    "bestSellersLimit": 6,
    "dailyDealsLimit": 6
  }'::jsonb,
  'json'
) ON CONFLICT (key) DO NOTHING;

-- Cart Config
INSERT INTO public.storefront_settings (key, value, type)
VALUES (
  'cart_config',
  '{
    "floatingBarEnabled": true,
    "quickWhatsAppOrder": true,
    "couponFieldEnabled": true,
    "deliveryFormEnabled": true,
    "defaultShippingText": "يتم الاتفاق عليه"
  }'::jsonb,
  'json'
) ON CONFLICT (key) DO NOTHING;

-- Navigation Config
INSERT INTO public.storefront_settings (key, value, type)
VALUES (
  'navigation',
  '{
    "storeName": "اندكس ستور",
    "whatsappPhone": "967770000000",
    "supportEmail": "support@indexes-store.com",
    "footerDescription": "المتجر اليمني الإلكتروني الرائد للتسوق الفاخر والتجربة ثلاثية الأبعاد.",
    "socialLinks": {
      "facebook": "https://facebook.com",
      "instagram": "https://instagram.com",
      "twitter": "https://x.com"
    }
  }'::jsonb,
  'json'
) ON CONFLICT (key) DO NOTHING;
