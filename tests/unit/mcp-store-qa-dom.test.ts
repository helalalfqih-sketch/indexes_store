// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Page } from "playwright-core";
import { readQaState } from "@/lib/mcp/store-qa-state";
const page = { evaluate: async (fn: () => unknown) => fn() } as unknown as Page;
afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});
describe("QA rendered evidence", () => {
  it("keeps explicit keys stable across unrelated DOM insertion and does not expose input values", async () => {
    document.body.innerHTML =
      '<section id="catalog"><button data-element-key="filter-all">All</button><input value="private value" type="password"></section>';
    const before = await readQaState(page);
    document.body.insertAdjacentHTML("afterbegin", "<p>unrelated</p>");
    const after = await readQaState(page);
    expect(after.elements.find((e) => e.tag === "button")?.element_key).toBe(
      before.elements.find((e) => e.tag === "button")?.element_key,
    );
    expect(JSON.stringify(after)).not.toContain("private value");
  });
  it("marks duplicated keys ambiguous instead of selecting the wrong element", async () => {
    document.body.innerHTML =
      '<button data-element-key="same">A</button><button data-element-key="same">B</button>';
    const state = await readQaState(page);
    expect(
      state.elements.every((e) => e.element_key === null && e.key_status === "AMBIGUOUS"),
    ).toBe(true);
  });
  it("reads exact numeric card evidence and leaves absent inventory unknown", async () => {
    document.body.innerHTML =
      '<section id="offers"><article data-testid="product-card-p-1" data-product-id="p-1" data-product-price="19900" data-section-source="offers" data-product-name="Product"></article></section>';
    expect((await readQaState(page)).products[0]).toMatchObject({
      product_id: "p-1",
      section: "offers",
      section_source: "offers",
      price: 19900,
      stock: null,
    });
  });
  it("inspects both card implementations without substituting absent metadata", async () => {
    document.body.innerHTML = `
      <section data-qa-section="catalog"><article data-testid="product-card-1" data-element-key="product.card.1" data-product-id="1" data-product-price="20000" data-section-source="catalog" data-product-brand="Apple"></article></section>
      <section data-qa-section="offers"><div data-testid="product-card-2" data-product-id="2" data-product-price="50001" data-section-source="offers"></div></section>`;
    const { products } = await readQaState(page);
    expect(products).toMatchObject([
      { product_id: "1", price: 20000, brand: "Apple", rating: null, section_source: "catalog" },
      { product_id: "2", price: 50001, brand: null, stock: null, section_source: "offers" },
    ]);
  });
});
