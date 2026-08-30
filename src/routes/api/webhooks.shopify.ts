import { createFileRoute } from "@tanstack/react-router";
import { processShopifyOrderWebhook, type ShopifyWebhookDb } from "@/lib/shopify/webhook.server";

export const Route = createFileRoute("/api/webhooks/shopify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const topic = request.headers.get("x-shopify-topic") || "unknown";
        const webhookId = request.headers.get("x-shopify-webhook-id") || null;
        const tenantId = process.env.SHOPIFY_TENANT_ID;
        let adapter: ShopifyWebhookDb | undefined;
        if (tenantId) {
          const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
          // These tables are introduced by the migration in this PR and are not yet
          // represented in the generated Supabase client types on the base branch.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const db: any = getSupabaseAdmin();
          adapter = {
            async recordEvent({ webhookId: id, tenantId: tenant, topic: eventTopic }) {
              const { error } = await db.from("webhook_events").insert({
                provider: "shopify",
                external_event_id: id,
                tenant_id: tenant,
                status: "processing",
                received_at: new Date().toISOString(),
                metadata: { topic: eventTopic },
              });
              if (error?.code === "23505") return "duplicate";
              if (error) throw new Error("Webhook idempotency store failed");
              return "new";
            },
            async upsertOrder(order, tenant) {
              const { error } = await db.from("shopify_order_events").upsert(
                {
                  shopify_order_id: String(order.admin_graphql_api_id || order.id),
                  tenant_id: tenant,
                  order_name: String(order.name || order.order_number || order.id),
                  customer_shopify_id:
                    order.customer?.admin_graphql_api_id ||
                    (order.customer?.id ? String(order.customer.id) : null),
                  customer_email:
                    order.customer?.email || order.email || order.contact_email || null,
                  financial_status: order.financial_status || null,
                  fulfillment_status: order.fulfillment_status || null,
                  currency_code: String(order.currency || "USD"),
                  total_amount: Number(order.current_total_price || order.total_price || 0),
                  payload: order,
                  shopify_created_at: order.created_at || null,
                  shopify_updated_at: order.updated_at || null,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "shopify_order_id" },
              );
              if (error) throw new Error(error.message);
            },
            async finishEvent(id, error) {
              await db
                .from("webhook_events")
                .update({
                  status: error ? "failed" : "processed",
                  processed_at: error ? null : new Date().toISOString(),
                  last_error: error || null,
                })
                .eq("provider", "shopify")
                .eq("external_event_id", id);
            },
          };
        }
        return processShopifyOrderWebhook({
          rawBody,
          signature: request.headers.get("x-shopify-hmac-sha256"),
          secret: process.env.SHOPIFY_WEBHOOK_SECRET,
          topic,
          webhookId,
          tenantId,
          db: adapter,
        });
      },
    },
  },
});
