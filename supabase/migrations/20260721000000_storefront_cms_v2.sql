-- ============================================================
-- Migration: Storefront CMS v2
-- Adds: draft_value column, storefront_change_logs table,
--       and seeds new CMS keys: sections, seo, advanced
-- ============================================================

-- 1. Add draft_value column to storefront_settings (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'storefront_settings'
      AND column_name = 'draft_value'
  ) THEN
    ALTER TABLE public.storefront_settings
      ADD COLUMN draft_value jsonb NULL;
  END IF;
END $$;

-- 2. Create storefront_change_logs table
CREATE TABLE IF NOT EXISTS public.storefront_change_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email   text,
  action_type  text NOT NULL, -- 'save_draft' | 'publish' | 'reset'
  key_changed  text NOT NULL, -- e.g. 'hero', 'theme', 'sections'
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_change_logs_key ON public.storefront_change_logs (key_changed);
CREATE INDEX IF NOT EXISTS idx_change_logs_created ON public.storefront_change_logs (created_at DESC);

-- 3. RLS on storefront_change_logs
ALTER TABLE public.storefront_change_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all change logs
DROP POLICY IF EXISTS storefront_change_logs_admin_read ON public.storefront_change_logs;
CREATE POLICY storefront_change_logs_admin_read ON public.storefront_change_logs
  FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert change log entries
DROP POLICY IF EXISTS storefront_change_logs_admin_insert ON public.storefront_change_logs;
CREATE POLICY storefront_change_logs_admin_insert ON public.storefront_change_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Seed new CMS keys: sections, seo, advanced
-- (No overwrite of existing keys — safe to re-run)
INSERT INTO public.storefront_settings (key, value, type) VALUES

  ('sections', '{
    "sectionOrder": ["hero", "categories", "latest", "showroom", "deals", "cinematic", "recommended"],
    "latest": { "enabled": true, "title": "أحدث المنتجات", "limit": 12 },
    "categories": { "enabled": true, "title": "التصنيفات", "limit": 8 },
    "deals": { "enabled": true, "title": "عروض اليوم 🔥", "limit": 6 },
    "recommended": { "enabled": true, "title": "الأكثر مبيعاً", "limit": 6 },
    "showroom": {
      "enabled": true,
      "title": "المعرض الافتراضي",
      "subtitle": "تجوّل داخل اندكس ستور الفاخر",
      "badge": "جديد · تجربة ثلاثية الأبعاد",
      "link": "/immersive-store"
    },
    "cinematic": { "enabled": true, "videoUrl": "", "posterUrl": "", "title": "", "subtitle": "" },
    "trustBadges": { "enabled": true, "badge1": "شحن سريع", "badge2": "ضمان الجودة", "badge3": "إرجاع سهل" }
  }', 'json'),

  ('seo', '{
    "metaTitle": "اندكس ستور — الرئيسية | تسوّق أونلاين في اليمن",
    "metaDescription": "اكتشف أحدث المنتجات والعروض في اندكس ستور — تجربة تسوق ثلاثية الأبعاد فريدة في اليمن.",
    "ogImage": "",
    "ogImageWidth": 1200,
    "ogImageHeight": 630,
    "themeColor": "#06091f",
    "googleAnalyticsId": "",
    "facebookPixelId": "",
    "sitemapEnabled": true,
    "robotsEnabled": true
  }', 'json'),

  ('advanced', '{
    "sphereParticleCount": 60,
    "sphereGlowIntensity": 1.0,
    "sphereRotationSpeed": 0.3,
    "sphereAutoRotate": true,
    "enableParallax": true,
    "enableLazyLoading": true,
    "enablePwa": false,
    "customStylesJson": "{}"
  }', 'json')

ON CONFLICT (key) DO NOTHING;

-- 5. Update existing navigation seed to include headerLinks array
UPDATE public.storefront_settings
SET value = value || '{
  "logoUrl": "",
  "tagline": "اختيارك الأفضل",
  "searchPlaceholder": "ابحث عن منتج...",
  "showLanguageToggle": true,
  "showCurrencyToggle": false,
  "addressText": "صنعاء - شارع بينون - مقابل صيدلية الرعاية الصحية",
  "deliveryInfoText": "متوفر لدينا خدمة التوصيل لجميع المحافظات 🇾🇪",
  "copyrightText": "جميع الحقوق محفوظة",
  "headerLinks": [
    {"label": "الرئيسية", "to": "/", "icon": "Home", "visible": true, "order": 1, "external": false, "target": "_self"},
    {"label": "العروض", "to": "/offers", "icon": "Tag", "visible": true, "order": 2, "external": false, "target": "_self"},
    {"label": "السلة", "to": "/cart", "icon": "ShoppingCart", "visible": true, "order": 3, "external": false, "target": "_self"},
    {"label": "حسابي", "to": "/account", "icon": "User", "visible": true, "order": 4, "external": false, "target": "_self"}
  ]
}'::jsonb
WHERE key = 'navigation'
  AND NOT (value ? 'headerLinks');

-- 6. Update existing cart_config seed to include new CMS fields
UPDATE public.storefront_settings
SET value = value || '{
  "whatsappPhone": "967770000000",
  "whatsappOrderTemplate": "مرحباً، أريد طلب:\n{products}\nالإجمالي: {total}\nالاسم: {name}\nالعنوان: {address}",
  "floatingBarPosition": "bottom",
  "freeShippingThreshold": 0
}'::jsonb
WHERE key = 'cart_config'
  AND NOT (value ? 'whatsappPhone');

-- 7. Update existing hero seed to include sphereCardShape/showName/showPrice
UPDATE public.storefront_settings
SET value = value || '{
  "sphereCardShape": "rectangle",
  "sphereShowName": true,
  "sphereShowPrice": true,
  "sphereCustomProductIds": [],
  "slides": []
}'::jsonb
WHERE key = 'hero'
  AND NOT (value ? 'sphereCardShape');

-- 8. Update theme with new fields
UPDATE public.storefront_settings
SET value = value || '{
  "backgroundColor": "#06091f",
  "cardStyle": "glass",
  "buttonStyle": "pill",
  "animationSpeed": "normal"
}'::jsonb
WHERE key = 'theme'
  AND NOT (value ? 'cardStyle');

-- 9. Update sectionOrder default to put categories after hero for existing databases
UPDATE public.storefront_settings
SET value = jsonb_set(
  value, 
  '{sectionOrder}', 
  '["hero", "categories", "latest", "showroom", "deals", "cinematic", "recommended"]'::jsonb
)
WHERE key = 'sections'
  AND (
    value -> 'sectionOrder' = '["hero", "latest", "showroom", "categories", "deals", "cinematic", "recommended"]'::jsonb
    OR value -> 'sectionOrder' IS NULL
  );

