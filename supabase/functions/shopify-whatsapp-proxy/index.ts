import { verifyProxySignature } from "./proxy-signature.ts";
import { parseNativeOrder } from "./checkout-payload.ts";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (name: string) => string | undefined };
};

const MAX_BODY = 32 * 1024;

function deny(status: number, code: string): Response {
  return new Response(JSON.stringify({ error: code, whatsappReady: false }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function boundedBody(req: Request): Promise<string | null> {
  if (Number(req.headers.get("content-length") ?? "0") > MAX_BODY) return null;
  const reader = req.body?.getReader();
  if (!reader) return "";
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY) return null;
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

/**
 * Shopify-native staging entrypoint.
 * This first version deliberately has NO customer-order write path.
 * Draft creation is blocked until staging migrations and signed app
 * installation have been independently verified and reviewed.
 */
Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== "POST") return deny(405, "METHOD_NOT_ALLOWED");
  const shop = Deno.env.get("INDEXES_SHOPIFY_DOMAIN") ?? "";
  const secret = Deno.env.get("SHOPIFY_APP_CLIENT_SECRET") ?? "";
  if (!shop || !secret) return deny(503, "APP_PROXY_NOT_CONFIGURED");

  let valid = false;
  try {
    valid = await verifyProxySignature(new URL(request.url), secret, shop);
  } catch {
    return deny(403, "INVALID_APP_PROXY_SIGNATURE");
  }
  if (!valid) return deny(403, "INVALID_APP_PROXY_SIGNATURE");

  try {
    const raw = await boundedBody(request);
    if (raw === null) return deny(413, "REQUEST_TOO_LARGE");
    if (!raw) return deny(422, "INVALID_CHECKOUT");
    let candidate: unknown;
    try {
      candidate = JSON.parse(raw);
    } catch {
      return deny(400, "INVALID_JSON");
    }
    parseNativeOrder(candidate);
  } catch {
    return deny(422, "INVALID_CHECKOUT");
  }

  // Never create a Shopify Draft Order before the authenticated staging
  // backend and durable Supabase idempotency state machine are connected.
  return deny(503, "STAGING_ORDER_BACKEND_NOT_CONFIGURED");
});
