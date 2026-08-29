/**
 * Data Adapter Layer
 * -------------------
 * Converts production ProductDTO / CategoryDTO records into the legacy UI shape.
 */
import type { ProductDTO, ProductMediaItem } from "@/lib/domain/product";
export type { ProductMediaItem };

import type { CategoryWithMetaDTO } from "@/lib/repositories/categories.repo";
import {
  products as seedProducts,
  categories as seedCategories,
  type Product as SeedProduct,
  type Category as SeedCategory,
} from "@/lib/store-data";

const seedToProductDTO = (p: SeedProduct): ProductDTO => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  description: p.description,
  price: p.price,
  currency: "YER",
  category_id: p.categoryId,
  brand: null,
  images: [p.image],
  videos: p.videoPlaybackId ? [p.videoPlaybackId] : [],
  media: [
    { type: "image", url: p.image },
    ...(p.videoPlaybackId
      ? [{ type: "video" as const, url: p.videoPlaybackId, playbackId: p.videoPlaybackId }]
      : []),
  ],
  model_url: null,
  stock: p.stock,
  reserved_stock: 0,
  rating: p.rating,
  reviews_count: p.reviews,
  tags: p.badge ? [p.badge] : [],
  is_published: true,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  video_playback_id: p.videoPlaybackId ?? null,
});

const seedToCategoryDTO = (c: SeedCategory): CategoryWithMetaDTO => ({
  id: c.id,
  slug: c.id,
  name: c.name,
  description: null,
  image_url: null,
  parent_id: null,
  sort: 0,
  icon: c.icon,
  color: c.color,
  is_active: true,
});

export const fallbackProducts = (): ProductDTO[] => seedProducts.map(seedToProductDTO);
export const fallbackCategories = (): CategoryWithMetaDTO[] =>
  seedCategories.map(seedToCategoryDTO);

type Source = "db" | "fallback";
export type AdapterResult<T> = { data: T; source: Source };

export async function withFallback<T>(
  loader: () => Promise<T>,
  fallback: () => T,
  isEmpty: (v: T) => boolean,
): Promise<AdapterResult<T>> {
  try {
    const data = await loader();
    if (isEmpty(data)) return { data: fallback(), source: "fallback" };
    return { data, source: "db" };
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[data-adapter] falling back to seed:", err);
    return { data: fallback(), source: "fallback" };
  }
}

export type LegacyProductShape = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  stock: number;
  image: string;
  images?: string[];
  videos?: string[] | null;
  media?: ProductMediaItem[] | null;
  rating: number;
  reviews: number;
  categoryId: string;
  badge?: string;
  videoPlaybackId?: string;
  modelUrl?: string | null;
  sku?: string | null;
  brand?: string | null;
  condition?: string | null;
  availability?: string | null;
  barcode?: string | null;
  gtin8?: string | null;
  gtin12?: string | null;
  gtin13?: string | null;
  gtin14?: string | null;
  mpn?: string | null;
  featured?: boolean;
  isDeal?: boolean;
  dealStart?: string | null;
  dealEnd?: string | null;
  shopifyVariantId?: string | null;
};

const isMetadataTag = (tag: string): boolean =>
  tag.startsWith("_") || /^(color|size|material|pattern|gender|age|gcat|fbcat)_?:/i.test(tag);

const explicitBadge = (p: ProductDTO): string | undefined => {
  if (p.badge?.trim() && !isMetadataTag(p.badge.trim())) return p.badge.trim();
  return p.tags.find((tag) => tag?.trim() && !isMetadataTag(tag.trim()));
};

export const toLegacyProduct = (p: ProductDTO): LegacyProductShape => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  description: p.description,
  price: p.price,
  oldPrice:
    p.old_price != null
      ? p.old_price
      : p.compare_at_price != null && p.compare_at_price > p.price
        ? p.compare_at_price
        : undefined,
  stock: p.stock,
  image: p.images.find(Boolean) ?? "",
  images: p.images,
  videos: p.videos ?? null,
  media: p.media ?? null,
  rating: p.rating,
  reviews: p.reviews_count,
  categoryId: p.category_id ?? "",
  badge: explicitBadge(p),
  videoPlaybackId: p.video_playback_id ?? undefined,
  modelUrl: p.model_3d_url ?? p.model_url ?? null,
  sku: p.sku ?? null,
  brand: p.brand ?? null,
  condition: p.condition ?? null,
  availability: p.availability ?? null,
  barcode: p.barcode ?? null,
  mpn: p.mpn ?? null,
  featured: p.featured ?? false,
  isDeal: p.is_deal ?? false,
  dealStart: p.deal_start ?? null,
  dealEnd: p.deal_end ?? null,
  shopifyVariantId: (p as ProductDTO & { shopify_variant_id?: string | null }).shopify_variant_id ?? null,
});

export type LegacyCategoryShape = {
  id: string;
  name: string;
  icon: string;
  color: string;
  imageUrl?: string | null;
};

export const toLegacyCategory = (c: CategoryWithMetaDTO): LegacyCategoryShape => ({
  id: c.slug,
  name: c.name,
  icon: c.icon ?? "Package",
  color: c.color ?? "from-slate-500 to-slate-700",
  imageUrl: c.image_url,
});
