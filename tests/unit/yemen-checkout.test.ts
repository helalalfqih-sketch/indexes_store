import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  resolveShopifyVariantsForYemenCheckout,
  validateYemenCheckoutVariant,
} from "@/lib/shopify/yemen-checkout.server";

const storefrontMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/shopify/catalog.functions", () => ({ storefront: storefrontMock }));

const variant = {
  id: "gid://shopify/ProductVariant/123",
  sku: "SKU-123",
  barcode: null,
  availableForSale: true,
  quantityAvailable: 7,
  price: { amount: "12500", currencyCode: "YER" },
  compareAtPrice: { amount: "15000", currencyCode: "YER" },
  image: { url: "https://cdn.shopify.com/a.jpg", altText: null },
  product: {
    id: "gid://shopify/Product/99",
    handle: "test-product",
    title: "منتج تجريبي",
    description: "وصف المنتج",
    vendor: "Indexes",
    tags: ["yemen"],
    featuredImage: { url: "https://cdn.shopify.com/a.jpg", altText: null },
  },
};

describe("Yemen Shopify catalog checkout", () => {
  it("commits inside Indexes Store before handing the customer to WhatsApp", () => {
    const source = readFileSync("src/components/storefront/UnifiedCartFlow2.tsx", "utf8");
    expect(source).not.toContain("createShopifyCart");
    expect(source).toContain("submitOrder");
    expect(source.indexOf("await submitOrder")).toBeLessThan(
      source.indexOf("window.location.assign(url)"),
    );
    expect(source).toContain("buildCheckoutWhatsAppMessage");
  });

  it("requests sale availability without inventory-protected fields", async () => {
    const captured = new Error("query captured before any database access");
    storefrontMock.mockRejectedValueOnce(captured);
    const from = vi.fn();
    const admin = { from } as unknown as Parameters<
      typeof resolveShopifyVariantsForYemenCheckout
    >[0];

    await expect(
      resolveShopifyVariantsForYemenCheckout(admin, "fixture-tenant", [variant.id]),
    ).rejects.toBe(captured);

    const [query, variables] = storefrontMock.mock.calls[0];
    expect(query).toContain("query CheckoutVariants");
    expect(query).toMatch(/\bavailableForSale\b/);
    expect(query).not.toMatch(/\b(quantityAvailable|storeAvailability)\b/);
    expect(variables).toEqual({ ids: [variant.id] });
    expect(from).not.toHaveBeenCalled();
  });

  it.each([undefined, null])(
    "supports available variants without inventory quantity (%s)",
    (quantityAvailable) => {
      const withoutInventory = { ...variant, quantityAvailable };
      expect(validateYemenCheckoutVariant(withoutInventory, variant.id)).toMatchObject({
        price: 12500,
        currency: "YER",
        stock: 999,
      });
      expect(() =>
        validateYemenCheckoutVariant({ ...withoutInventory, availableForSale: false }, variant.id),
      ).toThrow(/نفد/);
    },
  );
  it("creates an authoritative YER catalog snapshot", () => {
    expect(validateYemenCheckoutVariant(variant, variant.id)).toMatchObject({
      externalId: variant.id,
      slug: "test-product-123",
      price: 12500,
      compareAtPrice: 15000,
      currency: "YER",
      stock: 7,
      images: ["https://cdn.shopify.com/a.jpg"],
    });
  });

  it("rejects unavailable, mismatched, foreign-currency, and invalid-price variants", () => {
    expect(() =>
      validateYemenCheckoutVariant({ ...variant, availableForSale: false }, variant.id),
    ).toThrow(/نفد/);
    expect(() => validateYemenCheckoutVariant(variant, `${variant.id}4`)).toThrow(/متاح/);
    expect(() =>
      validateYemenCheckoutVariant(
        { ...variant, price: { amount: "10", currencyCode: "USD" } },
        variant.id,
      ),
    ).toThrow(/الريال اليمني/);
    expect(() =>
      validateYemenCheckoutVariant(
        { ...variant, price: { amount: "0", currencyCode: "YER" } },
        variant.id,
      ),
    ).toThrow(/غير صالح/);
  });
});
