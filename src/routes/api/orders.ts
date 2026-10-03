import { createFileRoute } from "@tanstack/react-router";
import { createOrder } from "@/lib/order.functions";
import { formatOrderNumber } from "@/lib/order-status";

function shopifyStorefrontOrigin(): string | null {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return domain ? `https://${domain}` : null;
}

function corsHeaders(request: Request): Headers {
  const origin = request.headers.get("origin");
  const ownOrigin = new URL(request.url).origin;
  const allowed = new Set([ownOrigin]);
  const storefrontOrigin = shopifyStorefrontOrigin();
  if (storefrontOrigin) allowed.add(storefrontOrigin);

  const headers = new Headers({
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Vary": "Origin",
  });

  if (origin && allowed.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  return headers;
}

function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const ownOrigin = new URL(request.url).origin;
  return origin === ownOrigin || origin === shopifyStorefrontOrigin();
}

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        const headers = corsHeaders(request);
        if (!originAllowed(request)) {
          return new Response(null, { status: 403, headers });
        }
        return new Response(null, { status: 204, headers });
      },
      POST: async ({ request }) => {
        const headers = corsHeaders(request);
        if (!originAllowed(request)) {
          return Response.json({ error: "Origin not allowed" }, { status: 403, headers });
        }

        try {
          const body = await request.json();
          const result = await createOrder({ data: body });
          return Response.json(
            {
              ...result,
              orderNumber: formatOrderNumber(result.orderId),
            },
            { status: 200, headers },
          );
        } catch (err: any) {
          console.error("[API_ORDERS_ERROR]", err);
          return Response.json(
            { error: err?.message || "حدث خطأ أثناء معالجة الطلب" },
            { status: err?.status || 400, headers },
          );
        }
      },
    },
  },
});
