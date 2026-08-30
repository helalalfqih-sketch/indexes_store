import type { LegacyProductShape, LegacyCategoryShape } from "@/lib/data-adapter";
import type { Product as DesignProduct, Category as DesignCategory } from "./types";

const NEUTRAL_FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'%3E%3Crect width='800' height='800' fill='%23140E24'/%3E%3Cpath d='M270 330h260v180H270z' fill='none' stroke='%236b7280' stroke-width='18'/%3E%3Ccircle cx='350' cy='390' r='34' fill='%236b7280'/%3E%3Cpath d='m290 490 90-90 60 60 45-45 55 75' fill='none' stroke='%236b7280' stroke-width='18'/%3E%3C/svg%3E";

function isVideoUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const lower = url.trim().toLowerCase();
  return (
    /\.(mp4|webm|ogg|mov|avi|mkv|m3u8)(\?.*)?$/i.test(lower) ||
    lower.includes("stream.mux.com") ||
    lower.includes("player.mux.com") ||
    lower.includes("/video/upload/") ||
    lower.includes("videoplaybackid") ||
    lower.startsWith("data:video/")
  );
}

function validImageUrl(url: string | undefined | null): url is string {
  return Boolean(url?.trim()) && !isVideoUrl(url);
}

function resolveVideoPoster(p: LegacyProductShape): string | undefined {
  for (const media of p.media ?? []) {
    if (media.type !== "video") continue;
    if (validImageUrl(media.poster)) return media.poster;
  }
  return undefined;
}

/** Production media priority: primary DTO image -> legacy image -> image media -> video poster -> neutral fallback. */
export function resolveProductImage(p: LegacyProductShape): string {
  const primaryDtoImage = p.images?.find(validImageUrl);
  if (primaryDtoImage) return primaryDtoImage;

  if (validImageUrl(p.image)) return p.image;

  const imageMedia = p.media?.find((media) => media.type === "image" && validImageUrl(media.url));
  if (imageMedia?.url) return imageMedia.url;

  return resolveVideoPoster(p) ?? NEUTRAL_FALLBACK_IMAGE;
}

export function resolveProductGallery(p: LegacyProductShape): string[] {
  const gallery: string[] = [];
  const add = (url: string | undefined | null) => {
    if (validImageUrl(url) && !gallery.includes(url)) gallery.push(url);
  };

  p.images?.forEach(add);
  add(p.image);
  p.media?.forEach((media) => {
    if (media.type === "image") add(media.url);
  });
  add(resolveVideoPoster(p));

  if (gallery.length === 0) gallery.push(NEUTRAL_FALLBACK_IMAGE);
  return gallery;
}

function isPromotionalBadge(value: string | undefined): value is string {
  if (!value) return false;
  const badge = value.trim();
  if (
    !badge ||
    badge.startsWith("_") ||
    /^(color|size|material|pattern|gender|age|gcat|fbcat)_?:/i.test(badge)
  ) {
    return false;
  }
  return /(خصم|عرض|تخفيض|جديد|وصل حديث|new|sale|offer|discount)/i.test(badge);
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
      : isPromotionalBadge(p.badge)
        ? p.badge
        : undefined;

  const mainImage = resolveProductImage(p);
  const gallery = resolveProductGallery(p);

  // Video extraction from production media/playback/source_url
  let videoUrl: string | undefined = undefined;
  if (p.videos && p.videos.length > 0 && p.videos[0]) {
    videoUrl = p.videos[0];
  } else if (p.media) {
    const vMedia = p.media.find((m) => m.type === "video" && m.url);
    if (vMedia?.url) videoUrl = vMedia.url;
  }
  const pAny = p as any;
  if (!videoUrl && pAny.source_url && isVideoUrl(pAny.source_url)) {
    videoUrl = pAny.source_url;
  }
  if (!videoUrl && (pAny.videoPlaybackId || pAny.video_playback_id)) {
    const playbackId = pAny.videoPlaybackId || pAny.video_playback_id;
    videoUrl = typeof playbackId === "string" && playbackId.startsWith("http")
      ? playbackId
      : `https://stream.mux.com/${playbackId}.m3u8`;
  }

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
    rating: typeof p.rating === "number" && !isNaN(p.rating) && p.rating > 0 ? p.rating : 0,
    reviewsCount: typeof p.reviews === "number" && !isNaN(p.reviews) && p.reviews > 0 ? p.reviews : 0,
    image: mainImage,
    gallery,
    videoUrl,
    category: p.categoryId || "all",
    brand: p.brand || (p as any).brand_id || undefined,
    inStock: p.stock > 0,
    isBestOffer: p.isDeal || Boolean(rawOldPrice && rawOldPrice > priceYER),
    isNewArrival: p.featured || false,
    isFeatured: p.featured || false,
    dealStart: p.dealStart ?? null,
    dealEnd: p.dealEnd ?? null,
  };
}

export function mapProductionCategoryToDesignCategory(c: LegacyCategoryShape): DesignCategory {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon || "Package",
  };
}
