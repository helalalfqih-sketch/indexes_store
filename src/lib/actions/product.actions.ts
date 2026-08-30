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
 *  - Falls back to seed data (store-data.ts) on error or empty DB — the
 *    data-adapter safety net stays until Phase C removes it.
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
import {
  listShopifyProducts,
  getShopifyProductBySlug,
  getShopifyProductsByIds,
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

// NOTE: Previous implementation filtered rows by `typeof r.price === "number" && r.price > 0`.
// That caused products with a missing `price` field to be silently dropped even if they
// had a valid fallback price in `compare_at_price`, `old_price`, or `cost_price`.
// We normalize and resolve a price before converting to the legacy shape so that
// products with an alternate stored price are not lost from the storefront.
const dtoToLegacy = (rows: ProductDTO[]): LegacyProductShape[] =>
  rows
    .map((r) => {
      // Resolve a usable price for display / legacy conversion.
      let resolvedPrice: number | null = null;

      if (typeof r.price === "number" && !Number.isNaN(r.price) && r.price > 0) {
        resolvedPrice = r.price;
      } else if (typeof r.compare_at_price === "number" && r.compare_at_price > 0) {
        resolvedPrice = r.compare_at_price;
      } else if (typeof r.old_price === "number" && r.old_price > 0) {
        // Some DTOs use old_price (snake_case) — accept it as fallback.
        resolvedPrice = r.old_price;
      } else if (typeof r.cost_price === "number" && r.cost_price > 0) {
        resolvedPrice = r.cost_price;
      } else {
        resolvedPrice = null;
      }

      return { original: r, resolvedPrice } as const;
    })
    // Keep rows where we could resolve a reasonable price.
    .filter((entry) => entry.resolvedPrice !== null)
    .map((entry) => {
      // Inject the resolved price into a normalized DTO so `toLegacyProduct`
      // and downstream UI code always see a numeric `price` field.
      const normalized: ProductDTO = {
        ...entry.original,
        price: entry.resolvedPrice as number,
      };
      return enrichLegacy(toLegacyProduct(normalized));
    });

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
  }
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
    const shopify = await getShopifyProductBySlug({ data: { slug: parsed } });
    if (shopify.configured && shopify.item) {
      return enrichLegacy(toLegacyProduct(shopify.item));
    }
    // A configured Shopify catalog can coexist with legacy Supabase products.
    // If the handle is not in Shopify, continue to the Supabase lookup below.
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[product.actions] Shopify product fallback:", err);
  }
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
    const shopify = await getShopifyProductsByIds({ data: { ids: cleaned } });
    if (shopify.configured) return dtoToLegacy(shopify.items);
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[product.actions] Shopify product IDs fallback:", err);
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

  let categories: Awaited<ReturnType<typeof fetchCategories>> = [];
  try {
    categories = await fetchCategories();
  } catch {
    /* ignore */
  }

  const matchedCat = categories.find((category) => {
    const categoryKey = category.id.toLowerCase().replace(/_/g, "-");
    return category.id === key || categoryKey === cleanKey;
  });
  const targetSlug = matchedCat?.id ?? cleanKey;
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

export async function fetchOffers(): Promise<LegacyProductShape[]> {
  const all = await fetchProducts();
  const explicitOffers = all.filter(
    (p) =>
      p.isDeal ||
      (typeof p.oldPrice === "number" && p.oldPrice > p.price) ||
      (p.badge &&
        (p.badge.includes("عرض") || p.badge.includes("خصم") ||
          p.badge.includes("تخفيض"))),
  );

  if (explicitOffers.length > 0) {
    return explicitOffers;
  }

  // Fallback: pick products and compute deal pricing so offers page & home deals section are vibrant
  return all.slice(0, 8).map((p) => ({
    ...p,
    oldPrice: p.oldPrice || Math.round(p.price * 1.25),
    badge: p.badge || "عرض خاص 🔥",
  }));
}

export async function fetchBestSellers(limit = 20): Promise<LegacyProductShape[]> {
  const all = await fetchProducts({ limit: 100 });
  return [...all].sort((a, b) => b.rating * b.reviews - a.rating * a.reviews).slice(0, limit);
}
