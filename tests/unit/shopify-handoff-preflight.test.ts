import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  graphql: vi.fn(),
  getAdmin: vi.fn(),
}));
vi.mock("@/lib/shopify/admin.functions", () => ({
  shopifyAdminGraphql: mocks.graphql,
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  getSupabaseAdmin: mocks.getAdmin,
}));

import { assertShopifyHandoffReady } from "@/lib/shopify/whatsapp-draft.server";

const shop = { myshopifyDomain: "ubhd8d-iz.myshopify.com", currencyCode: "YER" };

describe("fail-closed checkout database preflight", () => {
  const state = {
    ordersError: false,
    linksError: false,
    quoteError: false,
    quoteCurrency: "YER",
  };

  beforeEach(() => {
    vi.stubEnv("SHOPIFY_DRAFT_ORDER_WRITES_ENABLED", "true");
    vi.stubEnv("SHOPIFY_STORE_DOMAIN", shop.myshopifyDomain);
    vi.stubEnv("SHOPIFY_DRAFT_ORDER_EXPECTED_DOMAIN", shop.myshopifyDomain);
    vi.stubEnv("SHOPIFY_ADMIN_ACCESS_TOKEN", "fake-server-only-test-token");
    vi.stubEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN", "fake-storefront-test-token");
    vi.stubEnv("CATALOG_SOURCE", "shopify");
    state.ordersError = false;
    state.linksError = false;
    state.quoteError = false;
    state.quoteCurrency = "YER";
    mocks.graphql.mockReset().mockResolvedValue({ shop });
    mocks.getAdmin.mockReset().mockReturnValue({
      from: (name: string) => ({
        select: () => ({
          limit: async () => ({
            error:
              name === "orders"
                ? state.ordersError
                  ? { message: "missing columns" }
                  : null
                : state.linksError
                  ? { message: "missing draft link table" }
                  : null,
          }),
        }),
      }),
      rpc: async () => ({
        data: { total: 0, currency: state.quoteCurrency },
        error: state.quoteError ? { message: "missing checkout_totals_v1" } : null,
      }),
    });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("accepts only a matching verified shop and complete schema", async () => {
    await expect(assertShopifyHandoffReady()).resolves.toBeUndefined();
    expect(mocks.graphql).toHaveBeenCalledOnce();
    expect(mocks.getAdmin).toHaveBeenCalledOnce();
  });

  it("refuses all database work if the feature is disabled", async () => {
    vi.stubEnv("SHOPIFY_DRAFT_ORDER_WRITES_ENABLED", "false");
    await expect(assertShopifyHandoffReady()).rejects.toThrow("SHOPIFY_DRAFT_ORDERS_DISABLED");
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it("rejects a Shopify installation linked to another store", async () => {
    mocks.graphql.mockResolvedValueOnce({
      shop: { ...shop, myshopifyDomain: "unrelated.myshopify.com" },
    });
    await expect(assertShopifyHandoffReady()).rejects.toThrow(
      "SHOPIFY_STORE_IDENTITY_UNVERIFIED",
    );
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it("rejects missing checkout quote columns before a local write", async () => {
    state.ordersError = true;
    await expect(assertShopifyHandoffReady()).rejects.toThrow("SHOPIFY_DB_SCHEMA_UNAVAILABLE");
  });

  it("rejects a missing Shopify draft link migration", async () => {
    state.linksError = true;
    await expect(assertShopifyHandoffReady()).rejects.toThrow("SHOPIFY_DB_SCHEMA_UNAVAILABLE");
  });

  it("rejects a missing checkout_totals_v1 function", async () => {
    state.quoteError = true;
    await expect(assertShopifyHandoffReady()).rejects.toThrow("SHOPIFY_DB_SCHEMA_UNAVAILABLE");
  });

  it("rejects a quote function returning an unexpected currency", async () => {
    state.quoteCurrency = "SAR";
    await expect(assertShopifyHandoffReady()).rejects.toThrow("SHOPIFY_DB_SCHEMA_UNAVAILABLE");
  });
});
