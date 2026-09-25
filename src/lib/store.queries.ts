import { queryOptions } from "@tanstack/react-query";
import { categoriesQuery } from "./queries/catalog";
import { fetchCategoryBySlug } from "./actions/category.actions";
import {
  fetchBestSellers,
  fetchOffers,
  fetchProducts,
  fetchProductBySlug,
} from "./actions/product.actions";

const CACHE_CONFIG = {
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 30,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
};

/**
 * TEMPORARY DIAGNOSTICS (dev-only, stripped from production bundles).
 * A queryFn only runs when react-query has no fresh cache → its execution IS
 * the network fetch. Cache hits never log NETWORK_FETCH.
 */
const perfLog = (label: string, key: string) => {
  if (import.meta.env.DEV) {
    const runtime = typeof window === "undefined" ? "server" : "client";

    console.info(`[PERF] ${label}`, { key, runtime, t: Date.now() });
  }
};

export const categoriesQueryOptions = categoriesQuery;

export const bestSellersQueryOptions = (limit = 4) =>
  queryOptions({
    queryKey: ["catalog-v4", "bestSellers", limit],
    queryFn: async () => {
      perfLog("PRODUCT_QUERY_NETWORK_FETCH", "bestSellers");
      return fetchBestSellers(limit);
    },
    ...CACHE_CONFIG,
  });

export const offersQueryOptions = () =>
  queryOptions({
    queryKey: ["catalog-v4", "offers"],
    queryFn: async () => {
      perfLog("PRODUCT_QUERY_NETWORK_FETCH", "offers");
      return fetchOffers(16);
    },
    ...CACHE_CONFIG,
  });

export const allProductsQueryOptions = () =>
  queryOptions({
    queryKey: ["catalog-v4", "allProducts", 24],
    queryFn: async () => {
      perfLog("PRODUCT_QUERY_START", "allProducts");
      perfLog("PRODUCT_QUERY_NETWORK_FETCH", "allProducts");
      return fetchProducts({ limit: 24 });
    },
    ...CACHE_CONFIG,
  });

export const productBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["catalog-v4", "product", slug],
    queryFn: async () => {
      return fetchProductBySlug(slug);
    },
    ...CACHE_CONFIG,
  });

export const categoryBySlugQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["catalog-v4", "category", id],
    queryFn: async () => {
      return fetchCategoryBySlug(id);
    },
    ...CACHE_CONFIG,
  });

export const productsByCategoryQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["catalog-v4", "productsByCategory", id, 24],
    queryFn: async () => {
      perfLog("PRODUCT_QUERY_NETWORK_FETCH", `category:${id}`);
      return fetchProducts({ categoryId: id, limit: 24 });
    },
    ...CACHE_CONFIG,
  });
