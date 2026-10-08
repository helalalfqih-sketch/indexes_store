declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
};

const MAX_WEBHOOK_REQUEST_BYTES = 1024 * 1024;
const MAX_WEBHOOK_RESPONSE_BYTES = 64 * 1024;
const PROXY_TIMEOUT_MS = 12_000;

class PayloadTooLargeError extends Error {
  readonly scope: "request" | "response";

  constructor(scope: "request" | "response") {
    super(`${scope} payload too large`);
    this.name = "PayloadTooLargeError";
    this.scope = scope;
  }
}

async function readBodyWithLimit(
  body: ReadableStream<Uint8Array> | null,
  declaredLength: string | null,
  maxBytes: number,
  scope: "request" | "response",
): Promise<Uint8Array> {
  if (declaredLength) {
    const bytes = Number(declaredLength);
    if (Number.isFinite(bytes) && bytes > maxBytes) throw new PayloadTooLargeError(scope);
  }
  if (!body) return new Uint8Array();

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new PayloadTooLargeError(scope);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

function canonicalWebhookTarget(requestUrl: URL): URL {
  const configuredSite =
    Deno.env.get("SITE_URL") || Deno.env.get("VERCEL_URL") || "https://indexes-store.com";
  const base = new URL(
    configuredSite.startsWith("http") ? configuredSite : `https://${configuredSite}`,
  );
  if (base.protocol !== "https:" || base.username || base.password) {
    throw new Error("Invalid SITE_URL");
  }

  const target = new URL("/api/webhooks/whatsapp", base);
  target.search = requestUrl.search;
  return target;
}

/**
 * Compatibility gateway for existing webhook registrations.
 *
 * New registrations should point straight to /api/webhooks/whatsapp. Keeping
 * this bounded forwarding path avoids breaking providers that are still using
 * the old Supabase Function URL while preventing unbounded double egress.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    const requestUrl = new URL(req.url);
    const targetUrl = canonicalWebhookTarget(requestUrl);
    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const body = hasBody
      ? await readBodyWithLimit(
          req.body,
          req.headers.get("content-length"),
          MAX_WEBHOOK_REQUEST_BYTES,
          "request",
        )
      : undefined;

    const proxyHeaders = new Headers(req.headers);
    for (const header of [
      "host",
      "content-length",
      "content-encoding",
      "transfer-encoding",
      "connection",
      "accept-encoding",
    ]) {
      proxyHeaders.delete(header);
    }
    proxyHeaders.set("x-forwarded-by", "supabase-edge-function");

    const proxyRes = await fetch(targetUrl, {
      method: req.method,
      headers: proxyHeaders,
      body,
      // Preserve the historical proxy contract if the configured storefront
      // performs a canonical-host redirect.
      redirect: "follow",
      signal: controller.signal,
    });

    const responseBody = await readBodyWithLimit(
      proxyRes.body,
      proxyRes.headers.get("content-length"),
      MAX_WEBHOOK_RESPONSE_BYTES,
      "response",
    );
    const responseHeaders = new Headers(proxyRes.headers);
    for (const header of [
      "content-length",
      "content-encoding",
      "transfer-encoding",
      "connection",
      "set-cookie",
    ]) {
      responseHeaders.delete(header);
    }
    Object.entries(CORS_HEADERS).forEach(([key, value]) => responseHeaders.set(key, value));

    if (proxyRes.status >= 500) {
      console.warn("[Webhook Edge Proxy] canonical_endpoint_error", {
        status: proxyRes.status,
        method: req.method,
      });
    }

    return new Response(responseBody, {
      status: proxyRes.status,
      headers: responseHeaders,
    });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      const status = error.scope === "request" ? 413 : 502;
      return new Response(
        JSON.stringify({
          error: error.scope === "request" ? "Payload too large" : "Invalid upstream response",
        }),
        {
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
          status,
        },
      );
    }

    const timedOut = error instanceof Error && error.name === "AbortError";
    console.error("[Webhook Edge Proxy] forwarding_failed", {
      kind: timedOut ? "timeout" : error instanceof Error ? error.name : "unknown",
    });
    return new Response(JSON.stringify({ error: "Webhook proxy failed" }), {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      status: timedOut ? 504 : 502,
    });
  } finally {
    clearTimeout(timeout);
  }
});
