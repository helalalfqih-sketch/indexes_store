import { queryOptions } from "@tanstack/react-query";
import { fetchCategories, fetchCategoryBySlug } from "./actions/category.actions";
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
    // eslint-disable-next-line no-console
    console.info(`[PERF] ${label}`, { key, runtime, t: Date.now() });
  }
};

export const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async () => {
      return fetchCategories();
    },
    ...CACHE_CONFIG,
  });

export const bestSellersQueryOptions = (limit = 4) =>
  queryOptions({
    queryKey: ["bestSellers", limit],
    queryFn: async () => {
      perfLog("PRODUCT_QUERY_NETWORK_FETCH", "bestSellers");
      return fetchBestSellers(limit);
    },
    ...CACHE_CONFIG,
  });

export const offersQueryOptions = () =>
  queryOptions({
    queryKey: ["offers"],
    queryFn: async () => {
      perfLog("PRODUCT_QUERY_NETWORK_FETCH", "offers");
      return fetchOffers(16);
    },
    ...CACHE_CONFIG,
  });

export const allProductsQueryOptions = () =>
  queryOptions({
    queryKey: ["allProducts", 24],
    queryFn: async () => {
      perfLog("PRODUCT_QUERY_START", "allProducts");
      perfLog("PRODUCT_QUERY_NETWORK_FETCH", "allProducts");
      return fetchProducts({ limit: 24 });
    },
    ...CACHE_CONFIG,
  });

export const productBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => {
      return fetchProductBySlug(slug);
    },
    ...CACHE_CONFIG,
  });

export const categoryBySlugQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["category", id],
    queryFn: async () => {
      return fetchCategoryBySlug(id);
    },
    ...CACHE_CONFIG,
  });

export const productsByCategoryQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["productsByCategory", id, 24],
    queryFn: async () => {
      perfLog("PRODUCT_QUERY_NETWORK_FETCH", `category:${id}`);
      return fetchProducts({ categoryId: id, limit: 24 });
    },
    ...CACHE_CONFIG,
  });
