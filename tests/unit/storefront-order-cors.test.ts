import { describe, expect, it } from "vitest";
import {
  isAllowedStorefrontOrderOrigin,
  storefrontOrderCorsHeaders,
} from "@/lib/storefront-order-cors";

describe("storefront order CORS", () => {
  it("allows the Shopify storefront origin", () => {
    const origin = "https://ubhd8d-iz.myshopify.com";
    expect(isAllowedStorefrontOrderOrigin(origin)).toBe(true);
    expect(storefrontOrderCorsHeaders(origin)).toMatchObject({
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "cache-control": "no-store",
      vary: "Origin",
    });
  });

  it("allows requests without an Origin header", () => {
    expect(isAllowedStorefrontOrderOrigin(null)).toBe(true);
    expect(storefrontOrderCorsHeaders(null)).not.toHaveProperty("access-control-allow-origin");
  });

  it("does not grant CORS to unrelated origins", () => {
    const origin = "https://example.com";
    expect(isAllowedStorefrontOrderOrigin(origin)).toBe(false);
    expect(storefrontOrderCorsHeaders(origin)).not.toHaveProperty("access-control-allow-origin");
  });
});
