import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyShopifyOrderChallenge } from "@/lib/shopify/order-challenge.server";

const request = new Request("https://preview.example/api/shopify-orders", {
  method: "POST",
  headers: { Origin: "https://ubhd8d-iz.myshopify.com" },
});
const token = "not-a-real-turnstile-token-123456789";
const success = {
  success: true,
  hostname: "ubhd8d-iz.myshopify.com",
  action: "indexes_whatsapp_order",
};

describe("Shopify public checkout challenge", () => {
  beforeEach(() => {
    vi.stubEnv("SHOPIFY_STORE_DOMAIN", "ubhd8d-iz.myshopify.com");
    vi.stubEnv("SHOPIFY_ORDER_TURNSTILE_SECRET", "non-production-unit-test-only");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(success), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("verifies a server-side one-use token with expected host and action", async () => {
    await expect(verifyShopifyOrderChallenge(token, request)).resolves.toBeUndefined();
    const verifyFetch = vi.mocked(fetch);
    expect(verifyFetch).toHaveBeenCalledOnce();
    const args = verifyFetch.mock.calls[0];
    expect(args[0]).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(String(args[1]?.body)).toContain("response=");
    expect(String(args[1]?.body)).not.toContain("Bearer ");
  });

  it("fails closed if the server secret has not been installed", async () => {
    vi.stubEnv("SHOPIFY_ORDER_TURNSTILE_SECRET", "");
    await expect(verifyShopifyOrderChallenge(token, request)).rejects.toThrow(
      "CHECKOUT_CHALLENGE_NOT_CONFIGURED",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects missing and malformed challenge tokens before any network call", async () => {
    await expect(verifyShopifyOrderChallenge(undefined, request)).rejects.toThrow(
      "CHECKOUT_CHALLENGE_REQUIRED",
    );
    await expect(verifyShopifyOrderChallenge("short", request)).rejects.toThrow(
      "CHECKOUT_CHALLENGE_REQUIRED",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a token issued to an unrelated website", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ...success, hostname: "evil.example" })),
    );
    await expect(verifyShopifyOrderChallenge(token, request)).rejects.toThrow(
      "CHECKOUT_CHALLENGE_INVALID",
    );
  });

  it("rejects a valid token issued for a different action", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ...success, action: "signup" })),
    );
    await expect(verifyShopifyOrderChallenge(token, request)).rejects.toThrow(
      "CHECKOUT_CHALLENGE_INVALID",
    );
  });

  it("rejects a token rejected by Cloudflare", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ...success, success: false })),
    );
    await expect(verifyShopifyOrderChallenge(token, request)).rejects.toThrow(
      "CHECKOUT_CHALLENGE_INVALID",
    );
  });

  it("does not treat provider outages as valid verification", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("temporary network outage"));
    await expect(verifyShopifyOrderChallenge(token, request)).rejects.toThrow(
      "CHECKOUT_CHALLENGE_UNAVAILABLE",
    );
  });

  it("never approves a token when the request origin is absent", async () => {
    const withoutOrigin = new Request(request.url, { method: "POST" });
    await expect(verifyShopifyOrderChallenge(token, withoutOrigin)).rejects.toThrow(
      "CHECKOUT_CHALLENGE_INVALID",
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
