import { afterEach, describe, expect, it, vi } from "vitest";
import { cors, handleShopifyOrder } from "@/routes/api/shopify-orders";
describe("Shopify orders CORS and disabled preview", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("accepts only the configured Shopify storefront", () => {
    vi.stubEnv("SHOPIFY_STORE_DOMAIN", "ubhd8d-iz.myshopify.com");
    expect(cors(new Request("https://preview.example/api/shopify-orders",
      { headers: { origin: "https://ubhd8d-iz.myshopify.com" } })).allowed).toBe(true);
    expect(cors(new Request("https://preview.example/api/shopify-orders",
      { headers: { origin: "https://malicious.example" } })).allowed).toBe(false);
    expect(cors(new Request("https://preview.example/api/shopify-orders")).allowed).toBe(false);
  });
  it("refuses orders without explicit Shopify write activation", async () => {
    vi.stubEnv("SHOPIFY_STORE_DOMAIN", "ubhd8d-iz.myshopify.com");
    vi.stubEnv("SHOPIFY_DRAFT_ORDER_WRITES_ENABLED", "false");
    const response = await handleShopifyOrder(new Request("https://preview.example/api/shopify-orders", {
      method: "POST", headers: { origin: "https://ubhd8d-iz.myshopify.com" }, body: "{}",
    }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: "SHOPIFY_DRAFT_ORDERS_DISABLED" });
  });
});
