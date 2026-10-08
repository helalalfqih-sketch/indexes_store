/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ catalogPage: vi.fn() }));

vi.mock("@/lib/queries/catalog", () => ({
  catalogKeys: {
    infiniteProducts: () => ["catalog", "test", "products-infinite"],
  },
  INFINITE_CATALOG_QUERY_POLICY: { retry: false },
}));

vi.mock("@/lib/actions/catalog-page.actions", () => ({
  fetchCatalogPage: mocks.catalogPage,
}));

vi.mock("@/lib/actions/category.actions", () => ({
  normalizeCategorySlug: (slug: string) => slug,
}));

import { InfiniteStorefrontCatalog } from "@/components/storefront/InfiniteStorefrontCatalog";

describe("InfiniteStorefrontCatalog query input", () => {
  beforeEach(() => {
    mocks.catalogPage.mockReset();
    mocks.catalogPage.mockResolvedValue({ items: [], endCursor: null, hasNextPage: false });
  });
  afterEach(cleanup);

  it("translates UI brand ids to real vendor values before server filtering", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <InfiniteStorefrontCatalog
          selectedCategoryId="all"
          searchQuery=""
          sortBy="default"
          priceRange="all"
          selectedBrands={["apple"]}
          selectedRatings={[]}
          currency="YER"
          favorites={[]}
          onToggleFavorite={() => {}}
          onAddToCart={() => {}}
          onSelectProduct={() => {}}
        />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mocks.catalogPage).toHaveBeenCalledOnce());
    const input = mocks.catalogPage.mock.calls[0]?.[0];
    expect(input.brands).toEqual(expect.arrayContaining(["Apple", "APPLE", "أبل"]));
    expect(input.brands).not.toContain("apple");
  });
});
