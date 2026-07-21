import { z } from "zod";

// ── 1. Hero Schema ────────────────────────────────────────────────────────────
export const HeroConfigSchema = z.object({
  enabled: z.boolean().catch(true),
  type: z.enum(["sphere_3d", "cinematic", "banner_image", "video"]).catch("sphere_3d"),
  badgeText: z.string().catch("INDEXES · LIVE SHOWCASE"),
  title: z.string().catch("معرض المنتجات الذكي"),
  subtitle: z.string().catch("اسحب الكرة — كل وجه منتج، اضغط لتفتحه"),
  bannerImageUrl: z.string().catch(""),
  bannerVideoUrl: z.string().catch(""),
  ctaText: z.string().catch("تصفح العروض الحصرية"),
  ctaLink: z.string().catch("/offers"),
  secondaryCtaText: z.string().catch("المعرض الافتراضي"),
  secondaryCtaLink: z.string().catch("/immersive-store"),
  showParticles: z.boolean().catch(true),
  sphereMaxProducts: z.number().min(6).max(120).catch(28),
  sphereRadius: z.number().min(1.0).max(5.0).catch(2.2),
  sphereTileScale: z.number().min(0.2).max(2.0).catch(0.8),
  sphereProductSource: z.enum(["all", "bestsellers", "offers", "custom"]).catch("all"),
  sphereCustomProductIds: z.array(z.string()).catch([]),
  sphereCardShape: z.enum(["rectangle", "circle"]).catch("rectangle"),
  sphereShowName: z.boolean().catch(true),
  sphereShowPrice: z.boolean().catch(true),
});
export type HeroConfig = z.infer<typeof HeroConfigSchema>;

// ── 2. Theme Schema ───────────────────────────────────────────────────────────
export const ThemeConfigSchema = z.object({
  primaryColor: z.string().catch("#4f8cff"),
  secondaryColor: z.string().catch("#a259ff"),
  fontFamily: z.string().catch("Tajawal"),
  defaultMode: z.enum(["dark", "light", "system"]).catch("dark"),
  showcaseModeEnabled: z.boolean().catch(true),
  borderRadius: z.enum(["sm", "md", "lg", "xl", "2xl", "full"]).catch("xl"),
});
export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;

// ── 3. Products Layout Schema ────────────────────────────────────────────────
export const ProductsLayoutConfigSchema = z.object({
  columnsDesktop: z.number().min(2).max(6).catch(6),
  columnsMobile: z.number().min(1).max(2).catch(2),
  cardSize: z.enum(["small", "medium", "large"]).catch("medium"),
  showPrice: z.boolean().catch(true),
  showDiscount: z.boolean().catch(true),
  showRating: z.boolean().catch(true),
  showAddToCartButton: z.boolean().catch(true),
  latestProductsLimit: z.number().min(4).max(24).catch(12),
  bestSellersLimit: z.number().min(2).max(12).catch(6),
  dailyDealsLimit: z.number().min(2).max(12).catch(6),
});
export type ProductsLayoutConfig = z.infer<typeof ProductsLayoutConfigSchema>;

// ── 4. Cart Config Schema ─────────────────────────────────────────────────────
export const CartConfigSchema = z.object({
  floatingBarEnabled: z.boolean().catch(true),
  quickWhatsAppOrder: z.boolean().catch(true),
  couponFieldEnabled: z.boolean().catch(true),
  deliveryFormEnabled: z.boolean().catch(true),
  defaultShippingText: z.string().catch("يتم الاتفاق عليه"),
});
export type CartConfig = z.infer<typeof CartConfigSchema>;

// ── 5. Navigation & Footer Schema ─────────────────────────────────────────────
export const NavigationConfigSchema = z.object({
  storeName: z.string().catch("اندكس ستور"),
  whatsappPhone: z.string().catch("967770000000"),
  supportEmail: z.string().catch("support@indexes-store.com"),
  footerDescription: z.string().catch("المتجر اليمني الإلكتروني الرائد للتسوق الفاخر والتجربة ثلاثية الأبعاد."),
  socialLinks: z.object({
    facebook: z.string().catch("https://facebook.com"),
    instagram: z.string().catch("https://instagram.com"),
    twitter: z.string().catch("https://x.com"),
  }).catch({
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    twitter: "https://x.com",
  }),
});
export type NavigationConfig = z.infer<typeof NavigationConfigSchema>;

// ── 6. Full Storefront Settings Shape ─────────────────────────────────────────
export interface StorefrontSettingsShape {
  hero: HeroConfig;
  theme: ThemeConfig;
  products_layout: ProductsLayoutConfig;
  cart_config: CartConfig;
  navigation: NavigationConfig;
}

// ── 7. Safe Default Fallback Constants ───────────────────────────────────────
export const DEFAULT_HERO_CONFIG: HeroConfig = HeroConfigSchema.parse({});
export const DEFAULT_THEME_CONFIG: ThemeConfig = ThemeConfigSchema.parse({});
export const DEFAULT_PRODUCTS_LAYOUT_CONFIG: ProductsLayoutConfig = ProductsLayoutConfigSchema.parse({});
export const DEFAULT_CART_CONFIG: CartConfig = CartConfigSchema.parse({});
export const DEFAULT_NAVIGATION_CONFIG: NavigationConfig = NavigationConfigSchema.parse({});

export const DEFAULT_STOREFRONT_SETTINGS: StorefrontSettingsShape = {
  hero: DEFAULT_HERO_CONFIG,
  theme: DEFAULT_THEME_CONFIG,
  products_layout: DEFAULT_PRODUCTS_LAYOUT_CONFIG,
  cart_config: DEFAULT_CART_CONFIG,
  navigation: DEFAULT_NAVIGATION_CONFIG,
};
