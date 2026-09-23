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
      '<section id="offers"><article data-storefront-product-id="p-1" data-price-yer="19900" data-product-name="Product"></article></section>';
    expect((await readQaState(page)).products[0]).toMatchObject({
      product_id: "p-1",
      section: "offers",
      price: 19900,
      stock: null,
    });
  });
});
