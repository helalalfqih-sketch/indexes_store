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

vi.mock("@/lib/actions/category.actions", () => ({ fetchCategories: vi.fn() }));

import { fetchProducts } from "@/lib/actions/product.actions";

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

  it("falls back to ready Supabase rows when configured Shopify rows are not purchasable", async () => {
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

    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("11111111-1111-4111-8111-111111111111");
    expect(mocks.listProducts).toHaveBeenCalledOnce();
  });

  it("still hides Supabase rows that fail the checkout readiness gate", async () => {
    mocks.listShopifyProducts.mockResolvedValue({ configured: true, items: [] });
    mocks.listProducts.mockResolvedValue([product({ price: 0 })]);

    await expect(fetchProducts()).resolves.toEqual([]);
  });
});
