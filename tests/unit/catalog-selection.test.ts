import { describe, expect, it } from "vitest";
import { isCurrentOffer, uniqueProducts } from "../../src/components/storefront/catalog-selection";
import { sortProducts } from "../../src/components/storefront/product-filters";
import type { Product } from "../../src/components/storefront/types";
const item = (id: string, fields: Partial<Product> = {}) =>
  ({ id, priceYER: 100, originalPriceYER: 100, ...fields }) as Product;
describe("catalog presentation", () => {
  it("keeps one card across overlapping pages while retaining later products", () => {
    expect(uniqueProducts([item("a"), item("b"), item("a"), item("c")]).map((p) => p.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
  it("rejects promotional badges without a real discount, future and expired offers", () => {
    const now = Date.parse("2026-09-22");
    expect(isCurrentOffer(item("a", { discountBadge: "-35%", isBestOffer: true }), now)).toBe(
      false,
    );
    expect(isCurrentOffer(item("b", { originalPriceYER: 150 }), now)).toBe(true);
    expect(isCurrentOffer(item("b", { originalPriceYER: 150, dealEnd: "2026-09-21" }), now)).toBe(
      false,
    );
    expect(isCurrentOffer(item("b", { originalPriceYER: 150, dealStart: "2026-09-23" }), now)).toBe(
      false,
    );
  });
  it("orders new arrivals by creation date instead of featured flags", () => {
    expect(
      sortProducts(
        [
          item("old", { createdAt: "2026-01-01", isNewArrival: true }),
          item("new", { createdAt: "2026-09-22" }),
        ],
        "newest",
      ).map((p) => p.id),
    ).toEqual(["new", "old"]);
  });
});
