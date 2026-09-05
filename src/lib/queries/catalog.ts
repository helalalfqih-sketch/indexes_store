/**
 * Catalog query adapters for the new storefront design.
 *
 * This file bridges the new index.tsx (which uses the Lovable design
 * naming conventions) with the existing store.queries.ts functions.
 * Both use the same underlying action functions, so there is no
 * duplication of network calls.
 */
import { queryOptions } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/actions/category.actions";
import {
  fetchBestSellers,
  fetchOffers,
  fetchProducts,
} from "@/lib/actions/product.actions";
import {
  fallbackProducts,
  toLegacyProduct,
  type LegacyProductShape,
  type LegacyCategoryShape,
} from "@/lib/data-adapter";

/**
 * Product availability changes in Shopify must reach the storefront quickly.
 * Catalog queries are still cached briefly for performance, but unlike the
 * previous policy they always revalidate on mount/reconnect/focus so deleted,
 * archived, or newly-published Shopify products do not remain visible from a
 * persisted IndexedDB snapshot.
 */
const CATALOG_POLICY = {
  staleTime: 60_000,
  gcTime: 10 * 60_000,
  refetchOnWindowFocus: true,
  refetchOnMount: "always" as const,
  refetchOnReconnect: true,
} as const;

/**
 * Increment when catalog persistence semantics change. This deliberately
 * invalidates old persisted React Query catalog snapshots after deployment.
 */
const CATALOG_CACHE_VERSION = "v3" as const;

/**
 * Server-rendered fallback content.
 *
 * The home route uses non-suspense React Query hooks. Without placeholder data,
 * SSR rendered an empty catalog ("0 products") before Shopify completed on the
 * client, which search engines could index. These seeded rows are replaced by
 * fresh Shopify data immediately because refetchOnMount is always enabled.
 */
const seededCatalog = (): LegacyProductShape[] =>
  fallbackProducts()
    .map(toLegacyProduct)
    .filter((product) => typeof product.price === "number" && product.price > 0);

const seededBestSellers = (limit: number): LegacyProductShape[] =>
  [...seededCatalog()]
    .sort((a, b) => b.rating * b.reviews - a.rating * a.reviews)
    .slice(0, limit);

const seededOffers = (limit: number): LegacyProductShape[] => {
  const seeded = seededCatalog();
  const offers = seeded.filter(
    (product) =>
      product.isDeal ||
      (typeof product.oldPrice === "number" && product.oldPrice > product.price) ||
      Boolean(product.badge),
  );
  return (offers.length ? offers : seeded).slice(0, limit);
};

async function fetchWiderCatalog(limit: number): Promise<LegacyProductShape[]> {
  // Many newly imported Shopify products may temporarily have a 0 price while
  // prices are still being approved. fetchProducts intentionally hides those
  // rows, so scan a wider slice before declaring the storefront empty.
  const scanLimit = Math.min(100, Math.max(limit * 8, 64));
  return (await fetchProducts({ limit: scanLimit })).slice(0, limit);
}

/** Stable, primitive-only query keys */
export const catalogKeys = {
  categories: ["catalog", CATALOG_CACHE_VERSION, "categories"] as const,
  bestSellers: (limit: number) =>
    ["catalog", CATALOG_CACHE_VERSION, "best-sellers", limit] as const,
  offers: ["catalog", CATALOG_CACHE_VERSION, "offers"] as const,
  products: (limit: number) => ["catalog", CATALOG_CACHE_VERSION, "products", limit] as const,
  globePool: (perPage: number) =>
    ["catalog", CATALOG_CACHE_VERSION, "globe-pool", perPage] as const,
};

export const categoriesQuery = () =>
  queryOptions({
    queryKey: catalogKeys.categories,
    queryFn: () => fetchCategories() as Promise<LegacyCategoryShape[]>,
    ...CATALOG_POLICY,
  });

export const bestSellersQuery = (limit = 4) =>
  queryOptions({
    queryKey: catalogKeys.bestSellers(limit),
    queryFn: async () => {
      const items = (await fetchBestSellers(limit)) as LegacyProductShape[];
      return items.length ? items : fetchWiderCatalog(limit);
    },
    placeholderData: () => seededBestSellers(limit),
    ...CATALOG_POLICY,
  });

export const offersQuery = (limit = 6) =>
  queryOptions({
    queryKey: catalogKeys.offers,
    queryFn: async () => {
      const items = (await fetchOffers(limit)) as LegacyProductShape[];
      return items.length ? items : fetchWiderCatalog(limit);
    },
    placeholderData: () => seededOffers(limit),
    ...CATALOG_POLICY,
  });

export const productsQuery = (limit = 12) =>
  queryOptions({
    queryKey: catalogKeys.products(limit),
    queryFn: async () => {
      const items = (await fetchProducts({ limit })) as LegacyProductShape[];
      return items.length ? items : fetchWiderCatalog(limit);
    },
    placeholderData: () => seededCatalog().slice(0, limit),
    ...CATALOG_POLICY,
  });

/**
 * Larger pool used by the immersive globe. Oversampled from both ends
 * of the catalog so the globe has far more rows than rendered tiles.
 */
export const globePoolQuery = (perPage = 100) =>
  queryOptions({
    queryKey: catalogKeys.globePool(perPage),
    queryFn: async () => {
      // fetchProducts doesn't support oldestFirst, so we fetch a single large pool.
      // The globe oversamples naturally because perPage defaults to 100.
      return fetchProducts({ limit: perPage }) as Promise<LegacyProductShape[]>;
    },
    placeholderData: () => seededCatalog().slice(0, perPage),
    ...CATALOG_POLICY,
  });
