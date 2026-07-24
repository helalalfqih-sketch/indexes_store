/**
 * SEO Library — Indexes Store
 * ─────────────────────────────
 * Centralised helpers for:
 *   • HTML meta tags (title, description, canonical, robots, OpenGraph, Twitter, hreflang)
 *   • JSON-LD structured data (Product, Offer, Organization, LocalBusiness, Breadcrumb,
 *     Website/SearchAction, CollectionPage, FAQ, VideoObject)
 *   • Google Merchant compatibility (gtin8/12/13/14, mpn, sku, shipping, returns, condition)
 *
 * Usage in TanStack Start route `head()`:
 *   const { meta, links, scripts } = buildProductHead(product, baseUrl, categories);
 *   return { meta, links, scripts };
 */

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const SITE_NAME = "اندكس ستور";
export const SITE_NAME_EN = "Indexes Store";
export const DEFAULT_BASE_URL = process.env.SITE_URL || "";
export const STORE_COUNTRY = "YE";   // ISO 3166-1 alpha-2 for Yemen
export const STORE_CURRENCY = "YER"; // ISO 4217 for Yemeni Rial
export const STORE_PHONE = "+967771370740";
export const STORE_EMAIL = "support@indexes-store.com";
export const STORE_ADDRESS = {
  streetAddress: "شارع بينون",
  addressLocality: "صنعاء",
  addressRegion: "أمانة العاصمة",
  addressCountry: STORE_COUNTRY,
};
export const STORE_SOCIAL = {
  facebook: "https://facebook.com/indexes.store",
  instagram: "https://instagram.com/indexes.store",
  twitter: "https://x.com/indexes_store",
  tiktok: "https://tiktok.com/@indexes.store",
  youtube: "https://youtube.com/@indexes.store",
};
export const DEFAULT_OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/da426993-5f26-4733-b40c-c0f1f8e814c7/id-preview-7d22af97--80f7d5cf-5026-49dd-8137-91bdaa674a1a.lovable.app-1783204904911.png";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SeoMeta {
  title: string;
  description: string;
  canonical?: string;
  noindex?: boolean;
  ogType?: "website" | "product" | "article";
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  twitterCard?: "summary" | "summary_large_image";
  keywords?: string;
  author?: string;
  /** hreflang language codes — e.g. [['ar', url], ['x-default', url]] */
  hreflang?: Array<[string, string]>;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ProductSeoInput {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  currency?: string;
  stock: number;
  image: string;
  images?: string[];
  brand?: string | null;
  categoryName?: string;
  categoryId?: string;
  rating?: number;
  reviews?: number;
  sku?: string | null;
  barcode?: string | null;
  gtin8?: string | null;
  gtin12?: string | null;
  gtin13?: string | null;
  gtin14?: string | null;
  mpn?: string | null;
  condition?: string | null;
  availability?: string | null;
  videoPlaybackId?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Basic Meta Tags
// ─────────────────────────────────────────────────────────────────────────────

/** Returns an array of meta tag objects consumable by TanStack Start's `head()`. */
export function generateMeta(input: SeoMeta) {
  const tags: Record<string, string>[] = [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
    { name: "author", content: SITE_NAME },
    { name: "application-name", content: SITE_NAME },
    { name: "generator", content: "TanStack Start" },
    { name: "format-detection", content: "telephone=no" },
    { name: "robots", content: input.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
    { title: input.title },
    { name: "description", content: input.description },
  ];

  if (input.keywords) {
    tags.push({ name: "keywords", content: input.keywords });
  }

  return tags;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Canonical URLs
// ─────────────────────────────────────────────────────────────────────────────

export function generateCanonical(url: string) {
  return [{ rel: "canonical", href: url }];
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Hreflang Links
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate hreflang link tags for language/region targeting.
 * Always adds x-default pointing to Arabic URL.
 */
export function generateHreflang(arabicUrl: string) {
  return [
    { rel: "alternate", hrefLang: "ar", href: arabicUrl },
    { rel: "alternate", hrefLang: "x-default", href: arabicUrl },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Open Graph
// ─────────────────────────────────────────────────────────────────────────────

export function generateOpenGraph(input: {
  title: string;
  description: string;
  url: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  type?: "website" | "product" | "article";
  siteName?: string;
  locale?: string;
}) {
  const image = input.image || DEFAULT_OG_IMAGE;
  const tags: Record<string, string>[] = [
    { property: "og:type", content: input.type || "website" },
    { property: "og:site_name", content: input.siteName || SITE_NAME },
    { property: "og:locale", content: input.locale || "ar_YE" },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:url", content: input.url },
    { property: "og:image", content: image },
    { property: "og:image:secure_url", content: image },
    { property: "og:image:type", content: "image/jpeg" },
    { property: "og:image:width", content: String(input.imageWidth || 1200) },
    { property: "og:image:height", content: String(input.imageHeight || 630) },
    { property: "og:image:alt", content: input.title },
  ];
  return tags;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Twitter Card
// ─────────────────────────────────────────────────────────────────────────────

export function generateTwitter(input: {
  title: string;
  description: string;
  image?: string;
  card?: "summary" | "summary_large_image";
}) {
  const image = input.image || DEFAULT_OG_IMAGE;
  return [
    { name: "twitter:card", content: input.card || "summary_large_image" },
    { name: "twitter:site", content: "@indexes_store" },
    { name: "twitter:creator", content: "@indexes_store" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: input.title },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Product JSON-LD (Google Merchant + Rich Results compatible)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a fully Merchant Center compatible Product schema.
 * Includes: offers, shipping, returns, gtin variants, condition, availability,
 * brand, rating, reviews, images, and optional VideoObject.
 */
export function generateProductJsonLd(
  product: ProductSeoInput,
  baseUrl: string,
): Record<string, unknown> {
  const productUrl = `${baseUrl}/product/${product.slug}`;
  const availability = resolveAvailability(product.stock, product.availability);
  const condition = resolveCondition(product.condition);
  const images = buildImageList(product);

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    url: productUrl,
    priceCurrency: product.currency || STORE_CURRENCY,
    price: product.price,
    priceValidUntil: priceValidUntil(),
    availability,
    itemCondition: condition,
    seller: {
      "@type": "Organization",
      name: SITE_NAME,
      url: baseUrl,
    },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: "0",
        currency: STORE_CURRENCY,
      },
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: STORE_COUNTRY,
      },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: {
          "@type": "QuantitativeValue",
          minValue: 1,
          maxValue: 2,
          unitCode: "DAY",
        },
        transitTime: {
          "@type": "QuantitativeValue",
          minValue: 2,
          maxValue: 7,
          unitCode: "DAY",
        },
      },
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: STORE_COUNTRY,
      returnPolicyCategory:
        "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 7,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
    },
  };

  // Add GTIN variants (in order of specificity)
  if (product.gtin14) offer["gtin14"] = product.gtin14;
  else if (product.gtin13) offer["gtin13"] = product.gtin13;
  else if (product.gtin12) offer["gtin12"] = product.gtin12;
  else if (product.gtin8) offer["gtin8"] = product.gtin8;
  // Fall back to barcode field if no explicit GTIN
  else if (product.barcode && product.barcode.length === 13) offer["gtin13"] = product.barcode;
  else if (product.barcode && product.barcode.length === 12) offer["gtin12"] = product.barcode;
  else if (product.barcode) offer["gtin"] = product.barcode;

  if (product.mpn) offer["mpn"] = product.mpn;
  if (product.sku) offer["sku"] = product.sku;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    url: productUrl,
    image: images,
    offers: offer,
  };

  // SKU at product level too (for Merchant Center)
  if (product.sku) schema["sku"] = product.sku;
  if (product.mpn) schema["mpn"] = product.mpn;

  // Brand
  if (product.brand) {
    schema["brand"] = { "@type": "Brand", name: product.brand };
  } else {
    schema["brand"] = { "@type": "Brand", name: SITE_NAME };
  }

  // Category
  if (product.categoryName) {
    schema["category"] = product.categoryName;
  }

  // Aggregate Rating
  if (
    product.rating !== undefined &&
    product.reviews !== undefined &&
    product.reviews > 0
  ) {
    schema["aggregateRating"] = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // VideoObject — embedded inside product if there's a Mux video
  if (product.videoPlaybackId) {
    schema["video"] = generateVideoObjectJsonLd({
      name: product.name,
      description: product.description,
      thumbnailUrl: product.image,
      contentUrl: `https://stream.mux.com/${product.videoPlaybackId}`,
      embedUrl: `https://player.mux.com/${product.videoPlaybackId}`,
    });
  }

  return schema;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. VideoObject JSON-LD
// ─────────────────────────────────────────────────────────────────────────────

export function generateVideoObjectJsonLd(input: {
  name: string;
  description: string;
  thumbnailUrl: string;
  contentUrl: string;
  embedUrl?: string;
  uploadDate?: string;
  duration?: string;
}): Record<string, unknown> {
  return {
    "@type": "VideoObject",
    name: input.name,
    description: input.description,
    thumbnailUrl: input.thumbnailUrl,
    contentUrl: input.contentUrl,
    ...(input.embedUrl ? { embedUrl: input.embedUrl } : {}),
    uploadDate: input.uploadDate || new Date().toISOString().split("T")[0],
    ...(input.duration ? { duration: input.duration } : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Organization JSON-LD
// ─────────────────────────────────────────────────────────────────────────────

export interface SchemaCustomConfig {
  name?: string;
  alternateName?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  streetAddress?: string;
  addressLocality?: string;
  country?: string;
  openingHours?: string;
  priceRange?: string;
  sameAs?: string[];
}

export function generateOrganizationJsonLd(
  baseUrl: string,
  logoUrl?: string,
  config?: SchemaCustomConfig,
): Record<string, unknown> {
  const name = config?.name || SITE_NAME;
  const alternateName = config?.alternateName || SITE_NAME_EN;
  const logo = config?.logoUrl || logoUrl || DEFAULT_OG_IMAGE;
  const phone = config?.phone || STORE_PHONE;
  const email = config?.email || STORE_EMAIL;
  const social = config?.sameAs && config.sameAs.length > 0 ? config.sameAs : Object.values(STORE_SOCIAL);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name,
    alternateName,
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: logo,
      width: 1200,
      height: 630,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: phone,
        contactType: "customer service",
        contactOption: "TollFree",
        areaServed: STORE_COUNTRY,
        availableLanguage: ["Arabic"],
      },
    ],
    sameAs: social,
    email,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. LocalBusiness JSON-LD
// ─────────────────────────────────────────────────────────────────────────────

export function generateLocalBusinessJsonLd(
  baseUrl: string,
  logoUrl?: string,
  config?: SchemaCustomConfig,
): Record<string, unknown> {
  const name = config?.name || SITE_NAME;
  const alternateName = config?.alternateName || SITE_NAME_EN;
  const logo = config?.logoUrl || logoUrl || DEFAULT_OG_IMAGE;
  const phone = config?.phone || STORE_PHONE;
  const email = config?.email || STORE_EMAIL;
  const streetAddress = config?.streetAddress || STORE_ADDRESS.streetAddress;
  const addressLocality = config?.addressLocality || STORE_ADDRESS.addressLocality;
  const social = config?.sameAs && config.sameAs.length > 0 ? config.sameAs : Object.values(STORE_SOCIAL);

  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${baseUrl}/#localbusiness`,
    name,
    alternateName,
    url: baseUrl,
    logo,
    image: DEFAULT_OG_IMAGE,
    description: "المتجر اليمني الإلكتروني الرائد للتسوق الفاخر والتجربة ثلاثية الأبعاد",
    telephone: phone,
    email,
    address: {
      "@type": "PostalAddress",
      streetAddress,
      addressLocality,
      addressRegion: STORE_ADDRESS.addressRegion,
      addressCountry: STORE_COUNTRY,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 15.3694,
      longitude: 44.191,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "09:00",
        closes: "22:00",
      },
    ],
    priceRange: config?.priceRange || "$$",
    currenciesAccepted: STORE_CURRENCY,
    paymentAccepted: "Cash",
    areaServed: {
      "@type": "Country",
      name: "Yemen",
    },
    sameAs: social,
    hasMap: "https://maps.google.com/?q=صنعاء+اليمن",
    parentOrganization: {
      "@id": `${baseUrl}/#organization`,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Website JSON-LD (with SearchAction for Sitelinks Searchbox)
// ─────────────────────────────────────────────────────────────────────────────

export function generateWebsiteJsonLd(baseUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: SITE_NAME,
    alternateName: SITE_NAME_EN,
    description: "المتجر اليمني الإلكتروني الرائد للتسوق الفاخر والتجربة ثلاثية الأبعاد",
    inLanguage: "ar",
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. BreadcrumbList JSON-LD
// ─────────────────────────────────────────────────────────────────────────────

export function generateBreadcrumbJsonLd(
  items: BreadcrumbItem[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. CollectionPage JSON-LD (for category pages)
// ─────────────────────────────────────────────────────────────────────────────

export function generateCollectionJsonLd(input: {
  name: string;
  description?: string;
  url: string;
  products: Array<{ name: string; url: string; image: string; price: number }>;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description || `تصفح منتجات ${input.name} في ${SITE_NAME}`,
    url: input.url,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: input.products.map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: p.url,
        name: p.name,
        image: p.image,
      })),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. FAQ JSON-LD
// ─────────────────────────────────────────────────────────────────────────────

export function generateFAQJsonLd(
  faqs: Array<{ question: string; answer: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. Merchant Page Schemas (Shipping, Returns, Privacy, Terms, Contact)
// ─────────────────────────────────────────────────────────────────────────────

export function generateShippingPageJsonLd(baseUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}/shipping#webpage`,
    url: `${baseUrl}/shipping`,
    name: `سياسة الشحن — ${SITE_NAME}`,
    description: "سياسة الشحن والتوصيل لاندكس ستور — يمن",
    isPartOf: { "@id": `${baseUrl}/#website` },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: baseUrl },
        { "@type": "ListItem", position: 2, name: "سياسة الشحن", item: `${baseUrl}/shipping` },
      ],
    },
  };
}

export function generateReturnsPageJsonLd(baseUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}/returns#webpage`,
    url: `${baseUrl}/returns`,
    name: `سياسة الإرجاع — ${SITE_NAME}`,
    description: "سياسة الإرجاع والاستبدال لاندكس ستور — يمن",
    isPartOf: { "@id": `${baseUrl}/#website` },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. Google Merchant Feed Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Converts a price in YER (integer) to a formatted decimal string */
export function formatMerchantPrice(price: number): string {
  return (price / 100).toFixed(2);
}

/** Maps internal availability to Google Merchant values */
export function merchantAvailability(_stock: number, rawAvailability?: string | null): string {
  if (rawAvailability === "preorder") return "preorder";
  if (rawAvailability === "backorder") return "backorder";
  if (rawAvailability === "out_of_stock" || rawAvailability === "disabled") return "out_of_stock";
  return "in_stock";
}

/** Maps internal condition to Google Merchant values */
export function merchantCondition(raw?: string | null): string {
  if (raw === "used") return "used";
  if (raw === "refurbished") return "refurbished";
  return "new";
}

/** XML-safe string escaping */
export function xmlEscape(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function resolveAvailability(_stock: number, rawAvailability?: string | null): string {
  if (rawAvailability === "preorder") return "https://schema.org/PreOrder";
  if (rawAvailability === "backorder") return "https://schema.org/BackOrder";
  if (rawAvailability === "out_of_stock" || rawAvailability === "disabled") return "https://schema.org/OutOfStock";
  return "https://schema.org/InStock";
}

function resolveCondition(raw?: string | null): string {
  if (raw === "used") return "https://schema.org/UsedCondition";
  if (raw === "refurbished") return "https://schema.org/RefurbishedCondition";
  return "https://schema.org/NewCondition";
}

function buildImageList(product: ProductSeoInput): string[] {
  const all: string[] = [];
  if (product.images && product.images.length > 0) {
    all.push(...product.images);
  } else if (product.image) {
    all.push(product.image);
  }
  // Deduplicate
  return [...new Set(all)].filter(Boolean);
}

function priceValidUntil(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. Convenience – build a full product head() return value
// ─────────────────────────────────────────────────────────────────────────────

export function buildProductHead(
  product: ProductSeoInput,
  baseUrl: string,
  categoryName?: string,
) {
  const productUrl = `${baseUrl}/product/${product.slug}`;
  const title = `${product.name} — ${SITE_NAME}`;
  const description = product.description?.slice(0, 160) || title;
  const image = product.image || DEFAULT_OG_IMAGE;

  const meta = [
    ...generateMeta({ title, description, noindex: false }),
    ...generateOpenGraph({
      title,
      description,
      url: productUrl,
      image,
      type: "product",
    }),
    ...generateTwitter({ title, description, image }),
    // Product-specific OG tags
    { property: "product:price:amount", content: String(product.price) },
    { property: "product:price:currency", content: product.currency || STORE_CURRENCY },
    { property: "product:availability", content: product.stock > 0 ? "in stock" : "out of stock" },
    { property: "product:condition", content: product.condition || "new" },
    { property: "product:retailer_item_id", content: product.id },
    ...(product.brand ? [{ property: "product:brand", content: product.brand }] : []),
  ];

  const links = [
    ...generateCanonical(productUrl),
    ...generateHreflang(productUrl),
  ];

  const productLd = generateProductJsonLd(
    { ...product, categoryName: categoryName || product.categoryId },
    baseUrl,
  );
  const breadcrumbLd = generateBreadcrumbJsonLd([
    { name: "الرئيسية", url: baseUrl },
    ...(categoryName
      ? [{ name: categoryName, url: `${baseUrl}/category/${product.categoryId}` }]
      : []),
    { name: product.name, url: productUrl },
  ]);

  const scripts = [
    { type: "application/ld+json", children: JSON.stringify(productLd) },
    { type: "application/ld+json", children: JSON.stringify(breadcrumbLd) },
  ];

  return { meta, links, scripts };
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. Convenience – build a full category head() return value
// ─────────────────────────────────────────────────────────────────────────────

export function buildCategoryHead(
  category: { id: string; name: string },
  products: Array<{ name: string; slug: string; image: string; price: number }>,
  baseUrl: string,
) {
  const categoryUrl = `${baseUrl}/category/${category.id}`;
  const title = `${category.name} — ${SITE_NAME}`;
  const description = `تصفح أفضل منتجات ${category.name} في ${SITE_NAME}. أسعار تنافسية وجودة عالية.`;

  const meta = [
    ...generateMeta({ title, description }),
    ...generateOpenGraph({ title, description, url: categoryUrl }),
    ...generateTwitter({ title, description }),
  ];

  const links = [
    ...generateCanonical(categoryUrl),
    ...generateHreflang(categoryUrl),
  ];

  const collectionLd = generateCollectionJsonLd({
    name: category.name,
    url: categoryUrl,
    products: products.map((p) => ({
      name: p.name,
      url: `${baseUrl}/product/${p.slug}`,
      image: p.image,
      price: p.price,
    })),
  });
  const breadcrumbLd = generateBreadcrumbJsonLd([
    { name: "الرئيسية", url: baseUrl },
    { name: category.name, url: categoryUrl },
  ]);

  const scripts = [
    { type: "application/ld+json", children: JSON.stringify(collectionLd) },
    { type: "application/ld+json", children: JSON.stringify(breadcrumbLd) },
  ];

  return { meta, links, scripts };
}

// ─────────────────────────────────────────────────────────────────────────────
// 18. Convenience – build homepage head() return value
// ─────────────────────────────────────────────────────────────────────────────

export function buildHomepageHead(
  baseUrl: string,
  seoConfig?: { metaTitle?: string; metaDescription?: string; ogImage?: string; themeColor?: string },
) {
  const title = seoConfig?.metaTitle || `${SITE_NAME} — الرئيسية | تسوّق أونلاين في اليمن`;
  const description =
    seoConfig?.metaDescription ||
    `اكتشف أحدث المنتجات والعروض في ${SITE_NAME}: إلكترونيات، أزياء، أدوات منزلية، والمزيد. تجربة تسوق ثلاثية الأبعاد فريدة في اليمن.`;
  const ogImage = seoConfig?.ogImage || DEFAULT_OG_IMAGE;
  const themeColor = seoConfig?.themeColor || "#1F5EFF";

  const meta = [
    ...generateMeta({ title, description }),
    ...generateOpenGraph({ title, description, url: baseUrl, image: ogImage }),
    ...generateTwitter({ title, description, image: ogImage }),
    { name: "theme-color", content: themeColor },
    { name: "msapplication-TileColor", content: themeColor },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    { name: "apple-mobile-web-app-title", content: SITE_NAME },
  ];

  const links = [
    ...generateCanonical(baseUrl),
    ...generateHreflang(baseUrl),
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    { rel: "preconnect", href: "https://images.unsplash.com" },
    { rel: "dns-prefetch", href: "https://stream.mux.com" },
  ];

  const websiteLd = generateWebsiteJsonLd(baseUrl);
  const orgLd = generateOrganizationJsonLd(baseUrl);
  const localBizLd = generateLocalBusinessJsonLd(baseUrl);

  const scripts = [
    { type: "application/ld+json", children: JSON.stringify(websiteLd) },
    { type: "application/ld+json", children: JSON.stringify(orgLd) },
    { type: "application/ld+json", children: JSON.stringify(localBizLd) },
  ];

  return { meta, links, scripts };
}
