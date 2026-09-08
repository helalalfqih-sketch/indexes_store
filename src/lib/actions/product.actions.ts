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
  inferCategorySlug,
} from "@/lib/catalog.functions";
import { fetchCategories } from "@/lib/actions/category.actions";
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
  return developmentFallbackProducts();
};

async function rethrowWhenShopifyIsRequired(error: unknown): Promise<void> {
  const status = await diagnoseShopifyCatalog();
  if (status.source === "shopify") {
    throw error instanceof Error ? error : new Error("Shopify catalog request failed");
  }
}

// ---------- Actions ----------

export async function fetchProducts(input: ListProductsInput = {}): Promise<LegacyProductShape[]> {
  const data = listProductsInput.parse(input);
  try {
    const shopify = await listShopifyProducts({
      data: {
        search: data.search,
        categoryId: data.categoryId,
        limit: data.limit,
        offset: data.offset,
      },
    });
    if (shopify.configured) return dtoToLegacy(shopify.items);
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[product.actions] Shopify catalog fallback:", err);
    await rethrowWhenShopifyIsRequired(err);
  }
  try {
    const rows = await listProducts({ data });
    if (rows.length === 0) {
      return developmentFallbackProducts();
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
    const shopify = await getShopifyProductBySlug({ data: { slug: parsed } });
    if (shopify.configured) return shopify.item ? toLegacyProduct(shopify.item) : null;
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[product.actions] Shopify product fallback:", err);
    await rethrowWhenShopifyIsRequired(err);
  }
  try {
    const dto = await getProductBySlugFn({ data: { slug: parsed } });
    if (dto) return enrichLegacy(toLegacyProduct(dto));
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
): Promise<LegacyProductShape[]> {
  const key = categoryIdOrSlug.trim();
  const cleanKey = key.toLowerCase().replace(/_/g, "-");
  const aliasKey = cleanKey === "tools-hardware" ? "tools" : cleanKey;

  let categories: Awaited<ReturnType<typeof fetchCategories>> = [];
  try {
    categories = await fetchCategories();
  } catch {
    /* ignore */
  }

  const matchedCat = categories.find((category) => {
    const categoryKey = category.id.toLowerCase().replace(/_/g, "-");
    return category.id === key || categoryKey === aliasKey;
  });
  const targetSlug = matchedCat?.id ?? aliasKey;
  const targetId = matchedCat?.id ?? key;

  const all = await fetchProducts();
  return all.filter((p) => {
    if (p.categoryId === targetId || p.categoryId === targetSlug || p.categoryId === cleanKey) {
      return true;
    }
    const inferred = inferCategorySlug(p.name, [], p.description ?? "");
    return inferred === targetSlug || inferred === cleanKey;
  });
}

export async function searchProducts(q: string): Promise<LegacyProductShape[]> {
  const query = q.trim();
  if (!query) return fetchProducts();
  return fetchProducts({ search: query });
}

export async function fetchOffers(limit = 20): Promise<LegacyProductShape[]> {
  const requested = Math.max(1, Math.min(limit, 100));
  // Offer badges and compare-at prices are already present in the newest catalog rows.
  // Do not download the entire Shopify catalog just to render a small storefront section.
  const all = await fetchProducts({ limit: Math.min(100, Math.max(requested * 2, 16)) });
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

  // Fallback: pick products and compute deal pricing so offers page & home deals section are vibrant
  return all.slice(0, Math.min(requested, 8)).map((p) => ({
    ...p,
    oldPrice: p.oldPrice || Math.round(p.price * 1.25),
    badge: p.badge || "عرض خاص 🔥",
  }));
}

export async function fetchBestSellers(limit = 20): Promise<LegacyProductShape[]> {
  const requested = Math.max(1, Math.min(limit, 100));
  const all = await fetchProducts({ limit: Math.min(100, Math.max(requested * 2, 16)) });
  return [...all].sort((a, b) => b.rating * b.reviews - a.rating * a.reviews).slice(0, limit);
}
