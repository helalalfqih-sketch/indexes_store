import { describe, expect, it } from "vitest";
import { productCardQA } from "@/lib/qa/product-card-contract";

describe("product card evidence", () => {
  it("keeps unavailable price, rating and inventory unknown", () => {
    expect(productCardQA({ id: "p1", price: 0, rating: 0, stock: 1 }, "catalog")).toMatchObject({
      productId: "p1",
      price: null,
      rating: null,
      stock: null,
      sectionSource: "catalog",
    });
  });
  it("retains known values and the rendering section", () => {
    expect(
      productCardQA(
        { id: "p2", name: "Watch", priceYER: 25000, rating: 4.8, stockCount: 20 },
        "offers",
      ),
    ).toMatchObject({
      name: "Watch",
      price: 25000,
      rating: 4.8,
      stock: 20,
      sectionSource: "offers",
    });
  });
});
