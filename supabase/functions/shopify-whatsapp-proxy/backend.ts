import type { SupabaseClient } from "@supabase/supabase-js";
import type { NativeOrderInput } from "./checkout-payload.ts";
import {
  HandoffError,
  persistShopifyDraftOrderCore,
  type CreateOrderResult,
  type DraftDatabase,
  type DraftDependencies,
} from "../_shared/shopify-draft.ts";

export type NativeBackendConfig = {
  domain: string;
  tenantId: string;
  supabaseUrl: string;
  serviceKey: string;
  adminToken: string;
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** A staging-only rollout gate. Production cannot be enabled with this version. */
export function nativeBackendConfig(env: (key: string) => string | undefined): NativeBackendConfig {
  const domain = env("INDEXES_SHOPIFY_DOMAIN") ?? "";
  const tenantId = env("INDEXES_STAGING_TENANT_ID") ?? "";
  const supabaseUrl = env("SUPABASE_URL") ?? "";
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const adminToken = env("SHOPIFY_ADMIN_ACCESS_TOKEN") ?? "";
  if (
    env("INDEXES_NATIVE_ORDER_WRITES_ENABLED") !== "true" ||
    env("INDEXES_ORDER_ENVIRONMENT") !== "staging" ||
    domain !== "ubhd8d-iz.myshopify.com" ||
    !UUID.test(tenantId) ||
    !/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(supabaseUrl) ||
    supabaseUrl !== env("INDEXES_EXPECTED_STAGING_URL") ||
    supabaseUrl === "https://wtudcippyxbaobqzbmok.supabase.co" ||
    !serviceKey ||
    !adminToken
  )
    throw new HandoffError(503, "STAGING_ORDER_BACKEND_NOT_CONFIGURED");
  return { domain, tenantId, supabaseUrl, serviceKey, adminToken };
}

type Product = {
  id: string;
  external_id: string | null;
  tenant_id: string;
  price: number;
  currency: string;
  is_published: boolean;
};
type Variant = {
  id: string;
  availableForSale: boolean;
  inventoryQuantity: number | null;
  inventoryPolicy: string;
  price: string;
  product: { status: string };
};

async function preflight(
  db: SupabaseClient<DraftDatabase>,
  graphql: DraftDependencies["graphql"],
  config: NativeBackendConfig,
) {
  const identity = await graphql<{ shop: { myshopifyDomain: string; currencyCode: string } }>(
    "query DraftShopIdentity { shop { myshopifyDomain currencyCode } }",
  );
  if (identity.shop.myshopifyDomain !== config.domain || identity.shop.currencyCode !== "YER") {
    throw new HandoffError(503, "SHOPIFY_STORE_IDENTITY_UNVERIFIED");
  }
  const [tenant, orders, links, quote] = await Promise.all([
    db.from("tenants").select("id,status").eq("id", config.tenantId).maybeSingle(),
    db.from("orders").select("id,checkout_fingerprint,checkout_quote").limit(0),
    db.from("shopify_whatsapp_draft_links").select("order_id,status").limit(0),
    db.rpc("checkout_totals_v1", { _subtotal: 0, _coupon_code: "", _cart_config: {} }),
  ]);
  if (
    tenant.error ||
    tenant.data?.id !== config.tenantId ||
    tenant.data.status !== "active" ||
    orders.error ||
    links.error ||
    quote.error ||
    !quote.data ||
    typeof quote.data !== "object" ||
    Array.isArray(quote.data) ||
    quote.data.currency !== "YER" ||
    typeof quote.data.total !== "number" ||
    !Number.isFinite(quote.data.total) ||
    quote.data.total < 0
  ) {
    throw new HandoffError(503, "SHOPIFY_DB_SCHEMA_UNAVAILABLE");
  }
}

function committedResult(
  value: unknown,
  rows: Product[],
  input: NativeOrderInput,
): CreateOrderResult {
  const local = value as CreateOrderResult | null;
  const quote = local?.quote;
  if (
    !local ||
    !UUID.test(local.orderId) ||
    local.currency !== "YER" ||
    local.itemsCount !== input.items.length ||
    !quote ||
    quote.currency !== "YER" ||
    ![
      local.total,
      quote.subtotal,
      quote.discount,
      quote.shipping,
      quote.total,
      quote.freeShippingThreshold,
    ].every((x) => typeof x === "number" && Number.isFinite(x) && x >= 0) ||
    local.total !== quote.total ||
    Math.abs(quote.subtotal - quote.discount + quote.shipping - quote.total) > 0.01 ||
    quote.couponCode !== input.couponCode ||
    !Array.isArray(quote.items) ||
    quote.items.length !== rows.length
  ) {
    throw new HandoffError(409, "LOCAL_ORDER_INTEGRITY_ERROR");
  }
  const byId = new Map(quote.items.map((x) => [x.id, x]));
  if (byId.size !== rows.length) throw new HandoffError(409, "LOCAL_ORDER_LINES_MISMATCH");
  let subtotal = 0;
  for (const row of rows) {
    const line = byId.get(row.id);
    const requested = input.items.find((x) => x.productRef.id === row.external_id)!;
    if (
      !line ||
      line.quantity !== requested.quantity ||
      typeof line.name !== "string" ||
      !Number.isInteger(line.stock) ||
      line.stock < 0 ||
      !Number.isFinite(line.unitPrice) ||
      line.unitPrice <= 0 ||
      Number(row.price) !== line.unitPrice
    ) {
      throw new HandoffError(409, "LOCAL_ORDER_LINES_MISMATCH");
    }
    subtotal += line.quantity * line.unitPrice;
  }
  if (Math.abs(subtotal - quote.subtotal) > 0.01)
    throw new HandoffError(409, "LOCAL_ORDER_INTEGRITY_ERROR");
  return local;
}

/** Signature and one-use challenge MUST be verified by the HTTP entrypoint first. */
export async function saveNativeOrder(
  input: NativeOrderInput,
  config: NativeBackendConfig,
  db: SupabaseClient<DraftDatabase>,
  graphql: DraftDependencies["graphql"],
) {
  await preflight(db, graphql, config);
  // Keyed HMAC avoids retaining phone numbers or an enumerable unsalted phone hash.
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(config.serviceKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${config.tenantId}:${input.customerPhone}`),
  );
  const bucket = Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, "0")).join(
    "",
  );
  const limit = await db.rpc("consume_native_checkout_slot", {
    _tenant_id: config.tenantId,
    _key: bucket,
  });
  if (limit.error) throw new HandoffError(503, "CHECKOUT_RATE_LIMIT_UNAVAILABLE");
  if (limit.data !== true) throw new HandoffError(429, "CHECKOUT_RATE_LIMITED");

  const ids = input.items.map((x) => x.productRef.id);
  const [catalog, variants] = await Promise.all([
    db
      .from("products")
      .select("id,external_id,tenant_id,price,currency,is_published")
      .eq("tenant_id", config.tenantId)
      .in("external_id", ids),
    graphql<{ nodes: Array<Variant | null> }>(
      `
        query DraftVariants($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on ProductVariant {
              id
              availableForSale
              inventoryQuantity
              inventoryPolicy
              price
              product {
                status
              }
            }
          }
        }
      `,
      { ids },
    ),
  ]);
  const rows = catalog.data;
  if (
    catalog.error ||
    !rows ||
    rows.length !== ids.length ||
    variants.nodes.length !== ids.length
  ) {
    throw new HandoffError(409, "LOCAL_SHOPIFY_MAPPING_MISSING");
  }
  const byVariant = new Map(rows.map((x) => [x.external_id, x]));
  if (byVariant.size !== ids.length) throw new HandoffError(409, "LOCAL_SHOPIFY_MAPPING_INVALID");
  const items = input.items.map((item, index) => {
    const row = byVariant.get(item.productRef.id);
    const variant = variants.nodes[index];
    if (
      !row ||
      row.tenant_id !== config.tenantId ||
      !row.is_published ||
      row.currency !== "YER" ||
      !Number.isFinite(Number(row.price)) ||
      Number(row.price) <= 0 ||
      !variant ||
      variant.id !== item.productRef.id ||
      !variant.availableForSale ||
      variant.product.status !== "ACTIVE" ||
      Number(variant.price) !== Number(row.price) ||
      (variant.inventoryPolicy !== "CONTINUE" &&
        (variant.inventoryQuantity === null || variant.inventoryQuantity < item.quantity))
    ) {
      throw new HandoffError(409, "SHOPIFY_PRICE_OR_STOCK_CHANGED");
    }
    return { source: "supabase", id: row.id, quantity: item.quantity };
  });
  // SQL locks stock, derives the quote and fingerprints this exact request atomically.
  // No catalog writes and no caller-supplied tenant, user ID or prices are accepted.
  const commit = await db.rpc("create_checkout_order_v2", {
    _tenant_id: config.tenantId,
    _user_id: null,
    _customer_name: input.customerName,
    _customer_phone: input.customerPhone,
    _customer_address: input.customerAddress,
    _customer_email: null,
    _notes: input.notes ?? null,
    _coupon_code: input.couponCode,
    _expected_total: null,
    _payment_provider: "cod",
    _idempotency_key: input.idempotencyKey,
    _items: items,
  });
  if (commit.error) throw new HandoffError(409, "LOCAL_ORDER_COMMIT_FAILED");
  const local = committedResult(commit.data, rows, input);
  return persistShopifyDraftOrderCore(input, local, {
    db,
    graphql,
    expectedTenantId: config.tenantId,
    assertReady: () => preflight(db, graphql, config),
  });
}
