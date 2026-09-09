import { describe, expect, it } from "vitest";
import { isCatalogProductReady, shouldUseDemoCatalog } from "@/lib/catalog-readiness";
import type { ProductDTO } from "@/lib/domain/product";

const readyProduct: ProductDTO = {
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
  created_at: "2026-09-08T00:00:00.000Z",
  updated_at: "2026-09-08T00:00:00.000Z",
  video_playback_id: null,
};

describe("storefront catalog readiness", () => {
  it("accepts a published product with a real sale price and image", () => {
    expect(isCatalogProductReady(readyProduct)).toBe(true);
  });

  it("never substitutes compare-at, old, or cost price for a missing sale price", () => {
    expect(
      isCatalogProductReady({
        ...readyProduct,
        price: 0,
        compare_at_price: 1500,
        old_price: 1400,
        cost_price: 700,
      }),
    ).toBe(false);
  });

  it("rejects unpublished products and products without a public image", () => {
    expect(isCatalogProductReady({ ...readyProduct, is_published: false })).toBe(false);
    expect(isCatalogProductReady({ ...readyProduct, images: [] })).toBe(false);
    expect(isCatalogProductReady({ ...readyProduct, images: ["data:image/svg+xml,test"] })).toBe(
      false,
    );
  });

  it("requires an actionable Shopify variant identity", () => {
    expect(
      isCatalogProductReady({
        ...readyProduct,
        id: "gid://shopify/Product/123",
        shopify_product_id: "gid://shopify/Product/123",
        shopify_variant_id: null,
      }),
    ).toBe(false);
    expect(
      isCatalogProductReady({
        ...readyProduct,
        id: "gid://shopify/Product/123",
        shopify_product_id: "gid://shopify/Product/123",
        shopify_variant_id: "gid://shopify/ProductVariant/456",
      }),
    ).toBe(true);
  });

  it("allows demo catalog data only during development", () => {
    expect(shouldUseDemoCatalog(true)).toBe(true);
    expect(shouldUseDemoCatalog(false)).toBe(false);
  });
});
