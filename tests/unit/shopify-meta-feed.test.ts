import { describe, expect, it, vi } from "vitest";
import { parseCsvText } from "@/lib/catalog/catalog-csv";
import {
  buildShopifyMetaFeed,
  type FeedProduct,
  type FeedVariant,
  type StorefrontQuery,
} from "@/lib/shopify/meta-feed.server";

const end = { hasNextPage: false, endCursor: null };
const variant = (id = "10", amount = "18500.00"): FeedVariant => ({
  id: `gid://shopify/ProductVariant/${id}`,
  title: "Default Title",
  availableForSale: true,
  price: { amount, currencyCode: "YER" },
  image: { url: `https://cdn.shopify.com/${id}.jpg` },
});
const product = (id = "1", variants = [variant()]): FeedProduct => ({
  id: `gid://shopify/Product/${id}`,
  handle: `product-${id}`,
  title: 'منتج "أصلي", جديد',
  description: "سطر أول\nسطر ثانٍ",
  vendor: "اندكس",
  onlineStoreUrl: `https://ubhd8d-iz.myshopify.com/products/product-${id}`,
  featuredImage: null,
  images: { nodes: [] },
  variants: { nodes: variants, pageInfo: end },
});
const page = (products: FeedProduct[]) => ({ products: { nodes: products, pageInfo: end } });
const origin = "https://indexes-store.vercel.app";

describe("Shopify Meta feed", () => {
  it("exports every product and variant page with stable IDs, prices and Arabic text", async () => {
    const first = product();
    first.variants.pageInfo = { hasNextPage: true, endCursor: "variants-next" };
    const later = variant("11", "99.50");
    later.price.currencyCode = "SAR";
    later.availableForSale = false;
    later.title = "كبير";
    const query = vi
      .fn()
      .mockResolvedValueOnce({
        products: { nodes: [first], pageInfo: { hasNextPage: true, endCursor: "products-next" } },
      })
      .mockResolvedValueOnce({ product: { variants: { nodes: [later], pageInfo: end } } })
      .mockResolvedValueOnce(page([product("2", [variant("20", "1000.00")])]));
    const result = await buildShopifyMetaFeed(query as StorefrontQuery, origin);
    const [headers, ...rows] = parseCsvText(result.csv);
    const records = rows.map((row) => Object.fromEntries(headers.map((key, i) => [key, row[i]])));
    expect(result).toMatchObject({ itemCount: 3, skippedVariants: 0 });
    expect(records.map((row) => row.id)).toEqual(["10", "11", "20"]);
    expect(records[0]).toMatchObject({
      title: first.title,
      description: first.description,
      price: "18500.00 YER",
      item_group_id: "1",
    });
    expect(records[1]).toMatchObject({
      price: "99.50 SAR",
      availability: "out of stock",
      image_link: later.image!.url,
    });
    expect(records[2].price).toBe("1000.00 YER");
    expect(query.mock.calls[1][1]).toEqual({ id: first.id, after: "variants-next" });
    expect(query.mock.calls[2][1]).toEqual({ after: "products-next" });
  });

  it("refetches current prices and additions on the next request without changing IDs", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce(page([product()]))
      .mockResolvedValueOnce(
        page([product("1", [variant("10", "19000")]), product("2", [variant("20")])]),
      );
    const before = await buildShopifyMetaFeed(query as StorefrontQuery, origin);
    const after = await buildShopifyMetaFeed(query as StorefrontQuery, origin);
    expect(before.itemCount).toBe(1);
    expect(after.itemCount).toBe(2);
    expect(after.csv).toContain('"10","1"');
    expect(after.csv).toContain('"19000.00 YER"');
    expect(after.csv).not.toContain(
      '"18500.00 YER","https://indexes-store.vercel.app/product/product-1',
    );
  });

  it("reports invalid variants without inventing prices or quantities", async () => {
    const noImage = variant("12");
    noImage.image = { url: "http://invalid.example/image.jpg" };
    const query = vi
      .fn()
      .mockResolvedValue(page([product("1", [variant(), variant("11", "0"), noImage])]));
    const result = await buildShopifyMetaFeed(query as StorefrontQuery, origin);
    expect(result).toMatchObject({ itemCount: 1, skippedVariants: 2 });
    expect(result.csv).not.toContain("quantity_to_sell_on_facebook");
    expect(result.csv).not.toContain("10000");
  });

  it("fails instead of returning a partial feed when the next Shopify page fails", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({
        products: { nodes: [product()], pageInfo: { hasNextPage: true, endCursor: "next" } },
      })
      .mockRejectedValueOnce(new Error("upstream unavailable"));
    await expect(buildShopifyMetaFeed(query as StorefrontQuery, origin)).rejects.toThrow(
      "upstream unavailable",
    );
  });

  it("rejects a broken cursor or duplicate variant instead of silently truncating", async () => {
    const broken = vi.fn().mockResolvedValue({
      products: { nodes: [product()], pageInfo: { hasNextPage: true, endCursor: null } },
    });
    await expect(buildShopifyMetaFeed(broken as StorefrontQuery, origin)).rejects.toThrow(
      "pagination",
    );
    const duplicates = vi.fn().mockResolvedValue(page([product("1", [variant(), variant()])]));
    await expect(buildShopifyMetaFeed(duplicates as StorefrontQuery, origin)).rejects.toThrow(
      "Duplicate",
    );
  });

  it("does not publish an empty successful feed that could clear catalog products", async () => {
    const query = vi.fn().mockResolvedValue(page([]));
    await expect(buildShopifyMetaFeed(query as StorefrontQuery, origin)).rejects.toThrow(
      "No eligible",
    );
  });
});
