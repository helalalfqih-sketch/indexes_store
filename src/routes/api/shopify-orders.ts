import { createFileRoute } from "@tanstack/react-router";
import { createOrder } from "@/lib/order.functions";

const MAX_BYTES = 32 * 1024;
export function storefrontOrigins(): Set<string> {
  const configured = [process.env.SHOPIFY_STORE_DOMAIN, process.env.SHOPIFY_STOREFRONT_ORIGIN]
    .filter((value): value is string => Boolean(value));
  return new Set(configured.map(value => {
    const url = new URL(value.startsWith("https://") ? value : `https://${value}`);
    return url.origin;
  }));
}

export function cors(request: Request): { allowed: boolean; headers: Headers } {
  const origin = request.headers.get("origin");
  const headers = new Headers({ "Cache-Control": "no-store", Vary: "Origin", "X-Content-Type-Options": "nosniff" });
  const ownOrigin = new URL(request.url).origin;
  const allowed = Boolean(origin && (origin === ownOrigin || storefrontOrigins().has(origin)));
  if (allowed) {
    headers.set("Access-Control-Allow-Origin", origin!);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
  }
  return { allowed, headers };
}

export async function handleShopifyOrder(request: Request): Promise<Response> {
  const { allowed, headers } = cors(request);
  if (!allowed) return Response.json({ error: "ORIGIN_NOT_ALLOWED" }, { status: 403, headers });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return Response.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405, headers });
  // No local or Shopify writes until explicitly enabled in the matching environment.
  if (process.env.SHOPIFY_DRAFT_ORDER_WRITES_ENABLED !== "true") {
    return Response.json({ error: "SHOPIFY_DRAFT_ORDERS_DISABLED" }, { status: 503, headers });
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BYTES) {
    return Response.json({ error: "BODY_TOO_LARGE" }, { status: 413, headers });
  }
  try {
    const payload: unknown = JSON.parse(raw);
    if (!payload || typeof payload !== "object" || !("idempotencyKey" in payload)) {
      return Response.json({ error: "INVALID_ORDER" }, { status: 422, headers });
    }
    const { persistShopifyDraftOrder, HandoffError } = await import("@/lib/shopify/whatsapp-draft.server");
    // This is the existing atomic Supabase checkout authority.
    const local = await createOrder({ data: payload });
    const result = await persistShopifyDraftOrder(payload as Parameters<typeof persistShopifyDraftOrder>[0], local);
    return Response.json(result, { status: 200, headers });
  } catch (error) {
    const code = error instanceof Error && error.name === "SyntaxError"
      ? "INVALID_JSON"
      : error instanceof Error && "code" in error ? String(error.code) : "ORDER_HANDOFF_FAILED";
    const status = error instanceof Error && "status" in error && typeof error.status === "number"
      ? error.status : 503;
    console.error("[SHOPIFY_DRAFT_HANDOFF]", code);
    return Response.json({ error: code, whatsappReady: false }, { status, headers });
  }
}

export const Route = createFileRoute("/api/shopify-orders")({
  server: { handlers: {
    OPTIONS: ({ request }) => handleShopifyOrder(request),
    POST: ({ request }) => handleShopifyOrder(request),
  } },
});
