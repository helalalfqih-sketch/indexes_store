/**
 * Product Actions — UI-facing entry point for product data.
 *
 *  UI ──► actions ──► server functions ──► repositories ──► Supabase
 *
 * Rules:
 *  - UI never imports server fns / repos / supabase directly for catalog reads.
 *  - Returns legacy UI shapes (LegacyProductShape) so existing components
 *  keep working without changes. DTO-native components can call the raw
 *    server fns.
 *  - Demo seed data is development-only. Production returns an empty/error
 *    state instead of displaying products that cannot be purchased.
 */
import { z } from "zod";
import {
  listProducts,
  getProductBySlug as getProductBySlugFn,
  getProductsByIds as getProductsByIdsFn,
} from "@/lib/catalog.functions";
import { normalizeCategorySlug } from "@/lib/actions/category.actions";
import { fallbackProducts, toLegacyProduct, type LegacyProductShape } from "@/lib/data-adapter";
import type { ProductDTO } from "@/lib/domain/product";
import { isCatalogProductReady, shouldUseDemoCatalog } from "@/lib/catalog-readiness";
import {
  listShopifyProducts,
  getShopifyProductBySlug,
  getShopifyProductsByIds,
  diagnoseShopifyCatalog,
} from "@/lib/shopify/catalog.functions";
import { products as seedProducts } from "@/lib/store-data";

// ---------- Input validation ----------

export const listProductsInput = z
  .object({
    // Shopify collection handles are stable string identifiers; legacy
    // Supabase category UUIDs remain accepted during the migration window.
    categoryId: z.string().trim().max(255).optional(),
    search: z.string().trim().max(120).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
    tenantId: z.string().uuid().optional(),
  })
  .partial();
export type ListProductsInput = z.infer<typeof listProductsInput>;

const DEFAULT_CATALOG_PAGE_SIZE = 24;
const CURATED_CATALOG_OVERSCAN_FACTOR = 2;
const MIN_CURATED_CANDIDATES = 16;

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
  rows.filter(isCatalogProductReady).map(toLegacyProduct);

const developmentFallbackProducts = (): LegacyProductShape[] => {
  if (!shouldUseDemoCatalog(import.meta.env.DEV)) return [];
  return fallbackProducts().map(toLegacyProduct).map(enrichLegacy);
};

async function rethrowWhenShopifyIsRequired(error: unknown): Promise<void> {
  const status = await diagnoseShopifyCatalog();
  if (status.source === "shopify") {
    throw error instanceof Error ? error : new Error("Shopify catalog request failed");
  }
}

// ---------- Actions ----------

export async function fetchProducts(input: ListProductsInput = {}): Promise<LegacyProductShape[]> {
  const parsed = listProductsInput.parse(input);
  const data = {
    ...parsed,
    categoryId: parsed.categoryId ? normalizeCategorySlug(parsed.categoryId) : undefined,
    limit: parsed.limit ?? DEFAULT_CATALOG_PAGE_SIZE,
    offset: parsed.offset ?? 0,
  };
  try {
    const shopify = await listShopifyProducts({
      data: {
        search: data.search,
        categoryId: data.categoryId,
        limit: data.limit,
        offset: data.offset,
      },
    });
    if (shopify.configured) {
      const readyShopifyProducts = dtoToLegacy(shopify.items);
      return readyShopifyProducts;
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[product.actions] Shopify catalog fallback:", err);
    await rethrowWhenShopifyIsRequired(err);
  }
  try {
    const rows = await listProducts({ data });
    if (rows.length === 0) {
      const normalizedSearch = data.search?.toLocaleLowerCase();
      const fallback = developmentFallbackProducts().filter((product) => {
        if (
          data.categoryId &&
          normalizeCategorySlug(product.categoryId ?? "") !== data.categoryId
        ) {
          return false;
        }
        if (normalizedSearch && !product.name.toLocaleLowerCase().includes(normalizedSearch)) {
          return false;
        }
        return true;
      });
      return fallback.slice(data.offset, data.offset + data.limit);
    }
    return dtoToLegacy(rows);
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[product.actions] fetchProducts fallback:", err);
    throw new Error("تعذر تحميل المنتجات. حاول مرة أخرى.");
  }
}

export async function fetchProductBySlug(slug: string): Promise<LegacyProductShape | null> {
  const parsed = z.string().trim().min(1).parse(slug);
  try {
    const shopify = await getShopifyProductBySlug({ data: { slug: parsed } });
    if (shopify.configured) {
      return shopify.item && isCatalogProductReady(shopify.item)
        ? toLegacyProduct(shopify.item)
        : null;
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[product.actions] Shopify product fallback:", err);
    await rethrowWhenShopifyIsRequired(err);
  }
  try {
    const dto = await getProductBySlugFn({ data: { slug: parsed } });
    if (dto && isCatalogProductReady(dto)) return enrichLegacy(toLegacyProduct(dto));
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[product.actions] fetchProductBySlug fallback:", err);
  }
  if (!shouldUseDemoCatalog(import.meta.env.DEV)) return null;
  const seed = fallbackProducts().find((product) => product.slug === parsed);
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
    const shopify = await getShopifyProductsByIds({ data: { ids: cleaned } });
    if (shopify.configured) return dtoToLegacy(shopify.items);
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[product.actions] Shopify product IDs fallback:", err);
    await rethrowWhenShopifyIsRequired(err);
  }
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
  options: Pick<ListProductsInput, "limit" | "offset"> = {},
): Promise<LegacyProductShape[]> {
  const categoryId = normalizeCategorySlug(z.string().trim().min(1).parse(categoryIdOrSlug));
  return fetchProducts({
    categoryId,
    limit: options.limit ?? DEFAULT_CATALOG_PAGE_SIZE,
    offset: options.offset ?? 0,
  });
}

export async function searchProducts(q: string): Promise<LegacyProductShape[]> {
  const query = q.trim();
  if (!query) return fetchProducts();
  return fetchProducts({ search: query });
}

const curatedSectionLimits = (limit: number): { requested: number; candidates: number } => {
  const requested = Math.min(100, Math.max(1, Math.trunc(limit)));
  return {
    requested,
    candidates: Math.min(
      100,
      Math.max(MIN_CURATED_CANDIDATES, requested * CURATED_CATALOG_OVERSCAN_FACTOR),
    ),
  };
};

export async function fetchOffers(limit = 20): Promise<LegacyProductShape[]> {
  const { requested, candidates } = curatedSectionLimits(limit);
  const all = await fetchProducts({ limit: candidates, offset: 0 });
  const explicitOffers = all.filter(
    (p) =>
      p.isDeal ||
      (typeof p.oldPrice === "number" && p.oldPrice > p.price) ||
      (p.badge &&
        (p.badge.includes("عرض") || p.badge.includes("خصم") || p.badge.includes("تخفيض"))),
  );

  if (explicitOffers.length > 0) {
    return explicitOffers.slice(0, requested);
  }

  return [];
}

export async function fetchBestSellers(limit = 20): Promise<LegacyProductShape[]> {
  const { requested, candidates } = curatedSectionLimits(limit);
  const all = await fetchProducts({ limit: candidates, offset: 0 });
  return [...all].sort((a, b) => b.rating * b.reviews - a.rating * a.reviews).slice(0, requested);
}
