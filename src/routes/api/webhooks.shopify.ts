import crypto from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";

function verifyShopifyWebhook(rawBody: string, signature: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const receivedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export const Route = createFileRoute("/api/webhooks/shopify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        if (!verifyShopifyWebhook(rawBody, request.headers.get("x-shopify-hmac-sha256"))) {
          return Response.json({ error: "Invalid Shopify webhook signature" }, { status: 401 });
        }

        const topic = request.headers.get("x-shopify-topic") || "unknown";
        const webhookId = request.headers.get("x-shopify-webhook-id") || null;
        // The signature is verified before parsing. Topic handlers are intentionally
        // idempotent/no-op until their persistence contract is defined per topic.
        JSON.parse(rawBody);
        return Response.json({ received: true, topic, webhookId }, { status: 202 });
      },
    },
  },
});
