import { createFileRoute } from "@tanstack/react-router";
import { createOrder } from "@/lib/order.functions";
import {
  isAllowedStorefrontOrderOrigin,
  storefrontOrderCorsHeaders,
} from "@/lib/storefront-order-cors";

const MAX_BODY_BYTES = 32 * 1024;

function jsonWithCors(body: unknown, status: number, origin: string | null) {
  return Response.json(body, {
    status,
    headers: storefrontOrderCorsHeaders(origin),
  });
}

export const Route = createFileRoute("/api/shopify-orders")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (!isAllowedStorefrontOrderOrigin(origin)) {
          return jsonWithCors({ error: "Origin not allowed" }, 403, origin);
        }
        return new Response(null, {
          status: 204,
          headers: storefrontOrderCorsHeaders(origin),
        });
      },

      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (!isAllowedStorefrontOrderOrigin(origin)) {
          return jsonWithCors({ error: "Origin not allowed" }, 403, origin);
        }

        const contentLength = Number(request.headers.get("content-length") || "0");
        if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
          return jsonWithCors({ error: "Request body too large" }, 413, origin);
        }

        try {
          const body = await request.json();
          const result = await createOrder({ data: body });
          return jsonWithCors(result, 200, origin);
        } catch (err: unknown) {
          console.error("[API_SHOPIFY_ORDERS_ERROR]", err);
          const message = err instanceof Error ? err.message : "تعذر معالجة الطلب";
          return jsonWithCors({ error: message }, 400, origin);
        }
      },
    },
  },
});
