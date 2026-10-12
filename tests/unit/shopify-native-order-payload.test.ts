import { describe, expect, it } from "vitest";
import { parseNativeOrder } from "../../supabase/functions/shopify-whatsapp-proxy/checkout-payload";

const base = {
  idempotencyKey: "11111111-1111-4111-8111-111111111111",
  items: [
    { productRef: { source: "shopify", id: "gid://shopify/ProductVariant/12345" }, quantity: 1 },
  ],
  customerName: "Test Buyer",
  customerPhone: "771234567",
  customerAddress: "Sana'a, Yemen",
  notes: "",
  paymentProvider: "cod",
  turnstileToken: "mocked-once-only-challenge-token",
};

describe("Shopify native checkout must not trust browser prices", () => {
  it("normalizes a Yemeni WhatsApp number without changing the cart", () => {
    const parsed = parseNativeOrder(base);
    expect(parsed.customerPhone).toBe("967771234567");
    expect(parsed.paymentProvider).toBe("cod");
    expect(parsed.items[0].productRef.id).toBe("gid://shopify/ProductVariant/12345");
    expect(parsed.couponCode).toBe("");
  });

  it("rejects extra fields including client-provided prices and tenant IDs", () => {
    expect(() => parseNativeOrder({ ...base, discountAmount: 500 })).toThrow("INVALID_CHECKOUT");
    expect(() => parseNativeOrder({ ...base, tenantId: "someone-else" })).toThrow(
      "INVALID_CHECKOUT",
    );
    expect(() => parseNativeOrder({ ...base, total: 1 })).toThrow("INVALID_CHECKOUT");
  });

  it("rejects a non-Shopify product source and invalid variant GIDs", () => {
    expect(() =>
      parseNativeOrder({
        ...base,
        items: [{ productRef: { source: "supabase", id: "111" }, quantity: 1 }],
      }),
    ).toThrow("INVALID_CHECKOUT");
    expect(() =>
      parseNativeOrder({
        ...base,
        items: [{ productRef: { source: "shopify", id: "gid://shopify/Product/111" }, quantity: 1 }],
      }),
    ).toThrow("INVALID_CHECKOUT");
  });

  it("rejects duplicated variants and invalid quantities", () => {
    expect(() => parseNativeOrder({ ...base, items: [base.items[0], base.items[0]] })).toThrow(
      "INVALID_CHECKOUT",
    );
    expect(() =>
      parseNativeOrder({
        ...base,
        items: [{ ...base.items[0], quantity: 0 }],
      }),
    ).toThrow("INVALID_CHECKOUT");
  });

  it("rejects unverified challenge, incorrect phone and alternate payment providers", () => {
    expect(() => parseNativeOrder({ ...base, turnstileToken: "" })).toThrow("INVALID_CHECKOUT");
    expect(() => parseNativeOrder({ ...base, customerPhone: "1234567" })).toThrow(
      "INVALID_CHECKOUT",
    );
    expect(() => parseNativeOrder({ ...base, paymentProvider: "card" })).toThrow(
      "INVALID_CHECKOUT",
    );
  });

  it("does not grant arbitrary or client-calculated coupons", () => {
    expect(() => parseNativeOrder({ ...base, couponCode: "FAKE50" })).toThrow(
      "INVALID_CHECKOUT",
    );
    expect(parseNativeOrder({ ...base, couponCode: "indexes10" }).couponCode).toBe("INDEXES10");
  });
});
