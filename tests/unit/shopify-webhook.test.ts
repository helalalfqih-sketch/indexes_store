import crypto from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { processShopifyOrderWebhook, verifyShopifyWebhook, type ShopifyWebhookDb } from "@/lib/shopify/webhook.server";

const secret = "unit-test-secret-only";
const rawBody = '{"id":123,"name":"#1001","line_items":[{"quantity":2}]}';
const signature = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");

function mockDb(): ShopifyWebhookDb {
  const seen = new Set<string>();
  return {
    recordEvent: vi.fn(async ({ webhookId }) => seen.has(webhookId) ? "duplicate" : (seen.add(webhookId), "new")),
    upsertOrder: vi.fn(async () => undefined),
    finishEvent: vi.fn(async () => undefined),
  };
}

describe("Shopify webhook security and idempotency", () => {
  it("verifies the signature over the exact raw body", () => {
    expect(verifyShopifyWebhook(rawBody, signature, secret)).toBe(true);
    expect(verifyShopifyWebhook(`${rawBody} `, signature, secret)).toBe(false);
  });

  it.each([["wrong"], [null]])("rejects a wrong or missing signature with 401", async (candidate) => {
    const response = await processShopifyOrderWebhook({ rawBody, signature: candidate, secret, topic: "orders/create", webhookId: "event-1" });
    expect(response.status).toBe(401);
  });

  it("accepts a valid signed raw body with mocked persistence", async () => {
    const db = mockDb();
    const response = await processShopifyOrderWebhook({ rawBody, signature, secret, topic: "orders/create", webhookId: "event-valid", tenantId: "tenant-test", db });
    expect(response.status).toBe(200);
    expect(db.upsertOrder).toHaveBeenCalledWith(JSON.parse(rawBody), "tenant-test");
  });

  it("does not process a duplicate webhook twice", async () => {
    const db = mockDb();
    const request = { rawBody, signature, secret, topic: "orders/updated", webhookId: "event-repeat", tenantId: "tenant-test", db };
    expect((await processShopifyOrderWebhook(request)).status).toBe(200);
    const duplicate = await processShopifyOrderWebhook(request);
    expect(duplicate.status).toBe(200);
    expect(await duplicate.json()).toMatchObject({ duplicate: true });
    expect(db.upsertOrder).toHaveBeenCalledTimes(1);
  });

  it.skip("Integration Pending: requires SHOPIFY_TENANT_ID, SUPABASE_SERVICE_ROLE_KEY, and applied migration", () => {});
});
