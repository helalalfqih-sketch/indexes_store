import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductDTO } from "@/lib/domain/product";
const mocks = vi.hoisted(() => ({
  page: vi.fn(),
  list: vi.fn(),
  categories: vi.fn(),
  category: vi.fn(),
  shopify: vi.fn(),
  shopifyCategories: vi.fn(),
  diagnose: vi.fn(),
}));
vi.mock("@/lib/shopify/catalog.functions", () => ({
  listShopifyProductsPage: mocks.page,
  listShopifyProducts: mocks.shopify,
  listShopifyCategories: mocks.shopifyCategories,
  diagnoseShopifyCatalog: mocks.diagnose,
  getShopifyProductBySlug: vi.fn(),
  getShopifyProductsByIds: vi.fn(),
}));
vi.mock("@/lib/catalog.functions", () => ({
  listProducts: mocks.list,
  listCategories: mocks.categories,
  getCategoryBySlug: mocks.category,
  getProductBySlug: vi.fn(),
  getProductsByIds: vi.fn(),
}));
import { fetchCatalogPage } from "@/lib/actions/catalog-page.actions";
import { fetchOffers, fetchProducts } from "@/lib/actions/product.actions";
import { fetchCategories, fetchCategoryBySlug } from "@/lib/actions/category.actions";
import { offersQuery, productsQuery } from "@/lib/queries/catalog";
const product = (id: string, extra: Partial<ProductDTO> = {}): ProductDTO => ({
  id,
  slug: id,
  name: "منتج",
  description: "",
  price: 6900,
  currency: "YER",
  category_id: null,
  brand: null,
  images: ["https://example.com/item.jpg"],
  model_url: null,
  stock: 10,
  reserved_stock: 0,
  rating: 0,
  reviews_count: 0,
  tags: [],
  is_published: true,
  created_at: "2026-09-24",
  updated_at: "2026-09-24",
  video_playback_id: null,
  ...extra,
});
const id = "11111111-1111-4111-8111-111111111111";
describe("storefront catalog truth and pagination", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.page.mockResolvedValue({ configured: false, items: [] });
    mocks.shopify.mockResolvedValue({ configured: false, items: [] });
    mocks.shopifyCategories.mockResolvedValue({ configured: false, items: [] });
  });
  it("uses Supabase pages when Shopify is absent and retains cursor source", async () => {
    mocks.list.mockResolvedValue([product(id), product(id), product(id)]);
    const first = await fetchCatalogPage({ first: 2, search: "منتج" });
    expect(first.items).toHaveLength(2);
    expect(first.endCursor).toBe("supabase:2");
    expect(first.hasNextPage).toBe(true);
    mocks.list.mockResolvedValue([product(id)]);
    const second = await fetchCatalogPage({ first: 2, after: first.endCursor });
    expect(mocks.list).toHaveBeenLastCalledWith({
      data: { search: undefined, categoryId: undefined, limit: 3, offset: 2 },
    });
    expect(mocks.page).toHaveBeenCalledOnce();
    expect(second.hasNextPage).toBe(false);
  });
  it("continues past rows failing readiness rather than declaring the catalog ended", async () => {
    mocks.list.mockResolvedValue([product(id, { price: 0 }), product(id), product(id)]);
    const page = await fetchCatalogPage({ first: 2 });
    expect(page.items).toHaveLength(1);
    expect(page.hasNextPage).toBe(true);
  });
  it("rejects forged negative or nonnumeric offset cursors", async () => {
    await expect(fetchCatalogPage({ after: "supabase:-1" })).rejects.toThrow(
      "Invalid catalog cursor",
    );
    await expect(fetchCatalogPage({ after: "supabase:NaN" })).rejects.toThrow(
      "Invalid catalog cursor",
    );
    expect(mocks.list).not.toHaveBeenCalled();
  });
  it("does not invent discounts or products when offers or catalogs are empty", async () => {
    mocks.list.mockResolvedValue([product(id)]);
    expect(await fetchOffers()).toEqual([]);
    mocks.list.mockResolvedValue([]);
    expect(await fetchProducts()).toEqual([]);
    mocks.categories.mockResolvedValue([]);
    expect(await fetchCategories()).toEqual([]);
  });
  it("retains a real price reduction exactly as stored", async () => {
    mocks.list.mockResolvedValue([product(id, { old_price: 7900 })]);
    expect((await fetchOffers())[0]).toMatchObject({ price: 6900, oldPrice: 7900 });
  });
  it("finds real offers after a page containing no discounted products", async () => {
    mocks.page
      .mockResolvedValueOnce({
        configured: true,
        items: [product(id)],
        hasNextPage: true,
        endCursor: "next",
      })
      .mockResolvedValueOnce({
        configured: true,
        items: [product("later", { old_price: 7900 })],
        hasNextPage: false,
        endCursor: null,
      });
    expect(await fetchOffers()).toMatchObject([{ id: "later", price: 6900, oldPrice: 7900 }]);
    expect(mocks.page).toHaveBeenLastCalledWith({
      data: { first: 99, after: "next", search: undefined, categoryId: undefined },
    });
  });
  it("does not report no offers if a subsequent catalog page fails", async () => {
    mocks.page
      .mockResolvedValueOnce({ configured: true, items: [], hasNextPage: true, endCursor: "next" })
      .mockRejectedValueOnce(new Error("offline"));
    await expect(fetchOffers()).rejects.toThrow("offline");
  });
  it("keeps source failures distinct from an empty catalog", async () => {
    mocks.list.mockRejectedValue(new Error("offline"));
    await expect(fetchProducts()).rejects.toThrow("offline");
    await expect(fetchCatalogPage()).rejects.toThrow("offline");
  });
  it("looks up actual Supabase category slugs rather than Shopify aliases", async () => {
    mocks.category.mockResolvedValue(null);
    expect(await fetchCategoryBySlug("electronics")).toBeNull();
    expect(mocks.category).toHaveBeenCalledWith({ data: { slug: "electronics" } });
  });
  it("does not turn loading into an empty success and separates offer limits", () => {
    expect(productsQuery().placeholderData).toBeUndefined();
    expect(offersQuery().placeholderData).toBeUndefined();
    expect(offersQuery(4).queryKey).not.toEqual(offersQuery(20).queryKey);
  });
});
