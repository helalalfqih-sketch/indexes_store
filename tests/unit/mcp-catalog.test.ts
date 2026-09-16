import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductDTO } from "@/lib/domain/product";
import {
  CatalogUnavailableError,
  createCatalogAdapter,
  PUBLIC_CATALOG_SOURCE,
} from "@/lib/mcp/catalog.server";

const shopify = vi.hoisted(() => ({
  listShopifyProductsPage: vi.fn(),
  getShopifyProductBySlug: vi.fn(),
}));
vi.mock("@/lib/shopify/catalog.functions", () => shopify);

const product: ProductDTO = {
  id: "gid://shopify/Product/123",
  slug: "public-product",
  name: "منتج منشور",
  description: "وصف المنتج الفعلي",
  price: 8500,
  currency: "YER",
  category_id: "cars",
  brand: "Indexes Store",
  images: ["https://cdn.shopify.com/product.jpg"],
  model_url: null,
  stock: 1,
  reserved_stock: 450,
  rating: 0,
  reviews_count: 0,
  tags: ["internal-supplier-reference"],
  is_published: true,
  created_at: "2026-09-15T22:00:00Z",
  updated_at: "2026-09-16T06:00:00Z",
  video_playback_id: null,
  cost_price: 3000,
  source_url: "https://supplier.example/private-reference",
  meta_sync_status: "pending",
  shopify_product_id: "gid://shopify/Product/123",
  shopify_variant_id: "gid://shopify/ProductVariant/456",
  availability: "in stock",
};

function page(items: ProductDTO[] = [product], nextCursor: string | null = null) {
  return {
    configured: true,
    items,
    hasNextPage: nextCursor !== null,
    endCursor: nextCursor,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  shopify.listShopifyProductsPage.mockResolvedValue(page());
  shopify.getShopifyProductBySlug.mockResolvedValue({ configured: true, item: product });
});

afterEach(() => vi.useRealTimers());

describe("public MCP catalog adapter", () => {
  it("projects only approved public fields and retains exact source price/currency", async () => {
    const result = await createCatalogAdapter().search("معطر", 10);
    expect(PUBLIC_CATALOG_SOURCE).toBe("shopify_storefront");
    expect(result).toEqual({
      products: [
        {
          id: "public-product",
          title: "منتج منشور",
          description: "وصف المنتج الفعلي",
          price: 8500,
          currency: "YER",
          available: true,
          url: "https://indexes-store.vercel.app/product/public-product",
          imageUrl: "https://cdn.shopify.com/product.jpg",
          updatedAt: "2026-09-16T06:00:00Z",
        },
      ],
      nextCursor: null,
    });
    const serialized = JSON.stringify(result);
    for (const privateField of [
      "cost_price",
      "reserved_stock",
      "source_url",
      "meta_sync_status",
      "internal-supplier-reference",
      "ProductVariant",
    ]) {
      expect(serialized).not.toContain(privateField);
    }
  });

  it.each([
    { availability: "in stock", stock: 0, expected: true },
    { availability: "out of stock", stock: 10000, expected: false },
    { availability: "unknown", stock: 10000, expected: null },
  ])("uses Storefront availability, not fake quantity: $availability", async (testCase) => {
    shopify.getShopifyProductBySlug.mockResolvedValue({
      configured: true,
      item: { ...product, availability: testCase.availability, stock: testCase.stock },
    });
    const result = await createCatalogAdapter().fetch(product.slug);
    expect(result?.available).toBe(testCase.expected);
    expect(result).not.toHaveProperty("stock");
    expect(result).not.toHaveProperty("quantity");
  });

  it("passes bounded cursor pagination without requesting other tenants or a full catalog", async () => {
    shopify.listShopifyProductsPage.mockResolvedValue(page([product], "next-cursor"));
    const result = await createCatalogAdapter().search("  معطر  ", 25, "current-cursor");
    expect(shopify.listShopifyProductsPage).toHaveBeenCalledExactlyOnceWith({
      data: { search: "معطر", first: 25, after: "current-cursor" },
    });
    expect(result.nextCursor).toBe("next-cursor");
    expect(shopify.getShopifyProductBySlug).not.toHaveBeenCalled();
  });

  it.each([0, 51, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid page size %s before reading upstream",
    async (limit) => {
      await expect(createCatalogAdapter().search("", limit)).rejects.toBeInstanceOf(TypeError);
      expect(shopify.listShopifyProductsPage).not.toHaveBeenCalled();
    },
  );

  it.each(["", " ", "bad\ncursor", "x".repeat(2049)])(
    "rejects invalid cursor before reading upstream",
    async (cursor) => {
      await expect(createCatalogAdapter().search("", 10, cursor)).rejects.toBeInstanceOf(TypeError);
      expect(shopify.listShopifyProductsPage).not.toHaveBeenCalled();
    },
  );

  it.each(["x".repeat(121), "product\nquery"])(
    "rejects unbounded or control-character search input",
    async (query) => {
      await expect(createCatalogAdapter().search(query, 10)).rejects.toBeInstanceOf(TypeError);
      expect(shopify.listShopifyProductsPage).not.toHaveBeenCalled();
    },
  );

  it.each([
    { hasNextPage: true, endCursor: null },
    { hasNextPage: true, endCursor: "same-cursor" },
    { hasNextPage: true, endCursor: "x".repeat(2049) },
    { hasNextPage: true, endCursor: "bad cursor" },
    { hasNextPage: "yes", endCursor: "next" },
    { items: [product, product] },
  ])("fails closed on malformed or looping pagination", async (override) => {
    shopify.listShopifyProductsPage.mockResolvedValue({ ...page(), ...override });
    await expect(createCatalogAdapter().search("", 1, "same-cursor")).rejects.toBeInstanceOf(
      CatalogUnavailableError,
    );
  });

  it("does not fabricate a zero price or substitute cost/compare-at prices", async () => {
    const unpriced = { ...product, price: 0, compare_at_price: 10000, cost_price: 5000 };
    shopify.listShopifyProductsPage.mockResolvedValue(page([unpriced], "next-priced-page"));
    shopify.getShopifyProductBySlug.mockResolvedValue({ configured: true, item: unpriced });
    expect(await createCatalogAdapter().search("", 10)).toEqual({
      products: [],
      nextCursor: "next-priced-page",
    });
    expect(await createCatalogAdapter().fetch(product.slug)).toBeNull();
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, null, undefined, "8500"])(
    "rejects malformed live price %s without a numeric fallback",
    async (price) => {
      shopify.listShopifyProductsPage.mockResolvedValue(
        page([{ ...product, price } as ProductDTO]),
      );
      await expect(createCatalogAdapter().search("", 10)).rejects.toBeInstanceOf(
        CatalogUnavailableError,
      );
    },
  );

  it.each([{ name: "  " }, { currency: "" }, { description: null }, { images: null }])(
    "rejects malformed source metadata",
    async (override) => {
      shopify.getShopifyProductBySlug.mockResolvedValue({
        configured: true,
        item: { ...product, ...override },
      });
      await expect(createCatalogAdapter().fetch(product.slug)).rejects.toBeInstanceOf(
        CatalogUnavailableError,
      );
    },
  );

  it("fetches the exact Arabic slug and builds its URL on the fixed store origin", async () => {
    const slug = "معطر-السيارة";
    shopify.getShopifyProductBySlug.mockResolvedValue({
      configured: true,
      item: { ...product, slug },
    });
    const result = await createCatalogAdapter().fetch(slug);
    expect(shopify.getShopifyProductBySlug).toHaveBeenCalledExactlyOnceWith({ data: { slug } });
    expect(result?.id).toBe(slug);
    expect(result?.url).toBe(
      `https://indexes-store.vercel.app/product/${encodeURIComponent(slug)}`,
    );
  });

  it.each([
    "gid://shopify/Product/123",
    "../admin",
    "https://other.example",
    "x?tenantId=other",
    "",
  ])("rejects non-slug fetch identifiers before any upstream read", async (id) => {
    await expect(createCatalogAdapter().fetch(id)).rejects.toBeInstanceOf(TypeError);
    expect(shopify.getShopifyProductBySlug).not.toHaveBeenCalled();
  });

  it("rejects a different product returned for the requested slug", async () => {
    shopify.getShopifyProductBySlug.mockResolvedValue({
      configured: true,
      item: { ...product, slug: "different-product" },
    });
    await expect(createCatalogAdapter().fetch(product.slug)).rejects.toBeInstanceOf(
      CatalogUnavailableError,
    );
  });

  it("returns null only for an actual missing product or an unpriced product", async () => {
    shopify.getShopifyProductBySlug.mockResolvedValue({ configured: true, item: null });
    expect(await createCatalogAdapter().fetch("not-found")).toBeNull();
  });

  it("fails on unconfigured sources rather than reporting an empty catalog", async () => {
    shopify.listShopifyProductsPage.mockResolvedValue({ ...page([]), configured: false });
    shopify.getShopifyProductBySlug.mockResolvedValue({ configured: false, item: null });
    await expect(createCatalogAdapter().search("", 10)).rejects.toBeInstanceOf(
      CatalogUnavailableError,
    );
    await expect(createCatalogAdapter().fetch(product.slug)).rejects.toBeInstanceOf(
      CatalogUnavailableError,
    );
  });

  it("sanitizes upstream failures and never substitutes empty/demo data", async () => {
    shopify.listShopifyProductsPage.mockRejectedValue(new Error("private upstream configuration"));
    shopify.getShopifyProductBySlug.mockRejectedValue(new Error("private upstream configuration"));
    const message = "The public Shopify catalog is temporarily unavailable.";
    await expect(createCatalogAdapter().search("", 10)).rejects.toThrow(message);
    await expect(createCatalogAdapter().fetch(product.slug)).rejects.toThrow(message);
  });

  it("fails closed on null upstream payloads", async () => {
    shopify.listShopifyProductsPage.mockResolvedValue(null);
    shopify.getShopifyProductBySlug.mockResolvedValue(null);
    await expect(createCatalogAdapter().search("", 10)).rejects.toBeInstanceOf(
      CatalogUnavailableError,
    );
    await expect(createCatalogAdapter().fetch(product.slug)).rejects.toBeInstanceOf(
      CatalogUnavailableError,
    );
  });

  it("omits unsafe image URLs and invalid timestamps without inventing replacements", async () => {
    shopify.getShopifyProductBySlug.mockResolvedValue({
      configured: true,
      item: {
        ...product,
        images: ["javascript:alert(1)", "https://user:password@example.com/image.jpg"],
        updated_at: "not-a-date",
      },
    });
    const result = await createCatalogAdapter().fetch(product.slug);
    expect(result?.imageUrl).toBeNull();
    expect(result?.updatedAt).toBeNull();
  });

  it("bounds a stalled catalog response without treating the timeout as an empty result", async () => {
    vi.useFakeTimers();
    shopify.listShopifyProductsPage.mockImplementation(() => new Promise(() => {}));
    const failure = expect(createCatalogAdapter().search("", 10)).rejects.toBeInstanceOf(
      CatalogUnavailableError,
    );
    await vi.advanceTimersByTimeAsync(10_000);
    await failure;
    expect(vi.getTimerCount()).toBe(0);
  });
});
