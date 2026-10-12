import { describe, expect, it } from "vitest";
import { assertShopifyDraftMatches } from "@/lib/shopify/whatsapp-draft.server";
import type { CreateOrderResult } from "@/lib/order.functions";

const orderId = "11111111-1111-4111-8111-111111111111";
const variantId = "gid://shopify/ProductVariant/123";
const local: CreateOrderResult = {
  orderId,
  total: 9500,
  currency: "YER",
  itemsCount: 1,
  quote: {
    items: [],
    subtotal: 6500,
    discount: 0,
    shipping: 3000,
    total: 9500,
    currency: "YER",
    couponCode: "",
    freeShippingThreshold: 30000,
  },
};
const expected = [{ variantId, quantity: 1, unitPrice: 6500 }];

function validDraft() {
  return {
    id: "gid://shopify/DraftOrder/321",
    name: "#D321",
    status: "OPEN",
    tags: ["indexes-whatsapp-cod", `indexes-local-${orderId}`],
    customAttributes: [{ key: "indexes_local_order_id", value: orderId }],
    totalPriceSet: { presentmentMoney: { amount: "9500.00", currencyCode: "YER" } },
    lineItems: {
      nodes: [
        {
          quantity: 1,
          variant: { id: variantId },
          originalUnitPriceSet: {
            presentmentMoney: { amount: "6500.00", currencyCode: "YER" },
          },
        },
      ],
      pageInfo: { hasNextPage: false },
    },
  };
}

describe("saved Shopify draft can be reused only if still unchanged", () => {
  it("accepts the exact original draft and local order", () => {
    expect(() => assertShopifyDraftMatches(local, validDraft(), expected)).not.toThrow();
  });

  it("rejects a completed draft", () => {
    expect(() =>
      assertShopifyDraftMatches(local, { ...validDraft(), status: "COMPLETED" }, expected),
    ).toThrow("SHOPIFY_DRAFT_RECONCILIATION_REQUIRED");
  });

  it("rejects a draft linked to a different local order", () => {
    const draft = validDraft();
    draft.customAttributes[0].value = "22222222-2222-4222-8222-222222222222";
    expect(() => assertShopifyDraftMatches(local, draft, expected)).toThrow(
      "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED",
    );
  });

  it("rejects a draft missing its matching order tag", () => {
    expect(() => assertShopifyDraftMatches(local, { ...validDraft(), tags: [] }, expected)).toThrow(
      "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED",
    );
  });

  it("rejects a draft whose products were replaced", () => {
    const draft = validDraft();
    draft.lineItems.nodes[0].variant.id = "gid://shopify/ProductVariant/999";
    expect(() => assertShopifyDraftMatches(local, draft, expected)).toThrow(
      "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED",
    );
  });

  it("rejects changed quantities even if the total is unchanged", () => {
    const draft = validDraft();
    draft.lineItems.nodes[0].quantity = 2;
    expect(() => assertShopifyDraftMatches(local, draft, expected)).toThrow(
      "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED",
    );
  });

  it("rejects a modified item unit price", () => {
    const draft = validDraft();
    draft.lineItems.nodes[0].originalUnitPriceSet.presentmentMoney.amount = "7000";
    expect(() => assertShopifyDraftMatches(local, draft, expected)).toThrow(
      "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED",
    );
  });

  it("rejects incomplete pagination and therefore unverified extra items", () => {
    const draft = validDraft();
    draft.lineItems.pageInfo.hasNextPage = true;
    expect(() => assertShopifyDraftMatches(local, draft, expected)).toThrow(
      "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED",
    );
  });

  it("rejects a changed Shopify total or currency", () => {
    const draft = validDraft();
    draft.totalPriceSet.presentmentMoney.amount = "10000";
    expect(() => assertShopifyDraftMatches(local, draft, expected)).toThrow(
      "SHOPIFY_TOTAL_MISMATCH",
    );
  });

  it("rejects an absent Shopify draft", () => {
    expect(() => assertShopifyDraftMatches(local, null, expected)).toThrow(
      "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED",
    );
  });
});
