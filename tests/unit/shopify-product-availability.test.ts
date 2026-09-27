import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate = (data: unknown) => data;
    const builder = {
      inputValidator: (validator: typeof validate) => {
        validate = validator;
        return builder;
      },
      handler:
        (handler: (args: { data: unknown }) => unknown) =>
        ({ data }: { data: unknown }) =>
          handler({ data: validate(data) }),
    };
    return builder;
  },
}));
vi.mock("@/lib/actions/category.actions", () => ({
  normalizeCategorySlug: (value: string) => value,
}));

import { getShopifyProductBySlug } from "@/lib/shopify/catalog.functions";
import { fetchCatalogPage } from "@/lib/actions/catalog-page.actions";
import { isCatalogProductReady } from "@/lib/catalog-readiness";

const handle = "أبجورة-كريستال-تعمل-باللمس";
const fixture = (availableForSale: boolean) => ({
  id: "gid://shopify/Product/1",
  handle,
  title: "أبجورة كريستال",
  description: "Lamp",
  vendor: "Store",
  tags: [],
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
  availableForSale,
  productType: "lighting",
  collections: { nodes: [] },
  images: { nodes: [{ url: "https://example.com/lamp.jpg" }] },
  variants: {
    nodes: [
      {
        id: "gid://shopify/ProductVariant/2",
        availableForSale,
        price: { amount: "1000", currencyCode: "YER" },
      },
    ],
  },
});
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv("CATALOG_SOURCE", "shopify");
  vi.stubEnv("SHOPIFY_STORE_DOMAIN", "fixture.myshopify.com");
  vi.stubEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN", "fixture-token");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Shopify storefront availability", () => {
  it.each([true, false])(
    "keeps a published product readable when availableForSale=%s",
    async (available) => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ data: { product: fixture(available) } })),
      );
      const result = await getShopifyProductBySlug({ data: { slug: handle } });
      expect(result.item).not.toBeNull();
      expect(isCatalogProductReady(result.item!)).toBe(true);
      expect(result.item!.is_published).toBe(true);
      expect(result.item!.stock).toBe(available ? 1 : 0);
      expect(result.item!.availability).toBe(available ? "in stock" : "out of stock");
      expect(JSON.parse(fetchMock.mock.calls[0][1].body).variables.handle).toBe(handle);
    },
  );

  it("does not invent a product when Storefront returns null", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: { product: null } })));
    expect((await getShopifyProductBySlug({ data: { slug: "missing" } })).item).toBeNull();
  });

  it("uses the detail readiness rules for paginated cards", async () => {
    const valid = fixture(false);
    const nodes = [
      valid,
      { ...fixture(true), images: { nodes: [] } },
      { ...fixture(true), variants: { nodes: [] } },
    ];
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            products: {
              nodes,
              pageInfo: { hasNextPage: false, endCursor: "cursor" },
            },
          },
        }),
      ),
    );
    const page = await fetchCatalogPage();
    expect(page.items).toHaveLength(1);
    expect(page.items[0].slug).toBe(handle);
    expect(page.endCursor).toBe("cursor");
  });
});
