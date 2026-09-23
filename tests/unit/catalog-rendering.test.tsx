// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { InfiniteStorefrontCatalog } from "../../src/components/storefront/InfiniteStorefrontCatalog";
const { query } = vi.hoisted(() => ({
  query: {
    data: { pages: [] as { items: unknown[] }[] },
    isLoading: false,
    isError: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  },
}));
vi.mock("@tanstack/react-query", () => ({ useInfiniteQuery: () => query }));
vi.mock("@/lib/actions/catalog-page.actions", () => ({ fetchCatalogPage: vi.fn() }));
vi.mock("@/components/storefront/adapters", () => ({
  mapProductionProductToDesignProduct: (p: unknown) => p,
}));
vi.mock("@/components/storefront/ProductCard", () => ({
  ProductCard: ({ product }: { product: { id: string; name: string } }) => (
    <article data-testid={product.id}>{product.name}</article>
  ),
}));
vi.mock("@/components/storefront/SkeletonLoader", () => ({ ProductGridSkeleton: () => null }));
afterEach(cleanup);
const props = {
  selectedCategoryId: "all",
  searchQuery: "",
  sortBy: "default" as const,
  priceRange: "all" as const,
  selectedBrands: [],
  selectedRatings: [],
  currency: "YER" as const,
  favorites: [],
  onToggleFavorite: vi.fn(),
  onAddToCart: vi.fn(),
  onSelectProduct: vi.fn(),
};
const item = (id: string, category = "المنزل-والمطبخ") => ({
  id,
  name: id,
  category,
  priceYER: 100,
  originalPriceYER: 100,
  rating: 0,
});
describe("single catalog rendering", () => {
  it("deduplicates page overlap and restores an offer when its separate section is hidden", () => {
    query.data.pages = [{ items: [item("a"), item("b")] }, { items: [item("a"), item("c")] }];
    const { rerender } = render(<InfiniteStorefrontCatalog {...props} excludeIds={["a"]} />);
    expect(screen.queryByTestId("a")).toBeNull();
    expect(screen.getAllByRole("article")).toHaveLength(2);
    rerender(<InfiniteStorefrontCatalog {...props} excludeIds={[]} />);
    expect(screen.getAllByTestId("a")).toHaveLength(1);
    expect(screen.getByTestId("c")).toBeTruthy();
  });
  it("applies the selected canonical category to every loaded page", () => {
    query.data.pages = [{ items: [item("home")] }, { items: [item("car", "السيارات-وملحقاتها")] }];
    render(<InfiniteStorefrontCatalog {...props} selectedCategoryId="السيارات-وملحقاتها" />);
    expect(screen.queryByTestId("home")).toBeNull();
    expect(screen.getByTestId("car")).toBeTruthy();
  });
});
