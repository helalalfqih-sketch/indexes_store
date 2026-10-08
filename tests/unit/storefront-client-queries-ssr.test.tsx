import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  categories: vi.fn(),
  catalogPage: vi.fn(),
}));

vi.mock("@/lib/queries/catalog", () => ({
  categoriesQuery: () => ({
    queryKey: ["catalog", "test", "categories"],
    queryFn: mocks.categories,
  }),
  catalogKeys: {
    infiniteProducts: () => ["catalog", "test", "products-infinite"],
  },
  INFINITE_CATALOG_QUERY_POLICY: {},
}));

vi.mock("@/lib/actions/catalog-page.actions", () => ({
  fetchCatalogPage: mocks.catalogPage,
}));

vi.mock("@/lib/actions/category.actions", () => ({
  normalizeCategorySlug: (slug: string) => slug,
}));

import { InfiniteStorefrontCatalog } from "@/components/storefront/InfiniteStorefrontCatalog";
import { MobileReferenceHeader } from "@/components/storefront/MobileReferenceHeader";
import { VisualCategoryCircles } from "@/components/storefront/VisualCategoryCircles";

function renderWithQueryClient(node: ReactNode): { queryClient: QueryClient; html: string } {
  const queryClient = new QueryClient();
  const html = renderToString(
    <QueryClientProvider client={queryClient}>{node}</QueryClientProvider>,
  );
  return { queryClient, html };
}

describe("storefront client queries during SSR", () => {
  beforeEach(() => {
    mocks.categories.mockReset();
    mocks.catalogPage.mockReset();
  });

  it("does not start the mobile header category query", () => {
    const { queryClient } = renderWithQueryClient(
      <MobileReferenceHeader
        searchQuery=""
        onSearchChange={() => {}}
        cartCount={0}
        unreadNotificationsCount={0}
        onOpenCart={() => {}}
        onOpenNotifications={() => {}}
        onOpenMenu={() => {}}
      />,
    );

    expect(mocks.categories).not.toHaveBeenCalled();
    expect(queryClient.isFetching()).toBe(0);
  });

  it("renders the catalog skeleton without starting its infinite query", () => {
    const { queryClient, html } = renderWithQueryClient(
      <InfiniteStorefrontCatalog
        selectedCategoryId="all"
        searchQuery=""
        sortBy="default"
        priceRange="all"
        selectedBrands={[]}
        selectedRatings={[]}
        currency="YER"
        favorites={[]}
        onToggleFavorite={() => {}}
        onAddToCart={() => {}}
        onSelectProduct={() => {}}
      />,
    );

    expect(mocks.catalogPage).not.toHaveBeenCalled();
    expect(queryClient.isFetching()).toBe(0);
    expect(html.match(/animate-pulse/g)).toHaveLength(8);
    expect(html).not.toContain("لا توجد منتجات مطابقة");
  });

  it("renders category placeholders without starting a second category request", () => {
    const { queryClient } = renderWithQueryClient(
      <VisualCategoryCircles selectedCategoryId="all" onSelectCategory={() => {}} products={[]} />,
    );

    expect(mocks.categories).not.toHaveBeenCalled();
    expect(queryClient.isFetching()).toBe(0);
  });
});
