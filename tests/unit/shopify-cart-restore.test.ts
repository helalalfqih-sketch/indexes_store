import { beforeEach, describe, expect, it, vi } from "vitest";

const shopifyFns = vi.hoisted(() => ({
  getShopifyCart: vi.fn(),
  createShopifyCart: vi.fn(),
  addShopifyCartLines: vi.fn(),
  updateShopifyCartLines: vi.fn(),
  removeShopifyCartLines: vi.fn(),
}));

vi.mock("@/lib/shopify/catalog.functions", () => shopifyFns);
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import { useCart } from "@/lib/cart-store";

describe("local storefront cart", () => {
  beforeEach(() => {
    Object.values(shopifyFns).forEach((mock) => mock.mockReset());
    useCart.setState({
      items: [],
      cartId: null,
      checkoutUrl: null,
      syncError: null,
      syncing: false,
    });
  });

  it("keeps cart operations local and never creates a Shopify cart", () => {
    useCart.getState().add(
      {
        id: "product-1",
        name: "منتج",
        price: 1000,
        image: "https://example.test/one.png",
        is_published: true,
        status: "active",
      } as never,
      2,
    );

    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().count()).toBe(2);
    expect(useCart.getState().total()).toBe(2000);
    expect(useCart.getState().cartId).toBeNull();
    expect(useCart.getState().checkoutUrl).toBeNull();
    expect(shopifyFns.createShopifyCart).not.toHaveBeenCalled();
    expect(shopifyFns.addShopifyCartLines).not.toHaveBeenCalled();
  });

  it("updates and removes items without remote Shopify calls", () => {
    useCart.setState({
      items: [
        {
          productId: "product-1",
          name: "منتج",
          price: 1000,
          image: "https://example.test/one.png",
          qty: 1,
        },
      ],
    });

    useCart.getState().setQty("product-1", 3);
    expect(useCart.getState().count()).toBe(3);
    expect(shopifyFns.updateShopifyCartLines).not.toHaveBeenCalled();

    useCart.getState().remove("product-1");
    expect(useCart.getState().items).toHaveLength(0);
    expect(shopifyFns.removeShopifyCartLines).not.toHaveBeenCalled();
  });

  it("restore is a no-op and does not contact Shopify", async () => {
    useCart.setState({
      items: [
        {
          productId: "product-1",
          name: "منتج",
          price: 1000,
          image: "https://example.test/one.png",
          qty: 1,
        },
      ],
      cartId: null,
      checkoutUrl: null,
    });

    await useCart.getState().restore();

    expect(useCart.getState().items).toHaveLength(1);
    expect(shopifyFns.getShopifyCart).not.toHaveBeenCalled();
  });
});
