import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const chain = { inputValidator: () => chain, handler: (fn: (input: unknown) => unknown) => fn };
    return chain;
  },
}));
import { listShopifyProductsPage, listShopifyProducts } from "@/lib/shopify/catalog.functions";
const network = vi.fn();
const item = {
  id: "gid://shopify/Product/1",
  handle: "charger",
  title: "شاحن",
  description: "",
  vendor: "",
  tags: [],
  createdAt: "2026-09-24",
  updatedAt: "2026-09-24",
  availableForSale: true,
  images: { nodes: [{ url: "https://example.com/charger.jpg" }] },
  variants: {
    nodes: [
      {
        id: "gid://shopify/ProductVariant/1",
        availableForSale: true,
        price: { amount: "3900", currencyCode: "YER" },
      },
    ],
  },
  productType: "",
  collections: { nodes: [{ handle: "electronics" }] },
};
describe("Shopify category boundaries", () => {
  beforeEach(() => {
    vi.stubEnv("CATALOG_SOURCE", "shopify");
    vi.stubEnv("SHOPIFY_STORE_DOMAIN", "store.myshopify.com");
    vi.stubEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN", "test-token");
    vi.stubGlobal("fetch", network);
    network.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  it("queries a real collection connection and preserves pagination", async () => {
    network.mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            collection: {
              products: { nodes: [item], pageInfo: { hasNextPage: true, endCursor: "next" } },
            },
          },
        }),
      ),
    );
    const result = await listShopifyProductsPage({
      data: { categoryId: "electronics", first: 24 },
    });
    const body = JSON.parse(network.mock.calls[0][1].body);
    expect(body.query).toContain("collection(handle: $handle)");
    expect(body.query).not.toContain("collection:");
    expect(body.variables.handle).toBe("electronics");
    expect(result.items.map((p) => p.name)).toEqual(["شاحن"]);
    expect(result.endCursor).toBe("next");
    expect(result.hasNextPage).toBe(true);
  });
  it("does not replace an unknown collection with all products", async () => {
    network.mockResolvedValue(new Response(JSON.stringify({ data: { collection: null } })));
    const result = await listShopifyProducts({ data: { categoryId: "missing", limit: 24 } });
    expect(result).toEqual({ configured: true, items: [] });
  });
  it("keeps general search on the products query", async () => {
    network.mockResolvedValue(
      new Response(
        JSON.stringify({ data: { products: { nodes: [item], pageInfo: { hasNextPage: false } } } }),
      ),
    );
    await listShopifyProductsPage({ data: { search: "شاحن", first: 24 } });
    const body = JSON.parse(network.mock.calls[0][1].body);
    expect(body.query).toContain("query: $query");
    expect(body.variables.query).toBe("شاحن");
  });
});
