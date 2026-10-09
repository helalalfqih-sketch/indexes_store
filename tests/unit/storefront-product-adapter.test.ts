import { describe, expect, it } from "vitest";
import { mapProductionProductToDesignProduct } from "@/components/storefront/adapters";
import type { LegacyProductShape } from "@/lib/data-adapter";

const product = (overrides: Partial<LegacyProductShape> = {}): LegacyProductShape => ({
  id: "product-1",
  slug: "product-1",
  name: "منتج",
  description: "وصف",
  price: 12_000,
  stock: 4,
  image: "https://cdn.example.com/product.jpg",
  rating: 0,
  reviews: 0,
  categoryId: "all",
  ...overrides,
});

describe("storefront product adapter", () => {
  it("does not invent a price or availability for an unpriced product", () => {
    const mapped = mapProductionProductToDesignProduct(
      product({ price: 0, oldPrice: 20_000, stock: 10 }),
    );

    expect(mapped.priceYER).toBe(0);
    expect(mapped.originalPriceYER).toBe(0);
    expect(mapped.discountBadge).toBeUndefined();
    expect(mapped.inStock).toBe(false);
  });

  it("uses a real compare price only when it is greater than the current price", () => {
    const mapped = mapProductionProductToDesignProduct(
      product({ price: 12_000, oldPrice: 15_000 }),
    );

    expect(mapped.originalPriceYER).toBe(15_000);
    expect(mapped.discountBadge).toBe("خصم 20%");
  });

  it.each([
    { oldPrice: undefined, badge: "خصم 70%" },
    { oldPrice: 12_000, badge: "خصم 70%" },
    { oldPrice: 10_000, badge: "خصم 70%" },
  ])("does not infer a discount from a label or invalid compare price", (overrides) => {
    const mapped = mapProductionProductToDesignProduct(product(overrides));

    expect(mapped.originalPriceYER).toBe(12_000);
    expect(mapped.discountBadge).toBeUndefined();
  });

  it("does not expose an availability sentinel as an exact stock count", () => {
    const mapped = mapProductionProductToDesignProduct(product({ stock: 1, stockIsExact: false }));

    expect(mapped.inStock).toBe(true);
    expect(mapped.stockCount).toBeUndefined();
  });

  it.each([Number.NaN, -4])("treats invalid stock %s as unavailable", (stock) => {
    const mapped = mapProductionProductToDesignProduct(product({ stock }));

    expect(mapped.inStock).toBe(false);
    expect(mapped.stockCount).toBe(0);
  });
});
