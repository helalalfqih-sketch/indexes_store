import { describe, expect, it } from "vitest";
import {
  matchesProductFilters,
  sortProducts,
} from "../../src/components/storefront/product-filters";
import type { ProductFilters } from "../../src/components/storefront/product-filters";
import type { Product } from "../../src/components/storefront/types";

const filters: ProductFilters = { priceRange: "all", selectedBrands: [], selectedRatings: [] };
const product = (priceYER: number, extra: Partial<Product> = {}) =>
  ({
    id: String(priceYER),
    name: "Anker charger",
    priceYER,
    rating: 4.5,
    reviewsCount: 2,
    ...extra,
  }) as Product;

describe("shared storefront filters", () => {
  it("preserves inclusive middle boundaries and exclusive outer boundaries", () => {
    const items = [19999, 20000, 50000, 50001].map((price) => product(price));
    for (const [range, expected] of [
      ["under-20k", [19999]],
      ["20k-50k", [20000, 50000]],
      ["over-50k", [50001]],
    ] as const) {
      expect(
        items
          .filter((p) => matchesProductFilters(p, { ...filters, priceRange: range }))
          .map((p) => p.priceYER),
      ).toEqual(expected);
    }
  });
  it("combines custom price, brand and rating while preferring an explicit brand", () => {
    const selected: ProductFilters = {
      priceRange: "custom",
      customMinPrice: 100,
      customMaxPrice: 200,
      selectedBrands: ["anker"],
      selectedRatings: ["4.5"],
    };
    expect(matchesProductFilters(product(150), selected)).toBe(true);
    expect(matchesProductFilters(product(150, { brand: "Samsung" }), selected)).toBe(false);
    expect(matchesProductFilters(product(150, { rating: 4 }), selected)).toBe(false);
    expect(matchesProductFilters(product(201), selected)).toBe(false);
    expect(matchesProductFilters(product(150), { ...selected, customMaxPrice: undefined })).toBe(
      true,
    );
    expect(matchesProductFilters(product(150), { ...selected, selectedBrands: ["unknown"] })).toBe(
      false,
    );
  });
  it("sorts a copy and restores the default input order", () => {
    const items = [product(300), product(100), product(200)];
    expect(sortProducts(items, "price-low").map((p) => p.priceYER)).toEqual([100, 200, 300]);
    expect(sortProducts(items, "price-high").map((p) => p.priceYER)).toEqual([300, 200, 100]);
    expect(sortProducts(items, "default")).toBe(items);
    expect(items.map((p) => p.priceYER)).toEqual([300, 100, 200]);
  });
});
