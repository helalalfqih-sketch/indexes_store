import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/category.actions", () => ({
  fetchCategories: vi.fn(),
  fetchCategoryBySlug: vi.fn(),
  normalizeCategorySlug: (slug: string) => slug.trim().toLowerCase().replace(/_/g, "-"),
}));

vi.mock("@/lib/actions/product.actions", () => ({
  fetchBestSellers: vi.fn(),
  fetchOffers: vi.fn(),
  fetchProducts: vi.fn(),
  fetchProductBySlug: vi.fn(),
}));

import {
  CATALOG_QUERY_POLICY,
  INFINITE_CATALOG_QUERY_POLICY,
  catalogKeys,
  categoriesQuery,
  productsQuery,
} from "@/lib/queries/catalog";
import {
  allProductsQueryOptions,
  categoriesQueryOptions,
  productsByCategoryQueryOptions,
} from "@/lib/store.queries";

describe("catalog query caching", () => {
  it("shares canonical keys across the legacy and storefront query adapters", () => {
    expect(categoriesQueryOptions().queryKey).toEqual(categoriesQuery().queryKey);
    expect(allProductsQueryOptions(24, 48).queryKey).toEqual(
      productsQuery({ limit: 24, offset: 48 }).queryKey,
    );
    expect(productsByCategoryQueryOptions("TOOLS_HARDWARE", 12, 24).queryKey).toEqual(
      catalogKeys.products({ categoryId: "tools-hardware", limit: 12, offset: 24 }),
    );
  });

  it("revalidates stale restored catalogs on mount without focus or reconnect churn", () => {
    const options = allProductsQueryOptions();

    expect(options.staleTime).toBe(CATALOG_QUERY_POLICY.staleTime);
    expect(options.gcTime).toBe(CATALOG_QUERY_POLICY.gcTime);
    expect(options.refetchOnMount).toBe(true);
    expect(options.refetchOnWindowFocus).toBe(false);
    expect(options.refetchOnReconnect).toBe(false);
    expect(INFINITE_CATALOG_QUERY_POLICY.refetchOnMount).toBe(true);
    expect(INFINITE_CATALOG_QUERY_POLICY.refetchOnWindowFocus).toBe(false);
    expect(INFINITE_CATALOG_QUERY_POLICY.refetchOnReconnect).toBe(false);
  });

  it("normalizes semantically identical filters into one cache entry", () => {
    expect(
      catalogKeys.infiniteProducts({
        categoryId: " tools_hardware ",
        search: "  drill ",
        limit: 24,
      }),
    ).toEqual(
      catalogKeys.infiniteProducts({
        categoryId: "tools-hardware",
        search: "drill",
        limit: 24,
      }),
    );
  });
});
