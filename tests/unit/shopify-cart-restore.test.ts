import { beforeEach, describe, expect, it, vi } from "vitest";

const { getShopifyCart } = vi.hoisted(() => ({ getShopifyCart: vi.fn() }));
vi.mock("@/lib/shopify/catalog.functions", () => ({
  getShopifyCart,
  createShopifyCart: vi.fn(),
  addShopifyCartLines: vi.fn(),
  updateShopifyCartLines: vi.fn(),
  removeShopifyCartLines: vi.fn(),
}));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import { useCart } from "@/lib/cart-store";

const remoteCart = {
  id: "gid://shopify/Cart/live?key=test",
  checkoutUrl: "https://example.test/checkouts/live",
  totalQuantity: 2,
  cost: { subtotalAmount: { amount: "20", currencyCode: "USD" }, totalAmount: { amount: "20", currencyCode: "USD" } },
  lines: { nodes: [{ id: "line-1", quantity: 2, cost: { totalAmount: { amount: "20", currencyCode: "USD" } }, merchandise: { id: "variant-1", availableForSale: true, price: { amount: "10", currencyCode: "USD" }, product: { id: "product-1", handle: "one", title: "منتج", featuredImage: { url: "https://example.test/one.png" } } } }] },
};

describe("Shopify cart restoration", () => {
  beforeEach(() => {
    getShopifyCart.mockReset();
    useCart.setState({ items: [], cartId: "gid://shopify/Cart/stored?key=test", checkoutUrl: "https://old.test", syncError: null, syncing: false });
  });

  it("restores an existing cart", async () => {
    getShopifyCart.mockResolvedValue(remoteCart);
    await useCart.getState().restore();
    expect(useCart.getState()).toMatchObject({ cartId: remoteCart.id, checkoutUrl: remoteCart.checkoutUrl, syncing: false, syncError: null });
    expect(useCart.getState().items).toHaveLength(1);
  });

  it("clears a cart when Shopify returns null", async () => {
    getShopifyCart.mockResolvedValue(null);
    await useCart.getState().restore();
    expect(useCart.getState()).toMatchObject({ items: [], cartId: null, checkoutUrl: null, syncing: false });
  });

  it("keeps the stored cart and exposes a transient API error", async () => {
    getShopifyCart.mockRejectedValue(new Error("Shopify Storefront API failed: 503"));
    await useCart.getState().restore();
    expect(useCart.getState().cartId).toContain("gid://shopify/Cart/");
    expect(useCart.getState().syncError).toBe("Shopify Storefront API failed: 503");
  });

  it("clears an invalid or expired cart id", async () => {
    getShopifyCart.mockRejectedValue(new Error("Invalid cartId: expired gid://shopify/Cart token"));
    await useCart.getState().restore();
    expect(useCart.getState()).toMatchObject({ items: [], cartId: null, checkoutUrl: null, syncing: false, syncError: null });
  });
});
