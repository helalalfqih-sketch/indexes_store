import { describe, expect, it, vi } from "vitest";
import {
  INDEXES_ORDER_ACTION,
  verifyOneUseCheckoutChallenge,
} from "../../supabase/functions/shopify-whatsapp-proxy/turnstile";

const shop = "ubhd8d-iz.myshopify.com";
const secret = "unit-test-turnstile-secret-not-real";
const token = "unit-test-turnstile-token-not-real";

function providerResponse(overrides: Record<string, unknown> = {}): Response {
  return new Response(
    JSON.stringify({
      success: true,
      hostname: shop,
      action: INDEXES_ORDER_ACTION,
      ...overrides,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}

describe("native Shopify checkout Turnstile verification", () => {
  it("validates the action and store origin on the server", async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(providerResponse());
    await expect(
      verifyOneUseCheckoutChallenge(token, secret, shop, transport),
    ).resolves.toBeUndefined();
    expect(transport).toHaveBeenCalledOnce();
    const [url, options] = transport.mock.calls[0];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(options?.method).toBe("POST");
    expect(new URLSearchParams(String(options?.body)).get("response")).toBe(token);
    expect(new URLSearchParams(String(options?.body)).get("secret")).toBe(secret);
  });

  it("blocks a missing server secret or malformed challenge", async () => {
    const transport = vi.fn<typeof fetch>();
    await expect(verifyOneUseCheckoutChallenge(token, undefined, shop, transport)).rejects.toThrow(
      "TURNSTILE_NOT_CONFIGURED",
    );
    await expect(verifyOneUseCheckoutChallenge("short", secret, shop, transport)).rejects.toThrow(
      "TURNSTILE_TOKEN_REQUIRED",
    );
    expect(transport).not.toHaveBeenCalled();
  });

  it("rejects a token for another storefront", async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(providerResponse({ hostname: "attacker.example" }));
    await expect(verifyOneUseCheckoutChallenge(token, secret, shop, transport)).rejects.toThrow(
      "TURNSTILE_VERIFICATION_FAILED",
    );
  });

  it("rejects a challenge issued for a different action", async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(providerResponse({ action: "newsletter" }));
    await expect(verifyOneUseCheckoutChallenge(token, secret, shop, transport)).rejects.toThrow(
      "TURNSTILE_VERIFICATION_FAILED",
    );
  });

  it("rejects an invalid or already consumed token", async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(providerResponse({ success: false }));
    await expect(verifyOneUseCheckoutChallenge(token, secret, shop, transport)).rejects.toThrow(
      "TURNSTILE_VERIFICATION_FAILED",
    );
  });

  it("fails closed on verification network or provider errors", async () => {
    const failedRequest = vi.fn<typeof fetch>().mockRejectedValue(new Error("offline"));
    await expect(verifyOneUseCheckoutChallenge(token, secret, shop, failedRequest)).rejects.toThrow(
      "TURNSTILE_VERIFICATION_UNAVAILABLE",
    );
    const badResponse = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("Unavailable", { status: 503 }));
    await expect(verifyOneUseCheckoutChallenge(token, secret, shop, badResponse)).rejects.toThrow(
      "TURNSTILE_VERIFICATION_UNAVAILABLE",
    );
  });
});
