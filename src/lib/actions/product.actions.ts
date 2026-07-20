/**
 * Product Actions — UI-facing entry point for product data.
 *
 *  UI ──► actions ──► server functions ──► repositories ──► Supabase
 *
 * Rules:
 *  - UI never imports server fns / repos / supabase directly for catalog reads.
 *  - Returns legacy UI shapes (LegacyProductShape) so existing components
 *    keep working without changes. DTO-native components can call the raw
 *    server fns.
 *  - Falls back to seed data (store-data.ts) on error or empty DB — the
 *    data-adapter safety net stays until Phase C removes it.
 */
import { z } from "zod";
import {
  listProducts,
  getProductBySlug as getProductBySlugFn,
  getProductsByIds as getProductsByIdsFn,
} from "@/lib/catalog.functions";
import {
  fallbackProducts,
  toLegacyProduct,
  type LegacyProductShape,
} from "@/lib/data-adapter";
import type { ProductDTO } from "@/lib/domain/product";
import { products as seedProducts } from "@/lib/store-data";

// ---------- Input validation ----------

export const listProductsInput = z
  .object({
    categoryId: z.string().uuid().optional(),
    search: z.string().trim().max(120).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
    tenantId: z.string().uuid().optional(),
  })
  .partial();
export type ListProductsInput = z.infer<typeof listProductsInput>;

// ---------- Enrichment (until oldPrice / badges live in DB) ----------

const seedIndex = new Map(seedProducts.map((p) => [p.slug, p]));

const enrichLegacy = (p: LegacyProductShape): LegacyProductShape => {
  const seed = seedIndex.get(p.slug);
  if (!seed) return p;
  return {
    ...p,
    oldPrice: seed.oldPrice ?? p.oldPrice,
    badge: p.badge ?? seed.badge,
    image: p.image || seed.image,
  };
};

const dtoToLegacy = (rows: ProductDTO[]): LegacyProductShape[] =>
  rows.map((r) => enrichLegacy(toLegacyProduct(r)));

// ---------- Actions ----------

export async function fetchProducts(input: ListProductsInput = {}): Promise<LegacyProductShape[]> {
  const data = listProductsInput.parse(input);
  try {
    const rows = await listProducts({ data });
    if (rows.length === 0) {
      return fallbackProducts().map(toLegacyProduct).map(enrichLegacy);
    }
    return dtoToLegacy(rows);
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[product.actions] fetchProducts fallback:", err);
    return fallbackProducts().map(toLegacyProduct).map(enrichLegacy);
  }
}

export async function fetchProductBySlug(slug: string): Promise<LegacyProductShape | null> {
  const parsed = z.string().trim().min(1).parse(slug);
  try {
    const dto = await getProductBySlugFn({ data: { slug: parsed } });
    if (dto) return enrichLegacy(toLegacyProduct(dto));
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[product.actions] fetchProductBySlug fallback:", err);
  }
  const seed = fallbackProducts().find((p) => p.slug === parsed);
  return seed ? enrichLegacy(toLegacyProduct(seed)) : null;
}

/**
 * Fetches a targeted set of products from Supabase by their IDs.
 *
 * Used exclusively by the Meta Commerce checkout bridge to resolve
 * products from URL parameters without loading the full catalog.
 *
 * Lookup order: UUID id → external_id (Meta Catalog) → slug.
 * Returns only products that exist — invalid IDs are silently ignored.
 * Never throws; returns [] on error.
 */
export async function fetchProductsByIds(ids: string[]): Promise<LegacyProductShape[]> {
  if (ids.length === 0) return [];
  const cleaned = [...new Set(ids.map((id) => id.trim()).filter(Boolean))].slice(0, 50);
  if (cleaned.length === 0) return [];
  try {
    const rows = await getProductsByIdsFn({ data: { ids: cleaned } });
    return dtoToLegacy(rows as import("@/lib/domain/product").ProductDTO[]);
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[product.actions] fetchProductsByIds error:", err);
    return [];
  }
}

/**
 * Category filtering. Accepts UUID (DB category_id) OR legacy category slug/id
 * (from `store-data.ts`) — legacy code passes slug through the `id` param.
 */
export async function fetchProductsByCategory(
  categoryIdOrSlug: string,
): Promise<LegacyProductShape[]> {
  const key = categoryIdOrSlug.trim();
  const isUuid = /^[0-9a-f-]{36}$/i.test(key);
  if (isUuid) {
    return fetchProducts({ categoryId: key });
  }
  // Legacy slug — filter after fetching all products since DB category_id
  // is UUID but seed uses slug-as-id.
  const all = await fetchProducts();
  return all.filter((p) => p.categoryId === key);
}

export async function searchProducts(q: string): Promise<LegacyProductShape[]> {
  const query = q.trim();
  if (!query) return fetchProducts();
  return fetchProducts({ search: query });
}

export async function fetchOffers(): Promise<LegacyProductShape[]> {
  const all = await fetchProducts();
  return all.filter((p) => typeof p.oldPrice === "number" && p.oldPrice > p.price);
}

export async function fetchBestSellers(limit = 4): Promise<LegacyProductShape[]> {
  const all = await fetchProducts({ limit });
  return [...all].sort((a, b) => b.rating * b.reviews - a.rating * a.reviews).slice(0, limit);
}
