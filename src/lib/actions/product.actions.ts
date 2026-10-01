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
import { toLegacyProduct, type LegacyProductShape } from "@/lib/data-adapter";
import type { ProductDTO } from "@/lib/domain/product";
import { isCatalogProductReady } from "@/lib/catalog-readiness";
import { fetchCatalogPage } from "@/lib/actions/catalog-page.actions";
import {
  listShopifyProducts,
  getShopifyProductBySlug,
  getShopifyProductsByIds,
  diagnoseShopifyCatalog,
} from "@/lib/shopify/catalog.functions";

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

const dtoToLegacy = (rows: ProductDTO[]): LegacyProductShape[] =>
  rows.filter(isCatalogProductReady).map(toLegacyProduct);

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
    if (shopify.configured) {
      const readyShopifyProducts = dtoToLegacy(shopify.items);
      if (readyShopifyProducts.length > 0 || data.categoryId) return readyShopifyProducts;

      // A healthy Shopify connection does not guarantee that the returned
      // products are storefront-ready. For example, a product can still be
      // missing a positive price, public image, or purchasable variant. In
      // that case, continue to the tenant-scoped Supabase catalog instead of
      // turning the whole storefront into an empty page. Supabase rows pass
      // the same readiness gate below, so this never exposes an unpurchasable
      // fallback product.
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[product.actions] Shopify catalog fallback:", err);
    await rethrowWhenShopifyIsRequired(err);
  }
  try {
    const rows = await listProducts({ data });
    return dtoToLegacy(rows);
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[product.actions] fetchProducts fallback:", err);
    throw err;
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
    if (dto && isCatalogProductReady(dto)) return toLegacyProduct(dto);
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[product.actions] fetchProductBySlug failed:", err);
    throw err;
  }
  return null;
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
  return fetchProducts({ categoryId: categoryIdOrSlug.trim(), limit: 100 });
}

export async function searchProducts(q: string): Promise<LegacyProductShape[]> {
  const query = q.trim();
  if (!query) return fetchProducts();
  return fetchProducts({ search: query });
}

export async function fetchOffers(limit = 20): Promise<LegacyProductShape[]> {
  const requested = Math.max(1, Math.min(limit, 100));
  const offers = new Map<string, LegacyProductShape>();
  const visitedCursors = new Set<string>();
  let after: string | null = null;
  // An empty first page of offers says nothing about later catalog pages.
  // Stop only once the requested number is found or the source is exhausted.
  while (offers.size < requested) {
    const page = await fetchCatalogPage({ first: 99, after });
    for (const product of page.items) {
      if (
        product.isDeal ||
        (typeof product.oldPrice === "number" && product.oldPrice > product.price) ||
        (product.badge && /عرض|خصم|تخفيض/.test(product.badge))
      )
        offers.set(product.id, product);
    }
    if (!page.hasNextPage) break;
    if (!page.endCursor || visitedCursors.has(page.endCursor)) {
      throw new Error("Catalog pagination did not advance");
    }
    visitedCursors.add(page.endCursor);
    after = page.endCursor;
  }
  return [...offers.values()].slice(0, requested);
}

export async function fetchBestSellers(limit = 20): Promise<LegacyProductShape[]> {
  const requested = Math.max(1, Math.min(limit, 100));
  const all = await fetchProducts({ limit: Math.min(100, Math.max(requested * 2, 16)) });
  return [...all].sort((a, b) => b.rating * b.reviews - a.rating * a.reviews).slice(0, limit);
}
