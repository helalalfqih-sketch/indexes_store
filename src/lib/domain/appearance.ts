import { z } from "zod";

// ── 1. Hero Schema ────────────────────────────────────────────────────────────
export const HeroConfigSchema = z.object({
  enabled: z.boolean().default(true),
  type: z.enum(["sphere_3d", "cinematic", "banner_image", "video"]).default("sphere_3d"),
  badgeText: z.string().default("INDEXES · LIVE SHOWCASE"),
  title: z.string().default("معرض المنتجات الذكي"),
  subtitle: z.string().default("اسحب الكرة — كل وجه منتج، اضغط لتفتحه"),
  bannerImageUrl: z.string().default(""),
  bannerVideoUrl: z.string().default(""),
  ctaText: z.string().default("تصفح العروض الحصرية"),
  ctaLink: z.string().default("/offers"),
  secondaryCtaText: z.string().default("المعرض الافتراضي"),
  secondaryCtaLink: z.string().default("/immersive-store"),
  showParticles: z.boolean().default(true),
  sphereMaxProducts: z.number().min(6).max(40).default(28),
  sphereRadius: z.number().min(1.5).max(3.5).default(2.2),
  sphereTileScale: z.number().min(0.4).max(1.5).default(0.8),
  sphereProductSource: z.enum(["all", "bestsellers", "offers"]).default("all"),
});
export type HeroConfig = z.infer<typeof HeroConfigSchema>;

// ── 2. Theme Schema ───────────────────────────────────────────────────────────
export const ThemeConfigSchema = z.object({
  primaryColor: z.string().default("#4f8cff"),
  secondaryColor: z.string().default("#a259ff"),
  fontFamily: z.string().default("Tajawal"),
  defaultMode: z.enum(["dark", "light", "system"]).default("dark"),
  showcaseModeEnabled: z.boolean().default(true),
  borderRadius: z.enum(["sm", "md", "lg", "xl", "2xl", "full"]).default("xl"),
});
export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;

// ── 3. Products Layout Schema ────────────────────────────────────────────────
export const ProductsLayoutConfigSchema = z.object({
  columnsDesktop: z.number().min(2).max(6).default(6),
  columnsMobile: z.number().min(1).max(2).default(2),
  cardSize: z.enum(["small", "medium", "large"]).default("medium"),
  showPrice: z.boolean().default(true),
  showDiscount: z.boolean().default(true),
  showRating: z.boolean().default(true),
  showAddToCartButton: z.boolean().default(true),
  latestProductsLimit: z.number().min(4).max(24).default(12),
  bestSellersLimit: z.number().min(2).max(12).default(6),
  dailyDealsLimit: z.number().min(2).max(12).default(6),
});
export type ProductsLayoutConfig = z.infer<typeof ProductsLayoutConfigSchema>;

// ── 4. Cart Config Schema ─────────────────────────────────────────────────────
export const CartConfigSchema = z.object({
  floatingBarEnabled: z.boolean().default(true),
  quickWhatsAppOrder: z.boolean().default(true),
  couponFieldEnabled: z.boolean().default(true),
  deliveryFormEnabled: z.boolean().default(true),
  defaultShippingText: z.string().default("يتم الاتفاق عليه"),
});
export type CartConfig = z.infer<typeof CartConfigSchema>;

// ── 5. Navigation & Footer Schema ─────────────────────────────────────────────
export const NavigationConfigSchema = z.object({
  storeName: z.string().default("اندكس ستور"),
  whatsappPhone: z.string().default("967770000000"),
  supportEmail: z.string().default("support@indexes-store.com"),
  footerDescription: z.string().default("المتجر اليمني الإلكتروني الرائد للتسوق الفاخر والتجربة ثلاثية الأبعاد."),
  socialLinks: z.object({
    facebook: z.string().default("https://facebook.com"),
    instagram: z.string().default("https://instagram.com"),
    twitter: z.string().default("https://x.com"),
  }).default({
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
