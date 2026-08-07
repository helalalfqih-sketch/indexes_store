import type { LegacyProductShape, LegacyCategoryShape } from "@/lib/data-adapter";
import type { Product as DesignProduct, Category as DesignCategory } from "./types";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80";

function isVideoUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.includes("/video/upload/") ||
    lower.includes("videoPlaybackId")
  );
}

/**
 * Resolves the primary product image using priority order:
 * Primary Product Media -> Product Image -> Media Thumbnail -> Fallback Image.
 * Ensures video URLs are never used as image src.
 */

export function resolveProductImage(p: LegacyProductShape): string {
  // 1. Check p.media array for explicit image type or video thumbnail
  if (p.media && p.media.length > 0) {
    const imgMedia = p.media.find((m) => m.type === "image" && m.url && !isVideoUrl(m.url));
    if (imgMedia?.url) return imgMedia.url;

    const vidMedia = p.media.find((m) => m.type === "video");
    if (vidMedia) {
      const vidObj = vidMedia as Record<string, unknown>;
      if (typeof vidObj.poster === "string") return vidObj.poster;
      if (typeof vidObj.thumbnailUrl === "string") return vidObj.thumbnailUrl;
      if (typeof vidObj.thumbnail === "string") return vidObj.thumbnail;
    }
  }

  // 2. Check p.image
  if (p.image && !isVideoUrl(p.image)) {
    return p.image;
  }

  // 3. Check p.images array for valid non-video image
  if (p.images && p.images.length > 0) {
    const validImg = p.images.find((img) => img && !isVideoUrl(img));
    if (validImg) return validImg;
  }

  return FALLBACK_IMAGE;
}

/**
 * Resolves gallery images excluding video files.
 */
export function resolveProductGallery(p: LegacyProductShape): string[] {
  const mainImg = resolveProductImage(p);
  const gallery: string[] = [mainImg];

  if (p.images && p.images.length > 0) {
    p.images.forEach((img) => {
      if (img && !isVideoUrl(img) && !gallery.includes(img)) {
        gallery.push(img);
      }
    });
  }

  if (p.media && p.media.length > 0) {
    p.media.forEach((m) => {
      if (m.type === "image" && m.url && !isVideoUrl(m.url) && !gallery.includes(m.url)) {
        gallery.push(m.url);
      }
    });
  }

  return gallery;
}

export function mapProductionProductToDesignProduct(p: LegacyProductShape): DesignProduct {
  const rawPrice = p.price;
  const priceYER =
    typeof rawPrice === "number" && !isNaN(rawPrice) && isFinite(rawPrice) && rawPrice > 0
      ? rawPrice
      : 1000;

  const rawOldPrice =
    p.oldPrice && typeof p.oldPrice === "number" && !isNaN(p.oldPrice) && isFinite(p.oldPrice)
      ? p.oldPrice
      : undefined;

  const originalPriceYER = rawOldPrice && rawOldPrice > priceYER ? rawOldPrice : priceYER;

  const discountBadge =
    rawOldPrice && rawOldPrice > priceYER
      ? `خصم ${Math.round(((rawOldPrice - priceYER) / rawOldPrice) * 100)}%`
      : p.badge || undefined;

  const mainImage = resolveProductImage(p);
  const gallery = resolveProductGallery(p);

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    subtitle: p.description
      ? p.description.length > 60
        ? p.description.slice(0, 60) + "..."
        : p.description
      : p.name,
    description: p.description || p.name,
    priceYER,
    originalPriceYER,
    discountBadge,
    rating: p.rating || 4.8,
    reviewsCount: p.reviews || 12,
    image: mainImage,
    gallery,
    category: p.categoryId || "all",
    inStock: p.stock > 0,
    isBestOffer: p.isDeal || Boolean(rawOldPrice && rawOldPrice > priceYER),
    isNewArrival: p.featured || false,
    isFeatured: p.featured || false,
  };
}

export function mapProductionCategoryToDesignCategory(c: LegacyCategoryShape): DesignCategory {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon || "Package",
  };
}
