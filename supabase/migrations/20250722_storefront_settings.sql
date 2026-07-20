-- Migration: Create storefront_settings table for global appearance management
-- This table stores all configurable UI settings for the storefront (non-tenant-scoped).
-- Falls back to DEFAULT_STOREFRONT_SETTINGS in code when table is empty or unavailable.

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.storefront_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL UNIQUE,
  value       jsonb NOT NULL,
  type        text NOT NULL DEFAULT 'json',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Index for fast key lookups
CREATE INDEX IF NOT EXISTS idx_storefront_settings_key ON public.storefront_settings (key);

-- 3. Row Level Security
ALTER TABLE public.storefront_settings ENABLE ROW LEVEL SECURITY;

-- Public (anon) can read all settings — required for storefront performance
DROP POLICY IF EXISTS storefront_settings_public_read ON public.storefront_settings;
CREATE POLICY storefront_settings_public_read ON public.storefront_settings
  FOR SELECT TO anon, authenticated USING (true);

-- Only authenticated admins can write
DROP POLICY IF EXISTS storefront_settings_admin_write ON public.storefront_settings;
CREATE POLICY storefront_settings_admin_write ON public.storefront_settings
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin' OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- 4. Seed default values matching current hardcoded config (zero visual change on migration)
-- ON CONFLICT (key) DO NOTHING → existing customizations are never overwritten
INSERT INTO public.storefront_settings (key, value, type) VALUES

  ('hero', '{
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
    "showParticles": true,
    "sphereMaxProducts": 28,
    "sphereRadius": 2.2,
    "sphereTileScale": 0.8,
    "sphereProductSource": "all"
  }', 'json'),

  ('theme', '{
    "primaryColor": "#4f8cff",
    "secondaryColor": "#a259ff",
    "fontFamily": "Tajawal",
    "defaultMode": "dark",
    "showcaseModeEnabled": true,
    "borderRadius": "xl"
  }', 'json'),

  ('products_layout', '{
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
  }', 'json'),

  ('cart_config', '{
    "floatingBarEnabled": true,
    "quickWhatsAppOrder": true,
    "couponFieldEnabled": true,
    "deliveryFormEnabled": true,
    "defaultShippingText": "يتم الاتفاق عليه"
  }', 'json'),

  ('navigation', '{
    "storeName": "اندكس ستور",
    "whatsappPhone": "967770000000",
    "supportEmail": "support@indexes-store.com",
    "footerDescription": "المتجر اليمني الإلكتروني الرائد للتسوق الفاخر والتجربة ثلاثية الأبعاد.",
    "socialLinks": {
      "facebook": "https://facebook.com",
      "instagram": "https://instagram.com",
      "twitter": "https://x.com"
    }
  }', 'json')

ON CONFLICT (key) DO NOTHING;

-- 5. Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION public.update_storefront_settings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS storefront_settings_updated_at ON public.storefront_settings;
CREATE TRIGGER storefront_settings_updated_at
  BEFORE UPDATE ON public.storefront_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_storefront_settings_updated_at();
