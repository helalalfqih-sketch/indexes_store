import { describe, expect, it } from "vitest";
import {
  duplicateProductPlacement,
  validateGrid,
  type GridProduct,
} from "@/lib/qa/grid-validation";

const row = (
  product_id: string,
  price: number,
  section_source = "catalog",
  brand: string | null = "Apple",
  rating: number | null = 4.8,
): GridProduct => ({ product_id, price, section_source, brand, rating });

describe("rendered grid assertions", () => {
  it("checks all three price boundaries and names offending products", () => {
    const products = [row("a", 19999), row("b", 20000), row("c", 50000), row("d", 50001)];
    expect(validateGrid(products.slice(0, 1), { price: "under-20k" }).status).toBe("PASS");
    expect(validateGrid(products.slice(1, 3), { price: "20k-50k" }).status).toBe("PASS");
    expect(validateGrid(products.slice(3), { price: "over-50k" }).status).toBe("PASS");
    expect(
      validateGrid(products, { price: "under-20k" }).violations.map((p) => p.product_id),
    ).toEqual(["b", "c", "d"]);
  });
  it("checks actual order, brand and rating, blocking unknown metadata or empty results", () => {
    const products = [row("a", 9000), row("b", 5000, "catalog", "Samsung", 4.2)];
    expect(
      validateGrid(products, { sort: "price-low" }).violations.map((p) => p.product_id),
    ).toEqual(["b"]);
    expect(validateGrid(products, { sort: "price-high" }).status).toBe("PASS");
    expect(
      validateGrid(products, { brand: "Apple", rating: 4.5 }).violations.map((p) => p.product_id),
    ).toEqual(["b"]);
    expect(validateGrid([row("a", 5000, "catalog", null)], { brand: "Apple" }).status).toBe(
      "BLOCKED",
    );
    expect(validateGrid([], { sort: "price-low" }).status).toBe("BLOCKED");
  });
  it("distinguishes expected catalog offers from warning placements", () => {
    expect(
      duplicateProductPlacement([row("a", 5000, "offers"), row("a", 5000, "catalog")])[0].severity,
    ).toBe("EXPECTED");
    expect(
      duplicateProductPlacement([row("a", 5000, "hero_products"), row("a", 5000, "catalog")])[0]
        .severity,
    ).toBe("WARNING");
    expect(duplicateProductPlacement([row("a", 5000), row("a", 5000)])).toEqual([]);
  });
});
