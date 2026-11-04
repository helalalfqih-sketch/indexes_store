import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createOrder: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
}));

vi.mock("@/lib/order.functions", () => ({
  createOrder: mocks.createOrder,
}));

import { Route } from "@/routes/api/orders";

type Handler = (args: { request: Request }) => Promise<Response>;
const handlers = (Route as unknown as { server: { handlers: Record<string, Handler> } }).server.handlers;
const base = "https://indexes-store.vercel.app";
const shopifyOrigin = "https://ubhd8d-iz.myshopify.com";

describe("/api/orders storefront CORS", () => {
  beforeEach(() => {
    mocks.createOrder.mockReset();
    vi.stubEnv("SHOPIFY_STORE_DOMAIN", "ubhd8d-iz.myshopify.com");
  });

  it("allows Shopify storefront preflight without creating an order", async () => {
    const response = await handlers.OPTIONS({
      request: new Request(base + "/api/orders", {
        method: "OPTIONS",
        headers: { Origin: shopifyOrigin },
      }),
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(shopifyOrigin);
    expect(response.headers.get("access-control-allow-methods")).toContain("POST");
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it("rejects an untrusted cross-origin storefront request", async () => {
    const response = await handlers.POST({
      request: new Request(base + "/api/orders", {
        method: "POST",
        headers: {
          Origin: "https://example.com",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }),
    });

    expect(response.status).toBe(403);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it("returns a stable public order number after a committed Shopify-origin order", async () => {
    mocks.createOrder.mockResolvedValue({
      orderId: "12345678-1234-1234-1234-123456789abc",
      total: 9500,
      currency: "YER",
      itemsCount: 1,
      quote: {
        items: [],
        subtotal: 9500,
        discount: 0,
        shipping: 0,
        total: 9500,
        currency: "YER",
      },
    });

    const response = await handlers.POST({
      request: new Request(base + "/api/orders", {
        method: "POST",
        headers: {
          Origin: shopifyOrigin,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              productRef: {
                source: "shopify",
                id: "gid://shopify/ProductVariant/1",
              },
              quantity: 1,
            },
          ],
          customerName: "عميل اختبار",
          customerPhone: "771234567",
          customerAddress: "صنعاء",
          idempotencyKey: "12345678-1234-4234-8234-123456789abc",
        }),
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe(shopifyOrigin);
    await expect(response.json()).resolves.toMatchObject({
      orderId: "12345678-1234-1234-1234-123456789abc",
      orderNumber: "ORD-12345678",
      total: 9500,
      currency: "YER",
    });
    expect(mocks.createOrder).toHaveBeenCalledTimes(1);
  });
});
