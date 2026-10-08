import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listShopifyProductsPage: vi.fn(),
  listProducts: vi.fn(),
}));

vi.mock("@/lib/shopify/catalog.functions", () => ({
  listShopifyProductsPage: mocks.listShopifyProductsPage,
}));

vi.mock("@/lib/catalog.functions", () => ({
  listProducts: mocks.listProducts,
}));

import { fetchCatalogPage } from "@/lib/actions/catalog-page.actions";

describe("fetchCatalogPage", () => {
  beforeEach(() => {
    mocks.listShopifyProductsPage.mockReset();
    mocks.listProducts.mockReset();
  });

  it("passes every catalog parameter to the server source", async () => {
    mocks.listShopifyProductsPage.mockResolvedValue({
      configured: true,
      items: [],
      endCursor: "cursor-2",
      hasNextPage: true,
    });

    await fetchCatalogPage({
      search: "drill",
      categoryId: "tools-hardware",
      first: 24,
      after: "cursor-1",
      sortBy: "price-low",
      minPrice: 20_000,
      maxPrice: 50_000,
      brands: ["Acme", "Zeta"],
      inStockOnly: true,
    });

    expect(mocks.listShopifyProductsPage).toHaveBeenCalledWith({
      data: {
        search: "drill",
        categoryId: "الأدوات-والمعدات",
        first: 24,
        after: "cursor-1",
        sortBy: "price-low",
        minPrice: 20_000,
        maxPrice: 50_000,
        brands: ["Acme", "Zeta"],
        inStockOnly: true,
      },
    });
  });

  it("continues pagination through the Supabase catalog when Shopify is not configured", async () => {
    mocks.listShopifyProductsPage.mockResolvedValue({
      configured: false,
      items: [],
      endCursor: "ignored",
      hasNextPage: true,
    });

    mocks.listProducts.mockResolvedValue([
      {
        id: "product-1",
        slug: "product-1",
        name: "منتج",
        description: "وصف",
        price: 12_000,
        currency: "YER",
        category_id: null,
        brand: null,
        images: ["https://cdn.example.com/product.jpg"],
        model_url: null,
        stock: 2,
        reserved_stock: 0,
        rating: 0,
        reviews_count: 0,
        tags: [],
        is_published: true,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        video_playback_id: null,
      },
    ]);

    const result = await fetchCatalogPage({ first: 24, after: "supabase:24" });

    expect(mocks.listProducts).toHaveBeenCalledWith({
      data: expect.objectContaining({ limit: 25, offset: 24 }),
    });
    expect(result.items).toHaveLength(1);
    expect(result.endCursor).toBe("supabase:25");
    expect(result.hasNextPage).toBe(false);
  });

  it("advances the Supabase cursor by consumed rows when an incomplete product is skipped", async () => {
    mocks.listShopifyProductsPage.mockResolvedValue({
      configured: false,
      items: [],
      endCursor: null,
      hasNextPage: false,
    });

    const product = {
      id: "product-ready",
      slug: "product-ready",
      name: "منتج جاهز",
      description: "وصف",
      price: 12_000,
      currency: "YER",
      category_id: null,
      brand: null,
      images: ["https://cdn.example.com/product.jpg"],
      model_url: null,
      stock: 2,
      reserved_stock: 0,
      rating: 0,
      reviews_count: 0,
      tags: [],
      is_published: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      video_playback_id: null,
    };
    mocks.listProducts.mockResolvedValue([
      { ...product, id: "product-incomplete", slug: "product-incomplete", images: [] },
      product,
      { ...product, id: "product-lookahead", slug: "product-lookahead" },
    ]);

    const result = await fetchCatalogPage({ first: 2, after: "supabase:10" });

    expect(result.items.map((item) => item.id)).toEqual(["product-ready"]);
    expect(result.endCursor).toBe("supabase:12");
    expect(result.hasNextPage).toBe(true);
  });
});
