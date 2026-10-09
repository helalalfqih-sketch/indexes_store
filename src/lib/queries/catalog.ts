/**
 * Catalog query adapters for the new storefront design.
 *
 * This file bridges the new index.tsx (which uses the Lovable design
 * naming conventions) with the existing store.queries.ts functions.
 * Both use the same underlying action functions, so there is no
 * duplication of network calls.
 */
import { queryOptions } from "@tanstack/react-query";
import { fetchCategories, normalizeCategorySlug } from "@/lib/actions/category.actions";
import {
  fetchBestSellers,
  fetchOffers,
  fetchProducts,
  type ListProductsInput,
} from "@/lib/actions/product.actions";
import {
  fallbackProducts,
  toLegacyProduct,
  type LegacyProductShape,
  type LegacyCategoryShape,
} from "@/lib/data-adapter";

export const CATALOG_QUERY_POLICY = {
  staleTime: 10 * 60_000,
  gcTime: 60 * 60_000,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  refetchOnReconnect: false,
} as const;

export const INFINITE_CATALOG_QUERY_POLICY = {
  ...CATALOG_QUERY_POLICY,
  // `true` is stale-only in TanStack Query. Persisted pages therefore
  // revalidate after the ten-minute stale window, while focus/reconnect stay
  // disabled so browsing does not repeatedly replay the retained page set.
  refetchOnMount: true,
} as const;

/**
 * Increment when catalog persistence semantics change. This deliberately
 * invalidates old persisted React Query catalog snapshots after deployment.
 */
const CATALOG_CACHE_VERSION = "v6" as const;
export const DEFAULT_CATALOG_PAGE_SIZE = 24;

export type CatalogProductsQueryInput = Pick<
  ListProductsInput,
  "categoryId" | "search" | "limit" | "offset"
>;

const clampLimit = (limit: number | undefined, fallback: number): number =>
  Math.min(100, Math.max(1, Math.trunc(limit ?? fallback)));

export const normalizeCatalogProductsInput = (
  input: CatalogProductsQueryInput = {},
): Required<Pick<ListProductsInput, "limit" | "offset">> &
  Pick<ListProductsInput, "categoryId" | "search"> => {
  const categoryId = input.categoryId?.trim();
  const search = input.search?.trim();
  return {
    categoryId: categoryId && categoryId !== "all" ? normalizeCategorySlug(categoryId) : undefined,
    search: search || undefined,
    limit: clampLimit(input.limit, DEFAULT_CATALOG_PAGE_SIZE),
    offset: Math.max(0, Math.trunc(input.offset ?? 0)),
  };
};

/**
 * Server-rendered fallback content.
 *
 * The home route uses non-suspense React Query hooks. Without placeholder data,
 * SSR rendered an empty catalog ("0 products") before Shopify completed on the
 * client, which search engines could index. Placeholder rows are never written
 * into the query cache and are replaced by the bounded catalog request.
 */
const seededCatalog = (): LegacyProductShape[] => {
  if (!import.meta.env.DEV) return [];
  return fallbackProducts()
    .map(toLegacyProduct)
    .filter((product) => typeof product.price === "number" && product.price > 0);
};

const seededBestSellers = (limit: number): LegacyProductShape[] =>
  [...seededCatalog()].sort((a, b) => b.rating * b.reviews - a.rating * a.reviews).slice(0, limit);

const seededOffers = (limit: number): LegacyProductShape[] => {
  const seeded = seededCatalog();
  const offers = seeded.filter(
    (product) =>
      product.isDeal || (typeof product.oldPrice === "number" && product.oldPrice > product.price),
  );
  return offers.slice(0, limit);
};

/** Stable, primitive-only query keys */
export const catalogKeys = {
  all: ["catalog"] as const,
  version: ["catalog", CATALOG_CACHE_VERSION] as const,
  categories: ["catalog", CATALOG_CACHE_VERSION, "categories"] as const,
  bestSellers: (limit: number) =>
    ["catalog", CATALOG_CACHE_VERSION, "best-sellers", clampLimit(limit, 4)] as const,
  offers: (limit: number) =>
    ["catalog", CATALOG_CACHE_VERSION, "offers", clampLimit(limit, 6)] as const,
  products: (input: CatalogProductsQueryInput = {}) => {
    const normalized = normalizeCatalogProductsInput(input);
    return [
      "catalog",
      CATALOG_CACHE_VERSION,
      "products",
      normalized.categoryId ?? "all",
      normalized.search ?? "",
      normalized.limit,
      normalized.offset,
    ] as const;
  },
  infiniteProducts: (input: CatalogProductsQueryInput = {}) => {
    const normalized = normalizeCatalogProductsInput(input);
    return [
      "catalog",
      CATALOG_CACHE_VERSION,
      "products-infinite",
      normalized.categoryId ?? "all",
      normalized.search ?? "",
      normalized.limit,
    ] as const;
  },
  product: (slug: string) => ["catalog", CATALOG_CACHE_VERSION, "product", slug.trim()] as const,
  category: (slug: string) =>
    ["catalog", CATALOG_CACHE_VERSION, "category", normalizeCategorySlug(slug)] as const,
  globePool: (perPage: number) =>
    ["catalog", CATALOG_CACHE_VERSION, "globe-pool", clampLimit(perPage, 100)] as const,
};

export const categoriesQuery = () =>
  queryOptions({
    queryKey: catalogKeys.categories,
    queryFn: () => fetchCategories() as Promise<LegacyCategoryShape[]>,
    ...CATALOG_QUERY_POLICY,
  });

export const bestSellersQuery = (limit = 4) =>
  queryOptions({
    queryKey: catalogKeys.bestSellers(limit),
    queryFn: () => fetchBestSellers(clampLimit(limit, 4)) as Promise<LegacyProductShape[]>,
    placeholderData: () => seededBestSellers(limit),
    ...CATALOG_QUERY_POLICY,
  });

export const offersQuery = (limit = 6) =>
  queryOptions({
    queryKey: catalogKeys.offers(limit),
    queryFn: () => fetchOffers(clampLimit(limit, 6)) as Promise<LegacyProductShape[]>,
    placeholderData: () => seededOffers(limit),
    ...CATALOG_QUERY_POLICY,
  });

export const productsQuery = (input: number | CatalogProductsQueryInput = 12) => {
  const normalized = normalizeCatalogProductsInput(
    typeof input === "number" ? { limit: input } : input,
  );
  return queryOptions({
    queryKey: catalogKeys.products(normalized),
    queryFn: () => fetchProducts(normalized) as Promise<LegacyProductShape[]>,
    placeholderData: () =>
      seededCatalog().slice(normalized.offset, normalized.offset + normalized.limit),
    ...CATALOG_QUERY_POLICY,
  });
};

/**
 * Larger pool used by the immersive globe. Oversampled from both ends
 * of the catalog so the globe has far more rows than rendered tiles.
 */
export const globePoolQuery = (perPage = 100) =>
  queryOptions({
    queryKey: catalogKeys.globePool(perPage),
    queryFn: () =>
      fetchProducts({ limit: clampLimit(perPage, 100), offset: 0 }) as Promise<
        LegacyProductShape[]
      >,
    placeholderData: () => seededCatalog().slice(0, perPage),
    ...CATALOG_QUERY_POLICY,
  });
