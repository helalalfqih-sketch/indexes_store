import type { CreateOrderResult } from "@/lib/order.functions";
import { describe, it, expect } from "vitest";
import { validateDraftTotals, HandoffError } from "@/lib/shopify/whatsapp-draft.server";
const local = {
  orderId: "11111111-1111-4111-8111-111111111111",
  total: 9500,
  currency: "YER",
  itemsCount: 1,
  quote: {
    subtotal: 6500,
    discount: 0,
    shipping: 3000,
    total: 9500,
    currency: "YER",
    couponCode: "",
    freeShippingThreshold: 30000,
    items: [],
  },
} as const;
const draft = {
  id: "gid://shopify/DraftOrder/100",
  name: "#D100",
  totalPriceSet: { presentmentMoney: { amount: "9500.00", currencyCode: "YER" } },
};
describe("Shopify WhatsApp draft handoff safety", () => {
  it("checks the authoritative customer total", () => {
    expect(() => validateDraftTotals(local as unknown as CreateOrderResult, draft)).not.toThrow();
  });
  it("rejects draft price drift before WhatsApp handoff", () => {
    expect(() =>
      validateDraftTotals(local as unknown as CreateOrderResult, {
        ...draft,
        totalPriceSet: { presentmentMoney: { amount: "10000", currencyCode: "YER" } },
      }),
    ).toThrow(HandoffError);
  });
  it("rejects currency drift", () => {
    expect(() =>
      validateDraftTotals(local as unknown as CreateOrderResult, {
        ...draft,
        totalPriceSet: { presentmentMoney: { amount: "9500", currencyCode: "SAR" } },
      }),
    ).toThrow("SHOPIFY_TOTAL_MISMATCH");
  });
});
