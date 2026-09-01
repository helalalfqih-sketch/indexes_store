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
import type { LegacyProductShape, LegacyCategoryShape } from "@/lib/data-adapter";

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
const CATALOG_CACHE_VERSION = "v2" as const;

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
    queryFn: () => fetchBestSellers(limit) as Promise<LegacyProductShape[]>,
    ...CATALOG_POLICY,
  });

export const offersQuery = (limit = 6) =>
  queryOptions({
    queryKey: catalogKeys.offers,
    queryFn: () => fetchOffers(limit) as Promise<LegacyProductShape[]>,
    ...CATALOG_POLICY,
  });

export const productsQuery = (limit = 12) =>
  queryOptions({
    queryKey: catalogKeys.products(limit),
    queryFn: () => fetchProducts({ limit }) as Promise<LegacyProductShape[]>,
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
    ...CATALOG_POLICY,
  });
