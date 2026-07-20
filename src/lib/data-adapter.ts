/**
 * Data Adapter Layer
 * -------------------
 * Phase B safety guard: allows the UI to consume ProductDTO / CategoryDTO
 * shapes while transparently falling back to the legacy `store-data.ts`
 * seed when the DB is empty or unreachable. `store-data.ts` remains the
 * source of the mock catalog and is not deleted in this phase.
 *
 * Contract:
 *   - Callers depend on DTO shape only, never on the underlying source.
 *   - `dataAdapter.source` reports which backend served the request
 *     ("db" | "fallback"), useful for the compatibility report.
 *
 * When Phase C completes, the fallback branch is removed and this file
 * becomes a pure DTO mapper.
 */
import type { ProductDTO, CategoryDTO } from "@/lib/domain/product";
import type { CategoryWithMetaDTO } from "@/lib/repositories/categories.repo";
import {
  products as seedProducts,
  categories as seedCategories,
  type Product as SeedProduct,
  type Category as SeedCategory,
} from "@/lib/store-data";

// ---------- Fallback mapping ----------

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
export const fallbackCategories = (): CategoryWithMetaDTO[] => seedCategories.map(seedToCategoryDTO);

// ---------- Adapter ----------

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

/**
 * DTO → legacy UI-friendly Product shape used by existing components.
 * Kept identical to `store-data.ts.Product` for backward compatibility.
 */
export type LegacyProductShape = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  stock: number;
  image: string;
  rating: number;
  reviews: number;
  categoryId: string;
  badge?: string;
  videoPlaybackId?: string;
};

export const toLegacyProduct = (p: ProductDTO): LegacyProductShape => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  description: p.description,
  price: p.price,
  stock: p.stock,
  image: p.images[0] ?? "",
  rating: p.rating,
  reviews: p.reviews_count,
  categoryId: p.category_id ?? "",
  badge: p.tags[0],
  videoPlaybackId: p.video_playback_id ?? undefined,
});

export type LegacyCategoryShape = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export const toLegacyCategory = (c: CategoryWithMetaDTO): LegacyCategoryShape => ({
  id: c.slug, // legacy code uses slug as id
  name: c.name,
  icon: c.icon ?? "Package",
  color: c.color ?? "from-slate-500 to-slate-700",
});
