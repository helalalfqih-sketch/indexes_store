import {
  DEFAULT_STOREFRONT_SETTINGS,
  type StorefrontSettingsShape,
} from "@/lib/domain/appearance";

export interface MappedStorefrontSettings {
  hero: {
    enabled: boolean;
    type: "sphere_3d" | "cinematic" | "banner_image" | "video" | "slideshow";
    badgeText: string;
    title: string;
    subtitle: string;
    bannerImageUrl: string;
    bannerVideoUrl: string;
    ctaText: string;
    ctaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    showParticles: boolean;
    slides: Array<{
      id: string;
      mediaType: "image" | "video";
      mediaUrl: string;
      badgeText: string;
      title: string;
      subtitle: string;
      ctaText: string;
      ctaLink: string;
      order: number;
    }>;
    globe: {
      maxProducts: number;
      radius: number;
      tileScale: number;
      rotationSpeed: number;
      productSource: "all" | "bestsellers" | "offers" | "custom";
      cardShape: "rectangle" | "circle";
      showName: boolean;
      showPrice: boolean;
      badgeText: string;
      titleText: string;
      subtitleText: string;
      titleFontSize: number;
      subtitleFontSize: number;
    };
  };
  sections: {
    sectionOrder: string[];
    latest: { enabled: boolean; title: string; limit: number };
    deals: { enabled: boolean; title: string; limit: number };
    recommended: { enabled: boolean; title: string; limit: number };
    categories: { enabled: boolean; title: string; limit: number };
    showroom: { enabled: boolean; title: string; subtitle: string; badge: string; link: string };
    cinematic: { enabled: boolean; title: string; subtitle: string; videoUrl: string; posterUrl: string };
    whatsappCta: { enabled: boolean; title: string; subtitle: string; buttonText: string; phone: string };
    testimonials: { enabled: boolean; title: string; subtitle: string };
    trustBadges: { enabled: boolean; badge1: string; badge2: string; badge3: string; badge4: string };
  };
  shipping: {
    deliveryText: string;
    freeText: string;
    threshold: number;
    shippingFee: number;
  };
  contact: {
    storeName: string;
    tagline: string;
    description: string;
    address: string;
    deliveryInfoText: string;
    phone: string;
    whatsappPhone: string;
    supportEmail: string;
    socialLinks: {
      facebook: string;
      instagram: string;
      tiktok: string;
      twitter: string;
    };
    copyrightText: string;
  };
}

// Allowed section keys in the modern storefront
export const KNOWN_SECTION_KEYS = [
  "hero",
  "discovery",
  "recently_viewed",
  "categories",
  "deals",
  "ai_search",
  "latest",
  "showroom",
  "recommended",
  "testimonials",
  "cinematic",
  "trustBadges",
  "loyalty",
] as const;

export const DEFAULT_SECTION_ORDER = [
  "hero",
  "discovery",
  "recently_viewed",
  "categories",
  "deals",
  "ai_search",
  "latest",
  "cinematic",
  "trustBadges",
  "loyalty",
];

/**
 * Contextual URL sanitization rules:
 * - Reject javascript:, vbscript:, file:, malformed URLs, and control characters.
 * - Permit safe https/http URLs where external media is allowed.
 * - Permit same-origin relative paths.
 * - Permit data:image only for fields that explicitly support uploaded image data.
 * - Disallow arbitrary data: URLs for CTA, video or navigation.
 */
export function isSafeUrl(
  url: unknown,
  options?: { allowImageData?: boolean; allowRelative?: boolean }
): boolean {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Reject ASCII control characters
  if (/[\x00-\x1f\x7f]/.test(trimmed)) return false;

  // Reject dangerous pseudo-protocols
  if (/^(javascript|vbscript|file|about):/i.test(trimmed)) {
    return false;
  }

  // Handle data: URLs
  if (/^data:/i.test(trimmed)) {
    if (options?.allowImageData && /^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,/i.test(trimmed)) {
      return true;
    }
    return false;
  }

  // Handle relative paths
  if (options?.allowRelative !== false) {
    if (trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("#")) {
      // Prevent protocol-relative bypasses like "//evil.com"
      if (/^\/[/\\]/i.test(trimmed)) return false;
      return true;
    }
  }

  // Handle absolute HTTP/HTTPS URLs
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function sanitizeUrl(
  url: unknown,
  fallback: string,
  options?: { allowImageData?: boolean; allowRelative?: boolean }
): string {
  return isSafeUrl(url, options) ? (url as string).trim() : fallback;
}

/**
 * Clamps numeric values strictly between domain min/max bounds.
 */
export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || isNaN(value) || !isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(value, min), max);
}

/**
 * Normalizes published section order:
 * 1. Filter out unknown keys.
 * 2. Deduplicate keys.
 * 3. Append missing default enabled keys so older arrays never drop modern sections.
 */
export function normalizeSectionOrder(rawOrder: unknown): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  if (Array.isArray(rawOrder)) {
    for (const key of rawOrder) {
      if (typeof key === "string" && (KNOWN_SECTION_KEYS as readonly string[]).includes(key) && !seen.has(key)) {
        seen.add(key);
        result.push(key);
      }
    }
  }

  // Append missing modern sections in default order
  for (const defaultKey of DEFAULT_SECTION_ORDER) {
    if (!seen.has(defaultKey)) {
      seen.add(defaultKey);
      result.push(defaultKey);
    }
  }

  return result;
}

/**
 * Safely converts raw published StorefrontSettingsShape into typed props
 * with bulletproof fallbacks so that missing or draft settings never break the UI.
 */
export function mapPublishedStorefrontSettings(
  raw?: Partial<StorefrontSettingsShape> | null
): MappedStorefrontSettings {
  const s = raw || DEFAULT_STOREFRONT_SETTINGS;
  const hero = s.hero || DEFAULT_STOREFRONT_SETTINGS.hero;
  const sections = s.sections || DEFAULT_STOREFRONT_SETTINGS.sections;
  const nav = s.navigation || DEFAULT_STOREFRONT_SETTINGS.navigation;
  const cart = s.cart_config || DEFAULT_STOREFRONT_SETTINGS.cart_config;
  const general = s.general_settings || DEFAULT_STOREFRONT_SETTINGS.general_settings;
  const brand = s.brand_settings || DEFAULT_STOREFRONT_SETTINGS.brand_settings;

  const sectionOrder = normalizeSectionOrder(raw?.sections?.sectionOrder ?? DEFAULT_SECTION_ORDER);

  // Validate hero type with sphere_3d fallback
  const validHeroTypes = ["sphere_3d", "cinematic", "banner_image", "video", "slideshow"] as const;
  const heroType = (validHeroTypes as readonly string[]).includes(hero.type || "")
    ? (hero.type as "sphere_3d" | "cinematic" | "banner_image" | "video" | "slideshow")
    : "sphere_3d";

  // Sanitize slides
  const slides = Array.isArray(hero.slides)
    ? hero.slides.map((slide, idx) => ({
        id: typeof slide.id === "string" && slide.id ? slide.id : `slide-${idx}`,
        mediaType: slide.mediaType === "video" ? ("video" as const) : ("image" as const),
        mediaUrl: sanitizeUrl(slide.mediaUrl, "", {
          allowImageData: slide.mediaType !== "video",
          allowRelative: true,
        }),
        badgeText: typeof slide.badgeText === "string" ? slide.badgeText : "",
        title: typeof slide.title === "string" ? slide.title : "",
        subtitle: typeof slide.subtitle === "string" ? slide.subtitle : "",
        ctaText: typeof slide.ctaText === "string" ? slide.ctaText : "",
        ctaLink: sanitizeUrl(slide.ctaLink, "/offers", { allowRelative: true }),
        order: typeof slide.order === "number" ? slide.order : idx,
      }))
    : [];

  return {
    hero: {
      enabled: hero.enabled ?? true,
      type: heroType,
      badgeText: hero.badgeText || "عروض حصرية 50%",
      title: hero.title || "خصومات تصل إلى 50%",
      subtitle: hero.subtitle || "تصفح تشكيلة إندكس المتميزة من الساعات والإلكترونيات",
      bannerImageUrl: sanitizeUrl(hero.bannerImageUrl, "", {
        allowImageData: true,
        allowRelative: true,
      }),
      bannerVideoUrl: sanitizeUrl(hero.bannerVideoUrl, "", {
        allowImageData: false,
        allowRelative: true,
      }),
      ctaText: hero.ctaText || "عالم المنتجات 🌎",
      ctaLink: sanitizeUrl(hero.ctaLink, "/offers", { allowRelative: true }),
      secondaryCtaText: hero.secondaryCtaText || "عرض الكل",
      secondaryCtaLink: sanitizeUrl(hero.secondaryCtaLink, "/immersive-store", { allowRelative: true }),
      showParticles: hero.showParticles ?? true,
      slides,
      globe: {
        // Bounds from HeroConfigSchema: min 6, max 120, default 50
        maxProducts: clampNumber(hero.sphereMaxProducts, 6, 120, 50),
        // Bounds from HeroConfigSchema: min 1.0, max 5.0, default 1.8
        radius: clampNumber(hero.sphereRadius, 1.0, 5.0, 1.8),
        // Bounds from HeroConfigSchema: min 0.2, max 2.0, default 0.8
        tileScale: clampNumber(hero.sphereTileScale, 0.2, 2.0, 0.8),
        // Bounds from HeroConfigSchema: min 0, max 2.0, default 0.5
        rotationSpeed: clampNumber(hero.sphereRotationSpeed, 0, 2.0, 0.5),
        productSource: hero.sphereProductSource || "all",
        cardShape: hero.sphereCardShape || "circle",
        showName: hero.sphereShowName ?? true,
        showPrice: hero.sphereShowPrice ?? true,
        badgeText: hero.globeBadgeText || "INDEXES · LIVE SHOWCASE",
        titleText: hero.globeTitleText || "آلاف المنتجات",
        subtitleText: hero.globeSubtitleText || "اسحب الكرة — كل وجه منتج، اضغط لتفتحه",
        // Bounds from admin slider: min 12, max 48, default 28
        titleFontSize: clampNumber(hero.globeTitleFontSize, 12, 48, 28),
        // Bounds from admin slider: min 8, max 24, default 12
        subtitleFontSize: clampNumber(hero.globeSubtitleFontSize, 8, 24, 12),
      },
    },
    sections: {
      sectionOrder,
      latest: {
        enabled: sections.latest?.enabled ?? true,
        title: sections.latest?.title || "أحدث المنتجات",
        // Bounds from ProductsLayoutConfigSchema: min 4, max 24, default 12
        limit: clampNumber(sections.latest?.limit, 4, 24, 12),
      },
      deals: {
        enabled: sections.deals?.enabled ?? true,
        title: sections.deals?.title || "عروض اليوم 🔥",
        // Bounds from ProductsLayoutConfigSchema dailyDealsLimit: min 2, max 12, default 6
        limit: clampNumber(sections.deals?.limit, 2, 12, 6),
      },
      recommended: {
        enabled: sections.recommended?.enabled ?? true,
        title: sections.recommended?.title || "الأكثر مبيعاً ⭐",
        // Bounds from ProductsLayoutConfigSchema bestSellersLimit: min 2, max 12, default 6
        limit: clampNumber(sections.recommended?.limit, 2, 12, 6),
      },
      categories: {
        enabled: sections.categories?.enabled ?? true,
        title: sections.categories?.title || "التصنيفات",
        // Bounds: min 2, max 24, default 8
        limit: clampNumber(sections.categories?.limit, 2, 24, 8),
      },
      showroom: {
        enabled: sections.showroom?.enabled ?? true,
        title: sections.showroom?.title || "المعرض الافتراضي",
        subtitle: sections.showroom?.subtitle || "تجوّل داخل اندكس ستور الفاخر",
        badge: sections.showroom?.badge || "جديد · تجربة ثلاثية الأبعاد",
        link: sanitizeUrl(sections.showroom?.link, "/immersive-store", { allowRelative: true }),
      },
      cinematic: {
        enabled: sections.cinematic?.enabled ?? true,
        title: sections.cinematic?.title || "اندكس ستور: حيث تلتقي الفخامة بالتقنية",
        subtitle: sections.cinematic?.subtitle || "تجربة تسوق سينمائية فريدة من نوعها",
        videoUrl: sanitizeUrl(sections.cinematic?.videoUrl, "", {
          allowImageData: false,
          allowRelative: true,
        }),
        posterUrl: sanitizeUrl(sections.cinematic?.posterUrl, "", {
          allowImageData: true,
          allowRelative: true,
        }),
      },
      whatsappCta: {
        enabled: sections.whatsappCta?.enabled ?? true,
        title: sections.whatsappCta?.title || "هل تحتاج مساعدة في الطلب؟",
        subtitle: sections.whatsappCta?.subtitle || "تواصل معنا عبر واتساب",
        buttonText: sections.whatsappCta?.buttonText || "تواصل معنا عبر واتساب 💬",
        phone: sections.whatsappCta?.phone || cart.whatsappPhone || "967771370740",
      },
      testimonials: {
        enabled: sections.testimonials?.enabled ?? true,
        title: sections.testimonials?.title || "آراء العملاء",
        subtitle: sections.testimonials?.subtitle || "ماذا يقول عملاؤنا عن اندكس ستور",
      },
      trustBadges: {
        enabled: sections.trustBadges?.enabled ?? false,
        badge1: sections.trustBadges?.badge1 || "",
        badge2: sections.trustBadges?.badge2 || "",
        badge3: sections.trustBadges?.badge3 || "",
        badge4: (sections.trustBadges as any)?.badge4 || "",
      },
    },
    shipping: {
      deliveryText: nav.shippingBarDeliveryText || "توصيل سريع خلال 24 - 48 ساعة للمحافظات",
      freeText: nav.shippingBarFreeText || "شحن مجاني فوق",
      threshold: clampNumber(
        cart.freeShippingThreshold > 0 ? cart.freeShippingThreshold : nav.shippingBarThreshold,
        0,
        1_000_000,
        30000
      ),
      shippingFee: clampNumber(cart.shippingFee, 0, 100_000, 3000),
    },
    contact: {
      storeName: brand.storeName || nav.storeName || "متجر إندكس - INDEXES STORE",
      tagline: brand.tagline || nav.tagline || "اختيارك الأفضل",
      description:
        brand.description ||
        nav.footerDescription ||
        "المتجر اليمني الإلكتروني الرائد للتسوق الفاخر والتجربة ثلاثية الأبعاد.",
      address: general.address || nav.addressText || "صنعاء - شارع بينون - مقابل صيدلية الرعاية الصحية",
      deliveryInfoText: nav.deliveryInfoText || "متوفر لدينا خدمة التوصيل السريع لجميع المحافظات",
      phone: general.phone || nav.whatsappPhone || cart.whatsappPhone || "967771370740",
      whatsappPhone: general.whatsapp || cart.whatsappPhone || nav.whatsappPhone || "967771370740",
      supportEmail: sanitizeUrl(general.email || nav.supportEmail, "support@indexes-store.com", {
        allowRelative: false,
      }),
      socialLinks: {
        facebook: sanitizeUrl(nav.socialLinks?.facebook, "https://facebook.com/indexes.store", {
          allowRelative: false,
        }),
        instagram: sanitizeUrl(nav.socialLinks?.instagram, "https://instagram.com/indexes.store", {
          allowRelative: false,
        }),
        tiktok: sanitizeUrl(nav.socialLinks?.tiktok, "", { allowRelative: false }),
        twitter: sanitizeUrl(nav.socialLinks?.twitter, "https://x.com", { allowRelative: false }),
      },
      copyrightText: nav.copyrightText || "جميع الحقوق محفوظة",
    },
  };
}
