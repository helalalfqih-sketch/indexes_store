import { queryOptions } from "@tanstack/react-query";
import { fetchCategoryBySlug, normalizeCategorySlug } from "./actions/category.actions";
import { fetchProductBySlug } from "./actions/product.actions";
import {
  CATALOG_QUERY_POLICY,
  bestSellersQuery,
  catalogKeys,
  categoriesQuery,
  offersQuery,
  productsQuery,
} from "./queries/catalog";

export const categoriesQueryOptions = categoriesQuery;

export const bestSellersQueryOptions = bestSellersQuery;

export const offersQueryOptions = (limit = 16) => offersQuery(limit);

export const allProductsQueryOptions = (limit = 24, offset = 0) => productsQuery({ limit, offset });

export const productBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: catalogKeys.product(slug),
    queryFn: () => fetchProductBySlug(slug.trim()),
    ...CATALOG_QUERY_POLICY,
  });

export const categoryBySlugQueryOptions = (id: string) =>
  queryOptions({
    queryKey: catalogKeys.category(id),
    queryFn: () => fetchCategoryBySlug(normalizeCategorySlug(id)),
    ...CATALOG_QUERY_POLICY,
  });

export const productsByCategoryQueryOptions = (id: string, limit = 24, offset = 0) =>
  productsQuery({ categoryId: normalizeCategorySlug(id), limit, offset });
