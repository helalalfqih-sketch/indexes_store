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
  type: z.enum(["sphere_3d", "cinematic", "banner_image", "video", "slideshow"]).catch("sphere_3d"),
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
  whatsappPhone: z.string().catch("967771370740"),
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

// ── 6. Checkout Builder Schema ────────────────────────────────────────────────
const ShippingRateSchema = z.object({
  city: z.string().catch(""),
  rate: z.number().catch(0),
});

export const CheckoutConfigSchema = z.object({
  requirePhone: z.boolean().catch(true),
  requireAddress: z.boolean().catch(true),
  requireEmail: z.boolean().catch(false),
  codEnabled: z.boolean().catch(true),
  shippingRates: z.array(ShippingRateSchema).catch([]),
});
export type CheckoutConfig = z.infer<typeof CheckoutConfigSchema>;
export type ShippingRate = z.infer<typeof ShippingRateSchema>;

// ── 7. Navigation & Footer Schema ─────────────────────────────────────────────
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
  whatsappPhone: z.string().catch("967771370740"),
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
      tiktok: z.string().catch("https://tiktok.com"),
      twitter: z.string().catch("https://x.com"),
    })
    .catch({
      facebook: "https://facebook.com",
      instagram: "https://instagram.com",
      tiktok: "https://tiktok.com",
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

// ── 8. Pages CMS Schema ──────────────────────────────────────────────────────
const CustomPageSchema = z.object({
  id: z.string().catch(""),
  slug: z.string().catch(""),
  title: z.string().catch(""),
  content: z.string().catch(""),
  isPublished: z.boolean().catch(true),
});
export type CustomPage = z.infer<typeof CustomPageSchema>;

export const PagesConfigSchema = z.object({
  pages: z.array(CustomPageSchema).catch([]),
});
export type PagesConfig = z.infer<typeof PagesConfigSchema>;

// ── 9. Translation CMS Schema ────────────────────────────────────────────────
export const TranslationConfigSchema = z.object({
  addToCart: z.string().catch("أضف إلى السلة"),
  checkout: z.string().catch("إتمام الطلب"),
  quickOrder: z.string().catch("طلب سريع عبر واتساب"),
  emptyCart: z.string().catch("سلتك فارغة"),
  searchPlaceholder: z.string().catch("ابحث عن منتج..."),
});
export type TranslationConfig = z.infer<typeof TranslationConfigSchema>;

// ── 10. Notification Center Schema ──────────────────────────────────────────
export const NotificationsConfigSchema = z.object({
  announcementEnabled: z.boolean().catch(false),
  announcementText: z.string().catch("شحن مجاني للطلبات فوق 50,000 ريال يمني! 🚚"),
  announcementBg: z.string().catch("#4f8cff"),
  popupEnabled: z.boolean().catch(false),
  popupTitle: z.string().catch("احصل على خصم 10%"),
  popupText: z.string().catch("استخدم الكوبون FIRST10 عند إتمام طلبك الأول!"),
  popupImage: z.string().catch(""),
  popupCta: z.string().catch("احصل على الكوبون"),
  popupLink: z.string().catch("/offers"),
});
export type NotificationsConfig = z.infer<typeof NotificationsConfigSchema>;

// ── 11. Sections Schema ───────────────────────────────────────────────────────
const SectionItemSchema = z.object({
  enabled: z.boolean().catch(true),
  title: z.string().catch(""),
  subtitle: z.string().catch(""),
  limit: z.number().catch(6),
  sort_order: z.number().catch(0),
  data_source: z.enum(["all", "bestsellers", "offers", "custom"]).catch("all"),
  customProductIds: z.array(z.string()).catch([]),
});

const DealsSectionSchema = SectionItemSchema.extend({
  deal_start: z.string().catch(""),
  deal_end: z.string().catch(""),
  discount_percent: z.number().catch(0),
});

const FeaturedProductSectionSchema = z.object({
  enabled: z.boolean().catch(true),
  productId: z.string().catch(""),
  title: z.string().catch("المنتج المميز ⭐"),
  subtitle: z.string().catch("اختيارنا الخاص لهذا اليوم"),
  badge: z.string().catch("أفضل قيمة"),
});

const TestimonialsSectionSchema = z.object({
  enabled: z.boolean().catch(true),
  title: z.string().catch("آراء العملاء"),
  subtitle: z.string().catch("ماذا يقول عملاؤنا عن اندكس ستور"),
  items: z
    .array(
      z.object({
        name: z.string().catch(""),
        city: z.string().catch(""),
        comment: z.string().catch(""),
        rating: z.number().catch(5),
      })
    )
    .catch([
      { name: "أحمد باحارث", city: "صنعاء", comment: "متجر رائع جداً والتوصيل سريع جداً إلى باب البيت!", rating: 5 },
      { name: "محمد العولقي", city: "عدن", comment: "تجربة التسوق ثلاثية الأبعاد خيالية وممتازة.", rating: 5 },
      { name: "سارة الحيمي", city: "تعز", comment: "منتجات ذات جودة عالية وتغليف ممتاز.", rating: 5 },
    ]),
});

const WhatsappCtaSectionSchema = z.object({
  enabled: z.boolean().catch(true),
  title: z.string().catch("هل تحتاج مساعدة في الطلب؟"),
  subtitle: z.string().catch("فريق خدمة العملاء متواجد على مدار الساعة على واتساب"),
  buttonText: z.string().catch("تواصل معنا عبر واتساب 💬"),
  phone: z.string().catch("967771370740"),
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
    .catch(["hero", "featured_product", "categories", "latest", "showroom", "deals", "recommended", "testimonials", "whatsapp_cta", "cinematic"]),
  latest: SectionItemSchema.catch({ enabled: true, title: "أحدث المنتجات", subtitle: "", limit: 12, sort_order: 3, data_source: "all", customProductIds: [] }),
  categories: SectionItemSchema.catch({ enabled: true, title: "التصنيفات", subtitle: "", limit: 8, sort_order: 2, data_source: "all", customProductIds: [] }),
  deals: DealsSectionSchema.catch({ enabled: true, title: "عروض اليوم 🔥", subtitle: "خصومات لفترة محدودة", limit: 6, sort_order: 5, data_source: "offers", customProductIds: [], deal_start: "", deal_end: "", discount_percent: 0 }),
  recommended: SectionItemSchema.catch({ enabled: true, title: "الأكثر مبيعاً", subtitle: "", limit: 6, sort_order: 6, data_source: "bestsellers", customProductIds: [] }),
  featuredProduct: FeaturedProductSectionSchema.catch({ enabled: true, productId: "", title: "المنتج المميز ⭐", subtitle: "اختيارنا الخاص لهذا اليوم", badge: "أفضل قيمة" }),
  testimonials: TestimonialsSectionSchema.catch({ enabled: true, title: "آراء العملاء", subtitle: "ماذا يقول عملاؤنا عن اندكس ستور", items: [] }),
  whatsappCta: WhatsappCtaSectionSchema.catch({ enabled: true, title: "هل تحتاج مساعدة في الطلب؟", subtitle: "تواصل معنا عبر واتساب", buttonText: "تواصل معنا عبر واتساب 💬", phone: "967771370740" }),
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

// ── 12. Store Identity Schema ─────────────────────────────────────────────────
export const StoreIdentitySchema = z.object({
  logoUrl: z.string().catch(""),
  faviconUrl: z.string().catch("/favicon.ico"),
  appleTouchIconUrl: z.string().catch(""),
  pwaIcon192Url: z.string().catch(""),
  pwaIcon512Url: z.string().catch(""),
  themeColor: z.string().catch("#1F5EFF"),
});
export type StoreIdentity = z.infer<typeof StoreIdentitySchema>;

// ── 13. Brand Settings Schema ─────────────────────────────────────────────────
export const BrandSettingsSchema = z.object({
  storeName: z.string().catch("اندكس ستور"),
  shortName: z.string().catch("NOQTA"),
  description: z.string().catch("المتجر اليمني الإلكتروني الرائد للتسوق الفاخر والتجربة ثلاثية الأبعاد."),
  tagline: z.string().catch("اختيارك الأفضل"),
  primaryColor: z.string().catch("#4f8cff"),
  secondaryColor: z.string().catch("#a259ff"),
  accentColor: z.string().catch("#ff6b35"),
});
export type BrandSettings = z.infer<typeof BrandSettingsSchema>;

// ── 14. Social Links Schema ──────────────────────────────────────────────────
const SocialLinkItemSchema = z.object({
  url: z.string().catch(""),
  enabled: z.boolean().catch(false),
});

export const SocialLinksSettingsSchema = z.object({
  facebook: SocialLinkItemSchema.catch({ url: "https://facebook.com/indexes.store", enabled: true }),
  instagram: SocialLinkItemSchema.catch({ url: "https://instagram.com/indexes.store", enabled: true }),
  tiktok: SocialLinkItemSchema.catch({ url: "", enabled: false }),
  youtube: SocialLinkItemSchema.catch({ url: "", enabled: false }),
  whatsapp: SocialLinkItemSchema.catch({ url: "https://wa.me/967771370740", enabled: true }),
  telegram: SocialLinkItemSchema.catch({ url: "", enabled: false }),
});
export type SocialLinksSettings = z.infer<typeof SocialLinksSettingsSchema>;

// ── 15. General Store Settings Schema ────────────────────────────────────────
export const GeneralStoreSettingsSchema = z.object({
  phone: z.string().catch("967771370740"),
  whatsapp: z.string().catch("967771370740"),
  email: z.string().catch("support@indexes-store.com"),
  address: z.string().catch("صنعاء - شارع بينون - مقابل صيدلية الرعاية الصحية"),
  currency: z.string().catch("YER"),
  language: z.string().catch("ar"),
  country: z.string().catch("اليمن"),
  city: z.string().catch("صنعاء"),
  workingHours: z.string().catch("يومياً 9:00 ص - 10:00 م"),
});
export type GeneralStoreSettings = z.infer<typeof GeneralStoreSettingsSchema>;

// ── 16. SEO Schema ────────────────────────────────────────────────────────────
export const SeoConfigSchema = z
  .object({
    metaTitle: z.string().catch("اندكس ستور — الرئيسية | تسوّق أونلاين في اليمن"),
    metaDescription: z
      .string()
      .catch("اكتشف أحدث المنتجات والعروض في اندكس ستور — تجربة تسوق ثلاثية الأبعاد فريدة في اليمن."),
    ogImage: z.string().catch(""),
    ogImageWidth: z.number().catch(1200),
    ogImageHeight: z.number().catch(630),
    ogTitle: z.string().catch(""),
    ogDescription: z.string().catch(""),
    twitterCard: z.enum(["summary", "summary_large_image"]).catch("summary_large_image"),
    twitterUsername: z.string().catch(""),
    themeColor: z.string().catch("#06091f"),
    googleAnalyticsId: z.string().catch(""),
    facebookPixelId: z.string().catch(""),
    googleVerificationCode: z.string().catch(""),
    bingVerificationCode: z.string().catch(""),
    siteName: z.string().catch(""),
    alternateName: z.string().catch(""),
    sitemapEnabled: z.boolean().catch(true),
    robotsEnabled: z.boolean().catch(true),
    canonicalBaseUrl: z.string().catch(""),
    robotsCustomDirectives: z
      .string()
      .catch(
        "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /checkout/\nDisallow: /account/\nSitemap: /sitemap.xml"
      ),
    schemaOrgName: z.string().catch("اندكس ستور"),
    schemaOrgLogo: z.string().catch(""),
    schemaPhone: z.string().catch("+967771370740"),
    schemaEmail: z.string().catch("support@indexes-store.com"),
    schemaAddressStreet: z.string().catch("شارع بينون"),
    schemaAddressCity: z.string().catch("صنعاء"),
    schemaPriceRange: z.string().catch("$$"),
    // LocalBusiness Schema
    schemaBusinessName: z.string().catch(""),
    schemaCountry: z.string().catch("اليمن"),
    schemaOpeningHours: z.string().catch("يومياً 9:00 ص - 10:00 م"),
  })
  .passthrough();
export type SeoConfig = z.infer<typeof SeoConfigSchema>;

// ── 17. Advanced Config Schema ─────────────────────────────────────────────────
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

// ── 18. Full Storefront Settings Shape ─────────────────────────────────────────
export interface StorefrontSettingsShape {
  hero: HeroConfig;
  theme: ThemeConfig;
  products_layout: ProductsLayoutConfig;
  product_page: ProductPageConfig;
  cart_config: CartConfig;
  checkout: CheckoutConfig;
  navigation: NavigationConfig;
  pages: PagesConfig;
  translation: TranslationConfig;
  notifications: NotificationsConfig;
  sections: SectionsConfig;
  seo: SeoConfig;
  advanced: AdvancedConfig;
  store_identity: StoreIdentity;
  brand_settings: BrandSettings;
  social_links: SocialLinksSettings;
  general_settings: GeneralStoreSettings;
}

// ── 19. Safe Default Fallback Constants ────────────────────────────────────────
export const DEFAULT_HERO_CONFIG: HeroConfig = HeroConfigSchema.parse({});
export const DEFAULT_THEME_CONFIG: ThemeConfig = ThemeConfigSchema.parse({});
export const DEFAULT_PRODUCTS_LAYOUT_CONFIG: ProductsLayoutConfig = ProductsLayoutConfigSchema.parse({});
export const DEFAULT_PRODUCT_PAGE_CONFIG: ProductPageConfig = ProductPageConfigSchema.parse({});
export const DEFAULT_CART_CONFIG: CartConfig = CartConfigSchema.parse({});
export const DEFAULT_CHECKOUT_CONFIG: CheckoutConfig = CheckoutConfigSchema.parse({});
export const DEFAULT_NAVIGATION_CONFIG: NavigationConfig = NavigationConfigSchema.parse({});
export const DEFAULT_PAGES_CONFIG: PagesConfig = PagesConfigSchema.parse({});
export const DEFAULT_TRANSLATION_CONFIG: TranslationConfig = TranslationConfigSchema.parse({});
export const DEFAULT_NOTIFICATIONS_CONFIG: NotificationsConfig = NotificationsConfigSchema.parse({});
export const DEFAULT_SECTIONS_CONFIG: SectionsConfig = SectionsConfigSchema.parse({});
export const DEFAULT_SEO_CONFIG: SeoConfig = SeoConfigSchema.parse({});
export const DEFAULT_ADVANCED_CONFIG: AdvancedConfig = AdvancedConfigSchema.parse({});
export const DEFAULT_STORE_IDENTITY: StoreIdentity = StoreIdentitySchema.parse({});
export const DEFAULT_BRAND_SETTINGS: BrandSettings = BrandSettingsSchema.parse({});
export const DEFAULT_SOCIAL_LINKS: SocialLinksSettings = SocialLinksSettingsSchema.parse({});
export const DEFAULT_GENERAL_SETTINGS: GeneralStoreSettings = GeneralStoreSettingsSchema.parse({});

export const DEFAULT_STOREFRONT_SETTINGS: StorefrontSettingsShape = {
  hero: DEFAULT_HERO_CONFIG,
  theme: DEFAULT_THEME_CONFIG,
  products_layout: DEFAULT_PRODUCTS_LAYOUT_CONFIG,
  product_page: DEFAULT_PRODUCT_PAGE_CONFIG,
  cart_config: DEFAULT_CART_CONFIG,
  checkout: DEFAULT_CHECKOUT_CONFIG,
  navigation: DEFAULT_NAVIGATION_CONFIG,
  pages: DEFAULT_PAGES_CONFIG,
  translation: DEFAULT_TRANSLATION_CONFIG,
  notifications: DEFAULT_NOTIFICATIONS_CONFIG,
  sections: DEFAULT_SECTIONS_CONFIG,
  seo: DEFAULT_SEO_CONFIG,
  advanced: DEFAULT_ADVANCED_CONFIG,
  store_identity: DEFAULT_STORE_IDENTITY,
  brand_settings: DEFAULT_BRAND_SETTINGS,
  social_links: DEFAULT_SOCIAL_LINKS,
  general_settings: DEFAULT_GENERAL_SETTINGS,
};
