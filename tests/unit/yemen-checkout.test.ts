import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { validateYemenCheckoutVariant } from "@/lib/shopify/yemen-checkout.server";

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
    for (const file of ["UnifiedCartFlow.tsx", "UnifiedCartFlow2.tsx"]) {
      const source = readFileSync(`src/components/storefront/${file}`, "utf8");
      expect(source).not.toContain("createShopifyCart");
      expect(source).toContain("submitOrder");
      expect(source.indexOf("await submitOrder")).toBeLessThan(
        source.indexOf("window.location.assign(url)"),
      );
      expect(source).toContain("buildCheckoutWhatsAppMessage");
    }
  });

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
