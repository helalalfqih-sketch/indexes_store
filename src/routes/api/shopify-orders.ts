import { createFileRoute } from "@tanstack/react-router";
import { createOrder } from "@/lib/order.functions";

const MAX_BYTES = 32 * 1024;
export function storefrontOrigins(): Set<string> {
  const configured = [
    process.env.SHOPIFY_STORE_DOMAIN,
    process.env.SHOPIFY_STOREFRONT_ORIGIN,
  ].filter((value): value is string => Boolean(value));
  return new Set(
    configured.map((value) => {
      const url = new URL(value.startsWith("https://") ? value : `https://${value}`);
      return url.origin;
    }),
  );
}

export function cors(request: Request): { allowed: boolean; headers: Headers } {
  const origin = request.headers.get("origin");
  const headers = new Headers({
    "Cache-Control": "no-store",
    Vary: "Origin",
    "X-Content-Type-Options": "nosniff",
  });
  const ownOrigin = new URL(request.url).origin;
  const allowed = Boolean(origin && (origin === ownOrigin || storefrontOrigins().has(origin)));
  if (allowed) {
    headers.set("Access-Control-Allow-Origin", origin!);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
  }
  return { allowed, headers };
}

/**
 * Reject oversized requests while streaming: Content-Length cannot be trusted,
 * and reading the whole body before checking its size permits memory abuse.
 */
async function readBoundedBody(request: Request): Promise<string | null> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BYTES) return null;
  if (!request.body) return "";
  const bytes = new Uint8Array(MAX_BYTES);
  const reader = request.body.getReader();
  let used = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (used + value.byteLength > MAX_BYTES) {
        await reader.cancel();
        return null;
      }
      bytes.set(value, used);
      used += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, used));
}

export async function handleShopifyOrder(request: Request): Promise<Response> {
  const { allowed, headers } = cors(request);
  if (!allowed) return Response.json({ error: "ORIGIN_NOT_ALLOWED" }, { status: 403, headers });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST")
    return Response.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405, headers });
  // No local or Shopify writes until explicitly enabled in the matching environment.
  if (process.env.SHOPIFY_DRAFT_ORDER_WRITES_ENABLED !== "true") {
    return Response.json({ error: "SHOPIFY_DRAFT_ORDERS_DISABLED" }, { status: 503, headers });
  }
  const raw = await readBoundedBody(request);
  if (raw === null) {
    return Response.json({ error: "BODY_TOO_LARGE" }, { status: 413, headers });
  }
  try {
    const payload: unknown = JSON.parse(raw);
    if (!payload || typeof payload !== "object" || !("idempotencyKey" in payload)) {
      return Response.json({ error: "INVALID_ORDER" }, { status: 422, headers });
    }
    const { persistShopifyDraftOrder, assertShopifyHandoffReady } =
      await import("@/lib/shopify/whatsapp-draft.server");
    // Verify the target shop before committing anything locally.
    await assertShopifyHandoffReady();
    // This is the existing atomic Supabase checkout authority.
    const local = await createOrder({ data: payload });
    const result = await persistShopifyDraftOrder(
      payload as Parameters<typeof persistShopifyDraftOrder>[0],
      local,
    );
    return Response.json(result, { status: 200, headers });
  } catch (error) {
    const invalidJson = error instanceof SyntaxError || error instanceof TypeError;
    const code = invalidJson
      ? "INVALID_JSON"
      : error instanceof Error && "code" in error
        ? String(error.code)
        : "ORDER_HANDOFF_FAILED";
    const status = invalidJson
      ? 400
      : error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 503;
    console.error("[SHOPIFY_DRAFT_HANDOFF]", code);
    return Response.json({ error: code, whatsappReady: false }, { status, headers });
  }
}

export const Route = createFileRoute("/api/shopify-orders")({
  server: {
    handlers: {
      OPTIONS: ({ request }) => handleShopifyOrder(request),
      POST: ({ request }) => handleShopifyOrder(request),
    },
  },
});
