import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductDTO } from "@/lib/domain/product";

const mocks = vi.hoisted(() => ({
  listShopifyProducts: vi.fn(),
  diagnoseShopifyCatalog: vi.fn(),
  listProducts: vi.fn(),
}));

vi.mock("@/lib/shopify/catalog.functions", () => ({
  listShopifyProducts: mocks.listShopifyProducts,
  diagnoseShopifyCatalog: mocks.diagnoseShopifyCatalog,
  getShopifyProductBySlug: vi.fn(),
  getShopifyProductsByIds: vi.fn(),
}));

vi.mock("@/lib/catalog.functions", () => ({
  listProducts: mocks.listProducts,
  getProductBySlug: vi.fn(),
  getProductsByIds: vi.fn(),
  inferCategorySlug: vi.fn(),
}));

vi.mock("@/lib/actions/category.actions", () => ({
  normalizeCategorySlug: (slug: string) =>
    slug.trim().toLowerCase().replace(/_/g, "-") === "tools-hardware"
      ? "الأدوات-والمعدات"
      : slug.trim().toLowerCase().replace(/_/g, "-"),
}));

import {
  fetchBestSellers,
  fetchOffers,
  fetchProducts,
  fetchProductsByCategory,
} from "@/lib/actions/product.actions";

const product = (overrides: Partial<ProductDTO> = {}): ProductDTO => ({
  id: "11111111-1111-4111-8111-111111111111",
  slug: "ready-product",
  name: "Ready product",
  description: "Ready product",
  price: 1000,
  currency: "YER",
  category_id: null,
  brand: null,
  images: ["https://example.com/product.jpg"],
  model_url: null,
  stock: 10,
  reserved_stock: 0,
  rating: 0,
  reviews_count: 0,
  tags: [],
  is_published: true,
  created_at: "2026-09-12T00:00:00.000Z",
  updated_at: "2026-09-12T00:00:00.000Z",
  video_playback_id: null,
  ...overrides,
});

const shopifyProduct = (index: number, overrides: Partial<ProductDTO> = {}): ProductDTO =>
  product({
    id: `gid://shopify/Product/${index}`,
    slug: `shopify-product-${index}`,
    shopify_product_id: `gid://shopify/Product/${index}`,
    shopify_variant_id: `gid://shopify/ProductVariant/${index}`,
    ...overrides,
  });

describe("storefront catalog source fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.diagnoseShopifyCatalog.mockResolvedValue({ source: "shopify" });
  });

  it("uses a ready Shopify catalog without querying Supabase", async () => {
    mocks.listShopifyProducts.mockResolvedValue({
      configured: true,
      items: [
        product({
          id: "gid://shopify/Product/1",
          shopify_product_id: "gid://shopify/Product/1",
          shopify_variant_id: "gid://shopify/ProductVariant/2",
        }),
      ],
    });

    const rows = await fetchProducts({ limit: 12 });

    expect(rows).toHaveLength(1);
    expect(mocks.listProducts).not.toHaveBeenCalled();
  });

  it("does not substitute Supabase rows for an empty configured Shopify result", async () => {
    mocks.listShopifyProducts.mockResolvedValue({
      configured: true,
      items: [
        product({
          id: "gid://shopify/Product/1",
          shopify_product_id: "gid://shopify/Product/1",
          shopify_variant_id: null,
        }),
      ],
    });
    mocks.listProducts.mockResolvedValue([product()]);

    const rows = await fetchProducts({ limit: 12 });

    expect(rows).toHaveLength(0);
    expect(mocks.listProducts).not.toHaveBeenCalled();
  });

  it("still hides Supabase rows that fail the checkout readiness gate", async () => {
    mocks.listShopifyProducts.mockResolvedValue({ configured: false, items: [] });
    mocks.listProducts.mockResolvedValue([product({ price: 0 })]);

    await expect(fetchProducts()).resolves.toEqual([]);
  });

  it("bounds an unparameterized catalog read before calling either backend", async () => {
    mocks.listShopifyProducts.mockResolvedValue({ configured: false, items: [] });
    mocks.listProducts.mockResolvedValue([product()]);

    await fetchProducts();

    expect(mocks.listShopifyProducts).toHaveBeenCalledWith({
      data: expect.objectContaining({ limit: 24, offset: 0 }),
    });
    expect(mocks.listProducts).toHaveBeenCalledWith({
      data: expect.objectContaining({ limit: 24, offset: 0 }),
    });
  });

  it("passes normalized category pagination to the backend instead of filtering a full list", async () => {
    mocks.listShopifyProducts.mockResolvedValue({ configured: true, items: [] });

    await fetchProductsByCategory("tools_hardware", { limit: 8, offset: 16 });

    expect(mocks.listShopifyProducts).toHaveBeenCalledOnce();
    expect(mocks.listShopifyProducts).toHaveBeenCalledWith({
      data: expect.objectContaining({
        categoryId: "الأدوات-والمعدات",
        limit: 8,
        offset: 16,
      }),
    });
    expect(mocks.listProducts).not.toHaveBeenCalled();
  });

  it("uses bounded candidate windows for offer and bestseller sections", async () => {
    mocks.listShopifyProducts.mockResolvedValue({ configured: true, items: [] });

    await fetchOffers(4);
    await fetchBestSellers(3);
    await fetchOffers(80);

    expect(mocks.listShopifyProducts).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({ limit: 16, offset: 0 }),
    });
    expect(mocks.listShopifyProducts).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({ limit: 16, offset: 0 }),
    });
    expect(mocks.listShopifyProducts).toHaveBeenNthCalledWith(3, {
      data: expect.objectContaining({ limit: 100, offset: 0 }),
    });
  });

  it("keeps eligible offers and top sellers found after the visible section size", async () => {
    const newestWithoutOffers = [1, 2, 3, 4].map((index) => shopifyProduct(index));
    const laterOffer = shopifyProduct(5, { compare_at_price: 1_500 });
    mocks.listShopifyProducts
      .mockResolvedValueOnce({
        configured: true,
        items: [...newestWithoutOffers, laterOffer],
      })
      .mockResolvedValueOnce({
        configured: true,
        items: [
          shopifyProduct(6, { rating: 1, reviews_count: 1 }),
          shopifyProduct(7, { rating: 2, reviews_count: 1 }),
          shopifyProduct(8, { rating: 3, reviews_count: 1 }),
          shopifyProduct(9, { rating: 5, reviews_count: 100 }),
        ],
      });

    const offers = await fetchOffers(4);
    const bestSellers = await fetchBestSellers(3);

    expect(offers.map((item) => item.slug)).toContain(laterOffer.slug);
    expect(bestSellers).toHaveLength(3);
    expect(bestSellers[0]?.slug).toBe("shopify-product-9");
  });
});
