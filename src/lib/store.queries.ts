import { queryOptions } from "@tanstack/react-query";
import { fetchCategories, fetchCategoryBySlug } from "./actions/category.actions";
import {
  fetchBestSellers,
  fetchOffers,
  fetchProducts,
  fetchProductBySlug,
  fetchProductsByCategory,
} from "./actions/product.actions";

const CACHE_CONFIG = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 30,    // 30 minutes
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
      return fetchBestSellers(limit);
    },
    ...CACHE_CONFIG,
  });

export const offersQueryOptions = () =>
  queryOptions({
    queryKey: ["offers"],
    queryFn: async () => {
      return fetchOffers();
    },
    ...CACHE_CONFIG,
  });

export const allProductsQueryOptions = () =>
  queryOptions({
    queryKey: ["allProducts"],
    queryFn: async () => {
      return fetchProducts();
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
    queryKey: ["productsByCategory", id],
    queryFn: async () => {
      return fetchProductsByCategory(id);
    },
    ...CACHE_CONFIG,
  });
