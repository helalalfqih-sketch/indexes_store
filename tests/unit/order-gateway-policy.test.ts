import { describe, expect, it } from "vitest";
import { assertLegacyCheckoutAllowed } from "@/lib/order-gateway-policy";

describe("Shopify Draft Order gateway cannot be bypassed by the legacy public checkout", () => {
  it("preserves the existing checkout while the new feature is disabled", () => {
    expect(() => assertLegacyCheckoutAllowed(undefined)).not.toThrow();
    expect(() => assertLegacyCheckoutAllowed("false")).not.toThrow();
  });

  it("blocks every public legacy checkout once Shopify draft writes are enabled", () => {
    expect(() => assertLegacyCheckoutAllowed("true")).toThrow(
      "SHOPIFY_DRAFT_ORDER_GATEWAY_REQUIRED",
    );
  });

  it("fails open only for explicit non-enabled strings (the gateway uses exact true)", () => {
    expect(() => assertLegacyCheckoutAllowed("")).not.toThrow();
  });
});
