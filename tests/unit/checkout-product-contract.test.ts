import { describe, expect, it } from "vitest";
import {
  assertCheckoutCommit,
  checkoutModeForRefs,
  checkoutProductRefFromCatalogProduct,
  checkoutProductRefSchema,
  requireSupabaseCheckoutProductIds,
  shopifyCartLinesForCheckout,
  validateTenantCheckoutProducts,
} from "@/lib/checkout-product-contract";

const TENANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TENANT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const PRODUCT_ID = "11111111-1111-4111-8111-111111111111";
const ORDER_ID = "22222222-2222-4222-8222-222222222222";

describe("checkout product ID contract", () => {
  it("accepts valid Supabase UUID references", () => {
    const ref = checkoutProductRefFromCatalogProduct({ id: PRODUCT_ID });
    expect(ref).toEqual({ source: "supabase", id: PRODUCT_ID });
    expect(checkoutProductRefSchema.parse(ref)).toEqual(ref);
    expect(requireSupabaseCheckoutProductIds([ref])).toEqual([PRODUCT_ID]);
    expect(() =>
      validateTenantCheckoutProducts(
        TENANT_A,
        [ref],
        [{ id: PRODUCT_ID, tenant_id: TENANT_A, is_published: true }],
      ),
    ).not.toThrow();
  });

  it("tags fallback IDs and rejects them from Supabase order creation", () => {
    const ref = checkoutProductRefFromCatalogProduct({ id: "p1" });
    expect(ref).toEqual({ source: "fallback", id: "p1" });
    expect(checkoutProductRefSchema.parse(ref)).toEqual(ref);
    expect(() => requireSupabaseCheckoutProductIds([ref])).toThrow(/Fallback catalog/);
  });

  it("tags Shopify GIDs and never parses them as Supabase IDs", () => {
    const gid = "gid://shopify/ProductVariant/123456789";
    const ref = checkoutProductRefFromCatalogProduct({
      id: "gid://shopify/Product/987654321",
      shopify_variant_id: gid,
    });
    expect(ref).toEqual({ source: "shopify", id: gid });
    expect(checkoutProductRefSchema.parse(ref)).toEqual(ref);
    expect(() => checkoutProductRefSchema.parse({ source: "supabase", id: gid })).toThrow();
    expect(() => requireSupabaseCheckoutProductIds([ref])).toThrow(/Shopify products/);
  });

  it("routes valid Shopify variants to authoritative Shopify checkout", () => {
    const ref = {
      source: "shopify" as const,
      id: "gid://shopify/ProductVariant/123456789",
    };
    expect(checkoutModeForRefs([ref])).toBe("shopify");
    expect(shopifyCartLinesForCheckout([{ productRef: ref, quantity: 2 }])).toEqual([
      { merchandiseId: ref.id, quantity: 2 },
    ]);
  });

  it("rejects demo fallback and mixed-source carts", () => {
    const supabaseRef = { source: "supabase" as const, id: PRODUCT_ID };
    const fallbackRef = { source: "fallback" as const, id: "p1" };
    const shopifyRef = {
      source: "shopify" as const,
      id: "gid://shopify/ProductVariant/123456789",
    };
    expect(() => checkoutModeForRefs([fallbackRef])).toThrow(/Demo catalog/);
    expect(() => checkoutModeForRefs([supabaseRef, shopifyRef])).toThrow(/different checkout/);
  });

  it("rejects products outside the resolved tenant", () => {
    const ref = { source: "supabase" as const, id: PRODUCT_ID };
    expect(() =>
      validateTenantCheckoutProducts(
        TENANT_A,
        [ref],
        [{ id: PRODUCT_ID, tenant_id: TENANT_B, is_published: true }],
      ),
    ).toThrow(/unavailable/);
  });

  it("rejects missing and unpublished products", () => {
    const ref = { source: "supabase" as const, id: PRODUCT_ID };
    expect(() => validateTenantCheckoutProducts(TENANT_A, [ref], [])).toThrow(/unavailable/);
    expect(() =>
      validateTenantCheckoutProducts(
        TENANT_A,
        [ref],
        [{ id: PRODUCT_ID, tenant_id: TENANT_A, is_published: false }],
      ),
    ).toThrow(/unavailable/);
  });

  it("rejects a partial line-item commit or insertion error", () => {
    expect(() =>
      assertCheckoutCommit(
        { orderId: ORDER_ID, total: 100, currency: "YER", itemsCount: 1 },
        null,
        2,
      ),
    ).toThrow(/every line item/);
    expect(() => assertCheckoutCommit(null, { message: "line item insert failed" }, 2)).toThrow(
      /transaction failed/,
    );
  });

  it("accepts success only when the complete item count commits", () => {
    expect(
      assertCheckoutCommit(
        { orderId: ORDER_ID, total: 100, currency: "YER", itemsCount: 2 },
        null,
        2,
      ),
    ).toMatchObject({ orderId: ORDER_ID, itemsCount: 2 });
  });
});
