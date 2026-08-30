import crypto from "node:crypto";

export type ShopifyOrderPayload = Record<string, unknown> & {
  id?: string | number;
  admin_graphql_api_id?: string;
  name?: string;
  order_number?: string | number;
  email?: string;
  contact_email?: string;
  financial_status?: string;
  fulfillment_status?: string;
  currency?: string;
  current_total_price?: string | number;
  total_price?: string | number;
  created_at?: string;
  updated_at?: string;
  customer?: {
    id?: string | number;
    admin_graphql_api_id?: string;
    email?: string;
  };
};

export type ShopifyWebhookDb = {
  recordEvent(input: {
    webhookId: string;
    tenantId: string;
    topic: string;
  }): Promise<"new" | "duplicate">;
  upsertOrder(order: ShopifyOrderPayload, tenantId: string): Promise<void>;
  finishEvent(webhookId: string, error?: string): Promise<void>;
};

export function verifyShopifyWebhook(
  rawBody: string,
  signature: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const receivedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export async function processShopifyOrderWebhook(input: {
  rawBody: string;
  signature: string | null;
  secret?: string;
  topic: string;
  webhookId: string | null;
  tenantId?: string;
  db?: ShopifyWebhookDb;
}): Promise<Response> {
  if (!verifyShopifyWebhook(input.rawBody, input.signature, input.secret)) {
    return Response.json({ error: "Invalid Shopify webhook signature" }, { status: 401 });
  }
  if (!input.webhookId) return Response.json({ error: "Missing webhook id" }, { status: 400 });
  if (!["orders/create", "orders/updated"].includes(input.topic)) {
    return Response.json({ received: true, ignored: true, topic: input.topic }, { status: 202 });
  }
  if (!input.tenantId || !input.db) {
    return Response.json(
      { error: "Shopify webhook persistence is not configured" },
      { status: 503 },
    );
  }
  const status = await input.db.recordEvent({
    webhookId: input.webhookId,
    tenantId: input.tenantId,
    topic: input.topic,
  });
  if (status === "duplicate")
    return Response.json({ received: true, duplicate: true, topic: input.topic }, { status: 200 });
  try {
    await input.db.upsertOrder(JSON.parse(input.rawBody) as ShopifyOrderPayload, input.tenantId);
    await input.db.finishEvent(input.webhookId);
    return Response.json(
      { received: true, topic: input.topic, webhookId: input.webhookId },
      { status: 200 },
    );
  } catch (error) {
    await input.db.finishEvent(
      input.webhookId,
      error instanceof Error ? error.message : "Order projection failed",
    );
    return Response.json({ error: "Order projection failed" }, { status: 503 });
  }
}
