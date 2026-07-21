import { z } from "zod";

// ── 1. Hero Schema ────────────────────────────────────────────────────────────

const HeroSlideSchema = z.object({
  id: z.string().catch(""),
  mediaType: z.enum(["image", "video"]).catch("image"),
  mediaUrl: z.string().catch(""),
  badgeText: z.string().catch(""),
  title: z.string().catch(""),
  subtitle: z.string().catch(""),
  ctaText: z.string().catch(""),
  ctaLink: z.string().catch("/"),
  order: z.number().catch(0),
});

export const HeroConfigSchema = z.object({
  enabled: z.boolean().catch(true),
  type: z.enum(["sphere_3d", "banner_image", "video", "cinematic", "simple", "slideshow"]).catch("sphere_3d"),
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
  slides: z.array(HeroSlideSchema).catch([]),
  // 3D Sphere options
  sphereMaxProducts: z.number().min(6).max(120).catch(100),
  sphereRadius: z.number().min(1.0).max(5.0).catch(2.2),
  sphereTileScale: z.number().min(0.2).max(2.0).catch(0.8),
  sphereRotationSpeed: z.number().min(0).max(2).catch(0.3),
  sphereProductSource: z.enum(["all", "bestsellers", "offers", "custom"]).catch("all"),
  sphereCustomProductIds: z.array(z.string()).catch([]),
  sphereCardShape: z.enum(["rectangle", "circle"]).catch("circle"),
  sphereShowName: z.boolean().catch(true),
  sphereShowPrice: z.boolean().catch(true),
});
export type HeroConfig = z.infer<typeof HeroConfigSchema>;
export type HeroSlide = z.infer<typeof HeroSlideSchema>;

// ── 2. Theme Schema ───────────────────────────────────────────────────────────
export const ThemeConfigSchema = z.object({
  primaryColor: z.string().catch("#4f8cff"),
  secondaryColor: z.string().catch("#a259ff"),
  backgroundColor: z.string().catch("#06091f"),
  surfaceColor: z.string().catch("#0d1338"),
  textColor: z.string().catch("#ffffff"),
  borderColor: z.string().catch("rgba(255, 255, 255, 0.12)"),
  fontFamily: z.enum(["Tajawal", "Cairo", "Inter"]).catch("Tajawal"),
  defaultMode: z.enum(["dark", "light", "system"]).catch("dark"),
  showcaseModeEnabled: z.boolean().catch(true),
  borderRadius: z.enum(["sharp", "rounded", "large", "sm", "md", "lg", "xl", "2xl", "full"]).catch("large"),
  cardStyle: z.enum(["glass", "solid", "bordered"]).catch("glass"),
  buttonStyle: z.enum(["pill", "rounded", "square"]).catch("pill"),
  animationSpeed: z.enum(["none", "slow", "normal", "fast"]).catch("normal"),
});
export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;

// ── 3. Products Layout Schema ────────────────────────────────────────────────
export const ProductsLayoutConfigSchema = z.object({
  columnsDesktop: z.number().min(2).max(6).catch(4),
  columnsTablet: z.number().min(1).max(4).catch(3),
  columnsMobile: z.number().min(1).max(2).catch(2),
  cardSize: z.enum(["small", "medium", "large"]).catch("medium"),
  aspectRatio: z.enum(["square", "portrait", "video"]).catch("square"),
  hoverEffect: z.enum(["scale", "glow", "none"]).catch("scale"),
  paginationStyle: z.enum(["infinite", "pages"]).catch("infinite"),
  showImage: z.boolean().catch(true),
  showPrice: z.boolean().catch(true),
  showDiscount: z.boolean().catch(true),
  showRating: z.boolean().catch(true),
  showStock: z.boolean().catch(true),
  showAddToCartButton: z.boolean().catch(true),
  showWaBtn: z.boolean().catch(true),
  showWishlist: z.boolean().catch(true),
  latestProductsLimit: z.number().min(4).max(24).catch(12),
  bestSellersLimit: z.number().min(2).max(12).catch(6),
  dailyDealsLimit: z.number().min(2).max(12).catch(6),
});
export type ProductsLayoutConfig = z.infer<typeof ProductsLayoutConfigSchema>;

// ── 4. Product Page Builder Schema ──────────────────────────────────────────
export const ProductPageConfigSchema = z.object({
  showImages: z.boolean().catch(true),
  showVideo: z.boolean().catch(true),
  show3DModel: z.boolean().catch(true),
  showDescription: z.boolean().catch(true),
  showWaBtn: z.boolean().catch(true),
  showCartBtn: z.boolean().catch(true),
  showRelatedProducts: z.boolean().catch(true),
  showRecommendedProducts: z.boolean().catch(true),
});
export type ProductPageConfig = z.infer<typeof ProductPageConfigSchema>;

// ── 5. Cart Config Schema ─────────────────────────────────────────────────────
export const CartConfigSchema = z.object({
  cartStyle: z.enum(["drawer", "page", "modal"]).catch("page"),
  checkoutBtnPosition: z.enum(["bottom_fixed", "inline", "both"]).catch("bottom_fixed"),
  whatsappEnabled: z.boolean().catch(true),
  whatsappPhone: z.string().catch("967770000000"),
  whatsappOrderTemplate: z
    .string()
    .catch(
      "مرحباً، أريد طلب:\n{products}\nالإجمالي: {total}\nالاسم: {name}\nالعنوان: {address}"
    ),
  floatingBarEnabled: z.boolean().catch(true),
  floatingBarPosition: z.enum(["top", "bottom"]).catch("bottom"),
  quickWhatsAppOrder: z.boolean().catch(true),
  couponFieldEnabled: z.boolean().catch(true),
  deliveryFormEnabled: z.boolean().catch(true),
  defaultShippingText: z.string().catch("يتم الاتفاق عليه"),
  freeShippingThreshold: z.number().min(0).catch(0),
});
export type CartConfig = z.infer<typeof CartConfigSchema>;

// ── 6. Navigation & Footer Schema ─────────────────────────────────────────────
const HeaderLinkSchema = z.object({
  label: z.string().catch(""),
  to: z.string().catch("/"),
  icon: z.string().catch("Home"),
  visible: z.boolean().catch(true),
  order: z.number().catch(0),
  external: z.boolean().catch(false),
  target: z.enum(["_self", "_blank"]).catch("_self"),
});
export type HeaderLink = z.infer<typeof HeaderLinkSchema>;

export const NavigationConfigSchema = z.object({
  storeName: z.string().catch("اندكس ستور"),
  tagline: z.string().catch("اختيارك الأفضل"),
  logoUrl: z.string().catch(""),
  searchPlaceholder: z.string().catch("ابحث عن منتج..."),
  searchEnabled: z.boolean().catch(true),
  showLanguageToggle: z.boolean().catch(true),
  showCurrencyToggle: z.boolean().catch(false),
  whatsappPhone: z.string().catch("967770000000"),
  supportEmail: z.string().catch("support@indexes-store.com"),
  addressText: z.string().catch("صنعاء - شارع بينون - مقابل صيدلية الرعاية الصحية"),
  deliveryInfoText: z.string().catch("متوفر لدينا خدمة التوصيل لجميع المحافظات 🇾🇪"),
  footerDescription: z
    .string()
    .catch("المتجر اليمني الإلكتروني الرائد للتسوق الفاخر والتجربة ثلاثية الأبعاد."),
  copyrightText: z.string().catch("جميع الحقوق محفوظة"),
  socialLinks: z
    .object({
      facebook: z.string().catch("https://facebook.com"),
      instagram: z.string().catch("https://instagram.com"),
      twitter: z.string().catch("https://x.com"),
    })
    .catch({
      facebook: "https://facebook.com",
      instagram: "https://instagram.com",
      twitter: "https://x.com",
    }),
  headerLinks: z
    .array(HeaderLinkSchema)
    .catch([
      { label: "الرئيسية", to: "/", icon: "Home", visible: true, order: 1, external: false, target: "_self" },
      { label: "العروض", to: "/offers", icon: "Tag", visible: true, order: 2, external: false, target: "_self" },
      { label: "السلة", to: "/cart", icon: "ShoppingCart", visible: true, order: 3, external: false, target: "_self" },
      { label: "حسابي", to: "/account", icon: "User", visible: true, order: 4, external: false, target: "_self" },
    ]),
});
export type NavigationConfig = z.infer<typeof NavigationConfigSchema>;

// ── 7. Sections Schema ───────────────────────────────────────────────────────
const SectionItemSchema = z.object({
  enabled: z.boolean().catch(true),
  title: z.string().catch(""),
  subtitle: z.string().catch(""),
  limit: z.number().catch(6),
});

const ShowroomSectionSchema = z.object({
  enabled: z.boolean().catch(true),
  title: z.string().catch("المعرض الافتراضي"),
  subtitle: z.string().catch("تجوّل داخل اندكس ستور الفاخر"),
  badge: z.string().catch("جديد · تجربة ثلاثية الأبعاد"),
  link: z.string().catch("/immersive-store"),
});

const CinematicSectionSchema = z.object({
  enabled: z.boolean().catch(true),
  videoUrl: z.string().catch(""),
  posterUrl: z.string().catch(""),
  title: z.string().catch(""),
  subtitle: z.string().catch(""),
});

const TrustBadgesSectionSchema = z.object({
  enabled: z.boolean().catch(true),
  badge1: z.string().catch("شحن سريع"),
  badge2: z.string().catch("ضمان الجودة"),
  badge3: z.string().catch("إرجاع سهل"),
});

export const SectionsConfigSchema = z.object({
  sectionOrder: z
    .array(z.string())
    .catch(["hero", "categories", "latest", "showroom", "deals", "cinematic", "recommended"]),
  latest: SectionItemSchema.catch({ enabled: true, title: "أحدث المنتجات", subtitle: "", limit: 12 }),
  categories: SectionItemSchema.catch({ enabled: true, title: "التصنيفات", subtitle: "", limit: 8 }),
  deals: SectionItemSchema.catch({ enabled: true, title: "عروض اليوم 🔥", subtitle: "", limit: 6 }),
  recommended: SectionItemSchema.catch({ enabled: true, title: "الأكثر مبيعاً", subtitle: "", limit: 6 }),
  showroom: ShowroomSectionSchema.catch({
    enabled: true,
    title: "المعرض الافتراضي",
    subtitle: "تجوّل داخل اندكس ستور الفاخر",
    badge: "جديد · تجربة ثلاثية الأبعاد",
    link: "/immersive-store",
  }),
  cinematic: CinematicSectionSchema.catch({
    enabled: true,
    videoUrl: "",
    posterUrl: "",
    title: "",
    subtitle: "",
  }),
  trustBadges: TrustBadgesSectionSchema.catch({
    enabled: true,
    badge1: "شحن سريع",
    badge2: "ضمان الجودة",
    badge3: "إرجاع سهل",
  }),
});
export type SectionsConfig = z.infer<typeof SectionsConfigSchema>;

// ── 8. SEO Schema ────────────────────────────────────────────────────────────
export const SeoConfigSchema = z.object({
  metaTitle: z.string().catch("اندكس ستور — الرئيسية | تسوّق أونلاين في اليمن"),
  metaDescription: z
    .string()
    .catch("اكتشف أحدث المنتجات والعروض في اندكس ستور — تجربة تسوق ثلاثية الأبعاد فريدة في اليمن."),
  ogImage: z.string().catch(""),
  ogImageWidth: z.number().catch(1200),
  ogImageHeight: z.number().catch(630),
  twitterCard: z.enum(["summary", "summary_large_image"]).catch("summary_large_image"),
  themeColor: z.string().catch("#06091f"),
  googleAnalyticsId: z.string().catch(""),
  facebookPixelId: z.string().catch(""),
  sitemapEnabled: z.boolean().catch(true),
  robotsEnabled: z.boolean().catch(true),
});
export type SeoConfig = z.infer<typeof SeoConfigSchema>;

// ── 9. Advanced Config Schema ─────────────────────────────────────────────────
// NOTE: customJs injection is intentionally excluded for security.
// customStylesJson allows only validated CSS variable key-value objects.
export const AdvancedConfigSchema = z.object({
  sphereParticleCount: z.number().min(0).max(500).catch(60),
  sphereGlowIntensity: z.number().min(0).max(3).catch(1.0),
  sphereRotationSpeed: z.number().min(0).max(2).catch(0.3),
  sphereAutoRotate: z.boolean().catch(true),
  enableParallax: z.boolean().catch(true),
  enableLazyLoading: z.boolean().catch(true),
  enablePwa: z.boolean().catch(false),
  customStylesJson: z.string().catch("{}"),
});
export type AdvancedConfig = z.infer<typeof AdvancedConfigSchema>;

// ── 10. Full Storefront Settings Shape ─────────────────────────────────────────
export interface StorefrontSettingsShape {
  hero: HeroConfig;
  theme: ThemeConfig;
  products_layout: ProductsLayoutConfig;
  product_page: ProductPageConfig;
  cart_config: CartConfig;
  navigation: NavigationConfig;
  sections: SectionsConfig;
  seo: SeoConfig;
  advanced: AdvancedConfig;
}

// ── 11. Safe Default Fallback Constants ────────────────────────────────────────
export const DEFAULT_HERO_CONFIG: HeroConfig = HeroConfigSchema.parse({});
export const DEFAULT_THEME_CONFIG: ThemeConfig = ThemeConfigSchema.parse({});
export const DEFAULT_PRODUCTS_LAYOUT_CONFIG: ProductsLayoutConfig = ProductsLayoutConfigSchema.parse({});
export const DEFAULT_PRODUCT_PAGE_CONFIG: ProductPageConfig = ProductPageConfigSchema.parse({});
export const DEFAULT_CART_CONFIG: CartConfig = CartConfigSchema.parse({});
export const DEFAULT_NAVIGATION_CONFIG: NavigationConfig = NavigationConfigSchema.parse({});
export const DEFAULT_SECTIONS_CONFIG: SectionsConfig = SectionsConfigSchema.parse({});
export const DEFAULT_SEO_CONFIG: SeoConfig = SeoConfigSchema.parse({});
export const DEFAULT_ADVANCED_CONFIG: AdvancedConfig = AdvancedConfigSchema.parse({});

export const DEFAULT_STOREFRONT_SETTINGS: StorefrontSettingsShape = {
  hero: DEFAULT_HERO_CONFIG,
  theme: DEFAULT_THEME_CONFIG,
  products_layout: DEFAULT_PRODUCTS_LAYOUT_CONFIG,
  product_page: DEFAULT_PRODUCT_PAGE_CONFIG,
  cart_config: DEFAULT_CART_CONFIG,
  navigation: DEFAULT_NAVIGATION_CONFIG,
  sections: DEFAULT_SECTIONS_CONFIG,
  seo: DEFAULT_SEO_CONFIG,
  advanced: DEFAULT_ADVANCED_CONFIG,
};
