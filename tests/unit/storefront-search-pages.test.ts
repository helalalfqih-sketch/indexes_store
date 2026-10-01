import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LegacyProductShape } from "@/lib/data-adapter";
const fetchProducts = vi.hoisted(() => vi.fn());
vi.mock("@/lib/actions/product.actions", () => ({ fetchProducts }));
import { searchProductsAdvanced } from "@/lib/search-engine";
const product = (id: string, price = 100): LegacyProductShape => ({
  id,
  slug: id,
  name: "شاحن سيارة",
  description: "",
  price,
  stock: 1,
  image: "https://example.com/image.jpg",
  rating: 0,
  reviews: 0,
  categoryId: "",
});
describe("search pagination and freshness", () => {
  beforeEach(() => vi.resetAllMocks());
  it("finds price matches after the first 100 source results", async () => {
    fetchProducts
      .mockResolvedValueOnce(Array.from({ length: 100 }, (_, i) => product(String(i))))
      .mockResolvedValueOnce([product("last", 900)]);
    expect(
      (await searchProductsAdvanced({ search: "شاحن", minPrice: 800 })).map((p) => p.id),
    ).toEqual(["last"]);
    expect(fetchProducts).toHaveBeenLastCalledWith({
      search: "شاحن",
      categoryId: undefined,
      limit: 100,
      offset: 100,
    });
  });
  it("does not keep removed or repriced products in a permanent module cache", async () => {
    fetchProducts.mockResolvedValueOnce([product("one")]).mockResolvedValueOnce([]);
    expect(await searchProductsAdvanced({ search: "شاحن" })).toHaveLength(1);
    expect(await searchProductsAdvanced({ search: "شاحن" })).toEqual([]);
  });
  it("stops an aborted search before another request", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(searchProductsAdvanced({}, controller.signal)).rejects.toThrow("Search aborted");
    expect(fetchProducts).not.toHaveBeenCalled();
  });
});
