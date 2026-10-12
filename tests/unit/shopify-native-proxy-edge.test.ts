import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canonicalProxyParams } from "../../supabase/functions/shopify-whatsapp-proxy/proxy-signature";

const runtime = vi.hoisted(() => ({ runNativeOrder: vi.fn() }));
vi.mock("../../supabase/functions/shopify-whatsapp-proxy/runtime.ts", () => runtime);

type Handler = (request: Request) => Promise<Response>;
const secret = "preview-only-integration-test-secret";
const shop = "ubhd8d-iz.myshopify.com";

const checkout = {
  idempotencyKey: "11111111-1111-4111-8111-111111111111",
  items: [
    { productRef: { source: "shopify", id: "gid://shopify/ProductVariant/123" }, quantity: 1 },
  ],
  customerName: "Test Customer",
  customerPhone: "771234567",
  customerAddress: "Sana'a",
  paymentProvider: "cod",
  turnstileToken: "mock-turnstile-token-only-not-for-production",
};

async function signedUrl() {
  const url = new URL("https://staging.example/functions/v1/shopify-whatsapp-proxy");
  url.searchParams.set("shop", shop);
  url.searchParams.set("timestamp", String(Math.floor(Date.now() / 1000)));
  url.searchParams.set("path_prefix", "/apps/indexes-orders");
  url.searchParams.set("logged_in_customer_id", "");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(canonicalProxyParams(url.searchParams)),
    ),
  );
  url.searchParams.set(
    "signature",
    Array.from(signature, (byte) => byte.toString(16).padStart(2, "0")).join(""),
  );
  return url;
}

async function edgeHandler(
  configured = true,
  turnstileConfigured = true,
  enabled = false,
): Promise<Handler> {
  let handler: Handler | undefined;
  vi.stubGlobal("Deno", {
    serve: (value: Handler) => {
      handler = value;
    },
    env: {
      get: (name: string) => {
        if (!configured) return undefined;
        if (name === "INDEXES_SHOPIFY_DOMAIN") return shop;
        if (name === "SHOPIFY_APP_CLIENT_SECRET") return secret;
        if (name === "SHOPIFY_ORDER_TURNSTILE_SECRET" && turnstileConfigured) {
          return "mock-staging-only-turnstile-secret";
        }
        const staging: Record<string, string> = {
          INDEXES_NATIVE_ORDER_WRITES_ENABLED: "true",
          INDEXES_ORDER_ENVIRONMENT: "staging",
          INDEXES_STAGING_TENANT_ID: "22222222-2222-4222-8222-222222222222",
          SUPABASE_URL: "https://stagingfixture.supabase.co",
          INDEXES_EXPECTED_STAGING_URL: "https://stagingfixture.supabase.co",
          SUPABASE_SERVICE_ROLE_KEY: "fixture-key",
          SHOPIFY_ADMIN_ACCESS_TOKEN: "fixture-token",
        };
        return enabled ? staging[name] : undefined;
      },
    },
  });
  vi.resetModules();
  await import("../../supabase/functions/shopify-whatsapp-proxy/index");
  if (!handler) throw new Error("Edge Function handler not registered");
  return handler;
}

function post(url: URL, value: unknown): Request {
  return new Request(url.href, {
    method: "POST",
    body: JSON.stringify(value),
  });
}

describe("native Shopify proxy Edge entrypoint is safe by default", () => {
  beforeEach(() => {
    runtime.runNativeOrder.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            hostname: shop,
            action: "indexes_whatsapp_order",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("requires server configuration and an authenticated signed proxy", async () => {
    const handler = await edgeHandler(false);
    const response = await handler(post(await signedUrl(), checkout));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      whatsappReady: false,
      error: "APP_PROXY_NOT_CONFIGURED",
    });
  });

  it("never accepts a tampered Shopify proxy URL", async () => {
    const handler = await edgeHandler();
    const url = await signedUrl();
    url.searchParams.set("shop", "attacker.myshopify.com");
    const response = await handler(post(url, checkout));
    expect(response.status).toBe(403);
    expect(runtime.runNativeOrder).not.toHaveBeenCalled();
  });

  it("validates the checkout but remains closed until staging backend is linked", async () => {
    const handler = await edgeHandler();
    const response = await handler(post(await signedUrl(), checkout));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      whatsappReady: false,
      error: "STAGING_ORDER_BACKEND_NOT_CONFIGURED",
    });
    expect(runtime.runNativeOrder).not.toHaveBeenCalled();
  });

  it("rejects tampered checkout amounts before returning its disabled state", async () => {
    const handler = await edgeHandler();
    const response = await handler(post(await signedUrl(), { ...checkout, price: 1 }));
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ whatsappReady: false });
  });

  it("rejects an invalid one-use Turnstile response", async () => {
    const handler = await edgeHandler();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          hostname: shop,
          action: "indexes_whatsapp_order",
        }),
      ),
    );
    const response = await handler(post(await signedUrl(), checkout));
    expect(response.status).toBe(403);
    expect(runtime.runNativeOrder).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({
      whatsappReady: false,
      error: "TURNSTILE_VERIFICATION_FAILED",
    });
  });

  it("rejects a missing Turnstile secret even with a valid Shopify signature", async () => {
    const handler = await edgeHandler(true, false);
    const response = await handler(post(await signedUrl(), checkout));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      whatsappReady: false,
      error: "TURNSTILE_NOT_CONFIGURED",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed checkout JSON and never calls Turnstile", async () => {
    const handler = await edgeHandler();
    const response = await handler(
      new Request((await signedUrl()).href, { method: "POST", body: "{" }),
    );
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects unsupported request methods and does not redirect to WhatsApp", async () => {
    const handler = await edgeHandler();
    const response = await handler(new Request((await signedUrl()).href));
    expect(response.status).toBe(405);
    expect(response.headers.get("location")).toBeNull();
  });
  it("only hands off after signed request and challenge verification in configured staging", async () => {
    runtime.runNativeOrder.mockResolvedValueOnce({
      orderId: checkout.idempotencyKey,
      whatsappReady: true,
    });
    const handler = await edgeHandler(true, true, true);
    const response = await handler(post(await signedUrl(), checkout));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ whatsappReady: true });
    expect(runtime.runNativeOrder).toHaveBeenCalledOnce();
    expect(runtime.runNativeOrder.mock.calls[0][0].customerPhone).toBe("967771234567");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("does not expose credentials or customer data from an unexpected backend failure", async () => {
    runtime.runNativeOrder.mockRejectedValueOnce(new Error("private secret and customer phone"));
    const handler = await edgeHandler(true, true, true);
    const response = await handler(post(await signedUrl(), checkout));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "CHECKOUT_UNAVAILABLE", whatsappReady: false });
  });
});
