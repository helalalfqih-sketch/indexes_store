import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateOrderPayload, CreateOrderResult } from "@/lib/order.functions";

import {
  nativeBackendConfig,
  saveNativeOrder,
} from "../../supabase/functions/shopify-whatsapp-proxy/backend";
import type { NativeOrderInput } from "../../supabase/functions/shopify-whatsapp-proxy/checkout-payload";
const mocks = { graphql: vi.fn(), getAdmin: vi.fn(), rpc: vi.fn() };

const orderId = "11111111-1111-4111-8111-111111111111";
const tenantId = "22222222-2222-4222-8222-222222222222";
const productId = "33333333-3333-4333-8333-333333333333";
const variantId = "gid://shopify/ProductVariant/123";

const payload: NativeOrderInput = {
  couponCode: "",
  paymentProvider: "cod",
  turnstileToken: "not-a-real-token-fixture",
  idempotencyKey: "44444444-4444-4444-8444-444444444444",
  customerName: "Sample Buyer",
  customerPhone: "967771234567",
  customerAddress: "Sana'a",
  items: [{ productRef: { source: "shopify", id: variantId }, quantity: 1 }],
};

const local: CreateOrderResult = {
  orderId,
  total: 9500,
  currency: "YER",
  itemsCount: 1,
  quote: {
    subtotal: 6500,
    discount: 0,
    shipping: 3000,
    total: 9500,
    currency: "YER",
    couponCode: "",
    freeShippingThreshold: 30000,
    items: [{ id: productId, name: "Sample Product", quantity: 1, unitPrice: 6500, stock: 50 }],
  },
};

const orderRow = {
  id: orderId,
  tenant_id: tenantId,
  total: 9500,
  currency: "YER",
  customer_name: "Sample Buyer",
  customer_phone: "771234567",
  customer_address: "Sana'a",
  customer_email: null,
};
const orderLine = {
  product_id: productId,
  quantity: 1,
  unit_price: 6500,
  product_name_snapshot: "Sample Product",
};

function draftSnapshot() {
  return {
    id: "gid://shopify/DraftOrder/12345",
    name: "#D12345",
    status: "OPEN",
    tags: ["indexes-whatsapp-cod", `indexes-local-${orderId}`],
    customAttributes: [{ key: "indexes_local_order_id", value: orderId }],
    totalPriceSet: { presentmentMoney: { amount: "9500.00", currencyCode: "YER" } },
    lineItems: {
      nodes: [
        {
          quantity: 1,
          variant: { id: variantId },
          originalUnitPriceSet: {
            presentmentMoney: { amount: "6500.00", currencyCode: "YER" },
          },
        },
      ],
      pageInfo: { hasNextPage: false },
    },
  };
}

const config = {
  domain: "ubhd8d-iz.myshopify.com",
  tenantId,
  supabaseUrl: "https://stagingfixture.supabase.co",
  serviceKey: "test-only-key",
  adminToken: "test-only-token",
};
async function persistShopifyDraftOrder(input: NativeOrderInput, _local: CreateOrderResult) {
  return saveNativeOrder(input, config, mocks.getAdmin(), mocks.graphql);
}

describe("Native backend saves and reconciles without catalog writes", () => {
  let link: {
    status: string;
    shopify_draft_id: string | null;
    shopify_draft_name: string | null;
  } | null;
  let actualDraft: ReturnType<typeof draftSnapshot>;
  let created: number;
  let uncertainMutation: boolean;
  let calculatedTotal: string;

  beforeEach(() => {
    vi.stubEnv("SHOPIFY_DRAFT_ORDER_WRITES_ENABLED", "true");
    vi.stubEnv("SHOPIFY_STORE_DOMAIN", "ubhd8d-iz.myshopify.com");
    vi.stubEnv("SHOPIFY_DRAFT_ORDER_EXPECTED_DOMAIN", "ubhd8d-iz.myshopify.com");
    vi.stubEnv("SHOPIFY_ADMIN_ACCESS_TOKEN", "unit-test-only");
    vi.stubEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN", "unit-test-only");
    vi.stubEnv("CATALOG_SOURCE", "shopify");
    link = null;
    created = 0;
    uncertainMutation = false;
    calculatedTotal = "9500.00";
    actualDraft = draftSnapshot();

    mocks.rpc.mockReset().mockImplementation(async (name: string) => {
      if (name === "checkout_totals_v1")
        return { data: { currency: "YER", total: 0 }, error: null };
      if (name === "consume_native_checkout_slot") return { data: true, error: null };
      if (name === "create_checkout_order_v2") return { data: local, error: null };
      throw new Error("unexpected rpc");
    });
    mocks.getAdmin.mockReset().mockImplementation(() => ({
      rpc: mocks.rpc,
      from: (table: string) => {
        let patch: Record<string, unknown> | null = null;
        const applyPatch = () => {
          if (patch && link) {
            link = { ...link, ...patch };
          }
        };
        const qb = {
          select: () => qb,
          eq: () => qb,
          in: () => qb,
          limit: async () => ({ error: null }),
          insert: async () => {
            if (table !== "shopify_whatsapp_draft_links") throw new Error("Unexpected write");
            if (link) return { error: { code: "23505" } };
            link = { status: "creating", shopify_draft_id: null, shopify_draft_name: null };
            return { error: null };
          },
          update: (fields: Record<string, unknown>) => {
            if (table !== "shopify_whatsapp_draft_links") throw new Error("Unexpected write");
            patch = fields;
            return qb;
          },
          single: async () => {
            applyPatch();
            if (table === "orders") return { data: orderRow, error: null };
            if (table === "shopify_whatsapp_draft_links") {
              return { data: { shopify_draft_id: link?.shopify_draft_id }, error: null };
            }
            return { data: null, error: { message: "unexpected table" } };
          },
          maybeSingle: async () => ({
            data: table === "tenants" ? { id: tenantId, status: "active" } : link,
            error: null,
          }),
          then: (resolve: (result: unknown) => void, reject: (reason?: unknown) => void) => {
            applyPatch();
            const result =
              table === "order_items"
                ? { data: [orderLine], error: null }
                : {
                    data: [
                      {
                        id: productId,
                        external_id: variantId,
                        tenant_id: tenantId,
                        price: 6500,
                        currency: "YER",
                        is_published: true,
                      },
                    ],
                    error: null,
                  };
            return Promise.resolve(result).then(resolve, reject);
          },
        };
        return qb;
      },
    }));
    mocks.graphql.mockReset().mockImplementation(async (query: string) => {
      if (query.includes("DraftShopIdentity")) {
        return { shop: { myshopifyDomain: "ubhd8d-iz.myshopify.com", currencyCode: "YER" } };
      }
      if (query.includes("DraftVariants")) {
        return {
          nodes: [
            {
              id: variantId,
              availableForSale: true,
              inventoryQuantity: 50,
              inventoryPolicy: "DENY",
              price: "6500",
              product: { status: "ACTIVE" },
            },
          ],
        };
      }
      if (query.includes("mutation CalculateIndexesDraft")) {
        return {
          draftOrderCalculate: {
            calculatedDraftOrder: {
              totalPriceSet: {
                presentmentMoney: { amount: calculatedTotal, currencyCode: "YER" },
              },
            },
            userErrors: [],
          },
        };
      }
      if (query.includes("mutation CreateIndexesDraft")) {
        created += 1;
        if (uncertainMutation) throw new Error("network timeout with unknown outcome");
        return { draftOrderCreate: { draftOrder: actualDraft, userErrors: [] } };
      }
      if (query.includes("VerifyIndexesDraft")) {
        return { draftOrder: actualDraft };
      }
      throw new Error("unexpected Shopify GraphQL operation");
    });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("rejects a Shopify calculated total mismatch before any claim or draft create", async () => {
    calculatedTotal = "9800.00";
    await expect(persistShopifyDraftOrder(payload, local)).rejects.toThrow(
      "SHOPIFY_TOTAL_MISMATCH",
    );
    expect(link).toBeNull();
    expect(created).toBe(0);
  });

  it("creates one Shopify draft, re-reads it on retry, and never creates a second", async () => {
    const first = await persistShopifyDraftOrder(payload, local);
    expect(first.whatsappReady).toBe(true);
    expect(created).toBe(1);
    const retry = await persistShopifyDraftOrder(payload, local);
    expect(retry.draftOrderId).toBe(first.draftOrderId);
    expect(retry.whatsappReady).toBe(true);
    expect(created).toBe(1);
    expect(
      mocks.graphql.mock.calls.some(([query]) => String(query).includes("VerifyIndexesDraft")),
    ).toBe(true);
  });

  it("blocks retries of a draft changed in Shopify instead of recreating it", async () => {
    await persistShopifyDraftOrder(payload, local);
    actualDraft.status = "COMPLETED";
    await expect(persistShopifyDraftOrder(payload, local)).rejects.toThrow(
      "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED",
    );
    expect(created).toBe(1);
  });

  it("blocks a retry after an ambiguous mutation outcome and preserves its claim", async () => {
    uncertainMutation = true;
    await expect(persistShopifyDraftOrder(payload, local)).rejects.toThrow(
      "network timeout with unknown outcome",
    );
    expect(link?.status).toBe("creating");
    uncertainMutation = false;
    await expect(persistShopifyDraftOrder(payload, local)).rejects.toThrow(
      "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED",
    );
    expect(created).toBe(1);
  });
  it("uses server tenant and authoritative RPC items, ignoring challenge in the commit", async () => {
    await persistShopifyDraftOrder(payload, local);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "create_checkout_order_v2",
      expect.objectContaining({
        _tenant_id: tenantId,
        _user_id: null,
        _expected_total: null,
        _idempotency_key: payload.idempotencyKey,
        _items: [{ source: "supabase", id: productId, quantity: 1 }],
      }),
    );
  });
  it("blocks a wrong shop before any database operation", async () => {
    mocks.graphql.mockResolvedValueOnce({
      shop: { myshopifyDomain: "wrong.myshopify.com", currencyCode: "YER" },
    });
    await expect(persistShopifyDraftOrder(payload, local)).rejects.toThrow(
      "SHOPIFY_STORE_IDENTITY_UNVERIFIED",
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("blocks rate limited requests before creating local or Shopify orders", async () => {
    const original = mocks.rpc.getMockImplementation()!;
    mocks.rpc.mockImplementation((name, ...args) =>
      name === "consume_native_checkout_slot"
        ? { data: false, error: null }
        : original(name, ...args),
    );
    await expect(persistShopifyDraftOrder(payload, local)).rejects.toThrow("CHECKOUT_RATE_LIMITED");
    expect(mocks.rpc.mock.calls.some(([name]) => name === "create_checkout_order_v2")).toBe(false);
    expect(created).toBe(0);
  });
  it("blocks a missing limiter migration before local writes", async () => {
    const original = mocks.rpc.getMockImplementation()!;
    mocks.rpc.mockImplementation((name, ...args) =>
      name === "consume_native_checkout_slot"
        ? { data: null, error: { message: "missing function" } }
        : original(name, ...args),
    );
    await expect(persistShopifyDraftOrder(payload, local)).rejects.toThrow(
      "CHECKOUT_RATE_LIMIT_UNAVAILABLE",
    );
    expect(mocks.rpc.mock.calls.some(([name]) => name === "create_checkout_order_v2")).toBe(false);
  });
  it("rejects a damaged local quote before Shopify draft creation", async () => {
    const original = mocks.rpc.getMockImplementation()!;
    mocks.rpc.mockImplementation((name, ...args) =>
      name === "create_checkout_order_v2"
        ? { data: { ...local, quote: { ...local.quote, subtotal: 1 } }, error: null }
        : original(name, ...args),
    );
    await expect(persistShopifyDraftOrder(payload, local)).rejects.toThrow(
      "LOCAL_ORDER_INTEGRITY_ERROR",
    );
    expect(created).toBe(0);
  });
});

describe("native staging configuration", () => {
  const environment: Record<string, string> = {
    INDEXES_NATIVE_ORDER_WRITES_ENABLED: "true",
    INDEXES_ORDER_ENVIRONMENT: "staging",
    INDEXES_SHOPIFY_DOMAIN: config.domain,
    INDEXES_STAGING_TENANT_ID: tenantId,
    SUPABASE_URL: config.supabaseUrl,
    INDEXES_EXPECTED_STAGING_URL: config.supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: "fixture-key",
    SHOPIFY_ADMIN_ACCESS_TOKEN: "fixture-token",
  };
  it("requires every gate and credential", () => {
    expect(nativeBackendConfig((key) => environment[key]).tenantId).toBe(tenantId);
    for (const missing of Object.keys(environment)) {
      expect(() =>
        nativeBackendConfig((key) => (key === missing ? undefined : environment[key])),
      ).toThrow("STAGING_ORDER_BACKEND_NOT_CONFIGURED");
    }
  });
  it("refuses production even with the switch enabled", () => {
    const unsafe = {
      ...environment,
      SUPABASE_URL: "https://wtudcippyxbaobqzbmok.supabase.co",
      INDEXES_EXPECTED_STAGING_URL: "https://wtudcippyxbaobqzbmok.supabase.co",
    };
    expect(() => nativeBackendConfig((key) => unsafe[key])).toThrow(
      "STAGING_ORDER_BACKEND_NOT_CONFIGURED",
    );
  });
});
