import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createOrder: vi.fn(),
  preflight: vi.fn(),
  persist: vi.fn(),
  challenge: vi.fn(),
}));
vi.mock("@/lib/order.functions", () => ({ createOrder: mocks.createOrder }));
vi.mock("@/lib/shopify/order-challenge.server", () => ({
  verifyShopifyOrderChallenge: mocks.challenge,
}));
vi.mock("@/lib/shopify/whatsapp-draft.server", () => ({
  assertShopifyHandoffReady: mocks.preflight,
  persistShopifyDraftOrder: mocks.persist,
}));

import { handleShopifyOrder } from "@/routes/api/shopify-orders";

const endpoint = "https://preview.example/api/shopify-orders";
const shopOrigin = "https://ubhd8d-iz.myshopify.com";
const input = {
  idempotencyKey: "d358706d-e521-4214-87c0-8b8006246a17",
  items: [{ productRef: { source: "shopify", id: "gid://shopify/ProductVariant/1" }, quantity: 1 }],
  customerName: "Test buyer",
  customerPhone: "771234567",
  customerAddress: "Sana'a",
};
const local = {
  orderId: "7c06feb0-aabe-4ef4-bc84-519e1e9116a0",
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

function post(body: string, origin = shopOrigin): Request {
  return new Request(endpoint, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body,
  });
}

describe("Shopify WhatsApp bridge server boundary", () => {
  beforeEach(() => {
    vi.stubEnv("SHOPIFY_STORE_DOMAIN", "ubhd8d-iz.myshopify.com");
    vi.stubEnv("SHOPIFY_DRAFT_ORDER_WRITES_ENABLED", "true");
    mocks.createOrder.mockReset().mockResolvedValue(local);
    mocks.preflight.mockReset().mockResolvedValue(undefined);
    mocks.challenge.mockReset().mockResolvedValue(undefined);
    mocks.persist.mockReset().mockResolvedValue({
      ...local,
      orderNumber: "ORD-7C06FEB0",
      draftOrderId: "gid://shopify/DraftOrder/100",
      draftOrderName: "#D100",
      whatsappReady: true,
    });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("never writes on preflight (OPTIONS)", async () => {
    const response = await handleShopifyOrder(
      new Request(endpoint, {
        method: "OPTIONS",
        headers: { Origin: shopOrigin },
      }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(shopOrigin);
    expect(mocks.preflight).not.toHaveBeenCalled();
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it("rejects unauthorised origins before reading customer data", async () => {
    const response = await handleShopifyOrder(
      post(JSON.stringify(input), "https://attacker.example"),
    );
    expect(response.status).toBe(403);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it("refuses a request without an Origin header", async () => {
    const response = await handleShopifyOrder(
      new Request(endpoint, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("rejects invalid JSON with a client error and no writes", async () => {
    const response = await handleShopifyOrder(post("{broken"));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "INVALID_JSON",
      whatsappReady: false,
    });
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it("limits request bodies without trusting Content-Length", async () => {
    const body = JSON.stringify({ ...input, padding: "x".repeat(34000) });
    const response = await handleShopifyOrder(post(body));
    expect(response.status).toBe(413);
    expect(mocks.preflight).not.toHaveBeenCalled();
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it("rejects missing request keys before calling the database", async () => {
    const response = await handleShopifyOrder(post("{}"));
    expect(response.status).toBe(422);
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it("does not commit an order when Shopify configuration preflight fails", async () => {
    mocks.preflight.mockRejectedValue(
      Object.assign(new Error("Wrong shop"), {
        code: "SHOPIFY_STORE_IDENTITY_UNVERIFIED",
        status: 503,
      }),
    );
    const response = await handleShopifyOrder(post(JSON.stringify(input)));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: "SHOPIFY_STORE_IDENTITY_UNVERIFIED",
      whatsappReady: false,
    });
    expect(mocks.createOrder).not.toHaveBeenCalled();
    expect(mocks.persist).not.toHaveBeenCalled();
  });

  it("returns Shopify and local identifiers only after both operations succeed", async () => {
    const response = await handleShopifyOrder(post(JSON.stringify(input)));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      orderId: local.orderId,
      orderNumber: "ORD-7C06FEB0",
      draftOrderId: "gid://shopify/DraftOrder/100",
      whatsappReady: true,
    });
    expect(mocks.challenge).toHaveBeenCalledOnce();
    expect(mocks.preflight).toHaveBeenCalledOnce();
    expect(mocks.createOrder).toHaveBeenCalledOnce();
    expect(mocks.persist).toHaveBeenCalledOnce();
  });

  it("never commits an order when the bot challenge is rejected", async () => {
    mocks.challenge.mockRejectedValue(
      Object.assign(new Error("Invalid verification"), {
        code: "CHECKOUT_CHALLENGE_INVALID",
        status: 403,
      }),
    );
    const response = await handleShopifyOrder(post(JSON.stringify(input)));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: "CHECKOUT_CHALLENGE_INVALID",
      whatsappReady: false,
    });
    expect(mocks.createOrder).not.toHaveBeenCalled();
    expect(mocks.preflight).not.toHaveBeenCalled();
  });

  it("does not pass the one-time challenge token into the order database", async () => {
    const body = { ...input, turnstileToken: "valid-fake-token-used-only-in-mock" };
    const response = await handleShopifyOrder(post(JSON.stringify(body)));
    expect(response.status).toBe(200);
    expect(mocks.challenge).toHaveBeenCalledWith(body.turnstileToken, expect.any(Request));
    expect(mocks.createOrder).toHaveBeenCalledWith({ data: input });
    expect(mocks.persist).toHaveBeenCalledWith(input, local);
  });

  it("blocks WhatsApp when Shopify creation fails after the local commit", async () => {
    mocks.persist.mockRejectedValue(
      Object.assign(new Error("uncertain Shopify outcome"), {
        status: 409,
        code: "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED",
      }),
    );
    const response = await handleShopifyOrder(post(JSON.stringify(input)));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED",
      whatsappReady: false,
    });
    expect(mocks.createOrder).toHaveBeenCalledOnce();
  });
});
