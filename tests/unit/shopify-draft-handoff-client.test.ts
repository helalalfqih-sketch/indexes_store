import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const payload = {
  idempotencyKey: "11111111-1111-4111-8111-111111111111",
  customerName: "Preview Buyer",
  customerPhone: "771234567",
  customerAddress: "Sana'a",
  paymentProvider: "cod",
  couponCode: "",
  expectedTotal: 9500,
  items: [
    {
      productRef: { source: "shopify" as const, id: "gid://shopify/ProductVariant/123" },
      quantity: 1,
    },
  ],
};
const token = "preview-turnstile-challenge-token-for-test";
const confirmed = {
  orderId: "22222222-2222-4222-8222-222222222222",
  draftOrderId: "gid://shopify/DraftOrder/555",
  draftOrderName: "#D555",
  whatsappReady: true,
  currency: "YER",
  total: 9500,
  itemsCount: 1,
  quote: {
    subtotal: 6500,
    discount: 0,
    shipping: 3000,
    total: 9500,
    currency: "YER",
    couponCode: "",
    freeShippingThreshold: 30000,
    items: [
      {
        id: "gid://shopify/ProductVariant/123",
        name: "Test product",
        quantity: 1,
        unitPrice: 6500,
        stock: 10,
      },
    ],
  },
};

async function loadPreviewClient(enabled: boolean) {
  vi.stubEnv("VITE_SHOPIFY_DRAFT_ORDER_PREVIEW_ENABLED", enabled ? "true" : "false");
  vi.resetModules();
  return import("@/lib/shopify/draft-handoff-client");
}

describe("gated Shopify Draft Order frontend bridge", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(confirmed), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("keeps default/production behavior outside the new endpoint", async () => {
    const client = await loadPreviewClient(false);
    expect(client.SHOPIFY_DRAFT_PREVIEW_ENABLED).toBe(false);
    await expect(client.submitShopifyPreviewDraft(payload, token)).rejects.toThrow(
      "SHOPIFY_DRAFT_PREVIEW_NOT_READY",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not submit a Preview checkout without a challenge token", async () => {
    const client = await loadPreviewClient(true);
    await expect(client.submitShopifyPreviewDraft(payload, "")).rejects.toThrow(
      "SHOPIFY_DRAFT_PREVIEW_NOT_READY",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("requires an explicit verified Shopify draft before WhatsApp", async () => {
    const client = await loadPreviewClient(true);
    const result = await client.submitShopifyPreviewDraft(payload, token);
    expect(result.draftOrderId).toBe(confirmed.draftOrderId);
    expect(result.whatsappReady).toBe(true);
    expect(fetch).toHaveBeenCalledOnce();
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/shopify-orders");
    expect(options?.method).toBe("POST");
    const body = JSON.parse(String(options?.body)) as Record<string, unknown>;
    expect(body.turnstileToken).toBe(token);
    expect(body.idempotencyKey).toBe(payload.idempotencyKey);
    expect(body).not.toHaveProperty("adminToken");
    expect(body).not.toHaveProperty("serviceRoleKey");
  });

  it("never returns success if Shopify did not confirm draft creation", async () => {
    const client = await loadPreviewClient(true);
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ...confirmed, whatsappReady: false })),
    );
    await expect(client.submitShopifyPreviewDraft(payload, token)).rejects.toThrow(
      "SHOPIFY_DRAFT_HANDOFF_NOT_CONFIRMED",
    );
  });

  it("rejects responses missing a Shopify draft ID", async () => {
    const client = await loadPreviewClient(true);
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ...confirmed, draftOrderId: null })),
    );
    await expect(client.submitShopifyPreviewDraft(payload, token)).rejects.toThrow(
      "SHOPIFY_DRAFT_HANDOFF_NOT_CONFIRMED",
    );
  });

  it("rejects a response with inconsistent local and Shopify totals", async () => {
    const client = await loadPreviewClient(true);
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ...confirmed, total: 11500 })),
    );
    await expect(client.submitShopifyPreviewDraft(payload, token)).rejects.toThrow(
      "SHOPIFY_DRAFT_HANDOFF_NOT_CONFIRMED",
    );
  });

  it("rejects failed server requests rather than opening WhatsApp", async () => {
    const client = await loadPreviewClient(true);
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ whatsappReady: false, error: "SHOPIFY_DB_SCHEMA_UNAVAILABLE" }),
        {
          status: 503,
        },
      ),
    );
    await expect(client.submitShopifyPreviewDraft(payload, token)).rejects.toThrow(
      "SHOPIFY_DRAFT_HANDOFF_NOT_CONFIRMED",
    );
  });
});
