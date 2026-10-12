import type { SupabaseClient } from "@supabase/supabase-js";
import { shopifyAdminGraphql } from "@/lib/shopify/admin.functions";
import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import type { CreateOrderPayload, CreateOrderResult } from "@/lib/order-input";
import {
  HandoffError,
  persistShopifyDraftOrderCore,
  type DraftDatabase,
} from "../../../supabase/functions/_shared/shopify-draft";
export {
  HandoffError,
  validateDraftTotals,
  assertShopifyDraftMatches,
} from "../../../supabase/functions/_shared/shopify-draft";

export async function assertShopifyHandoffReady(): Promise<void> {
  if (process.env.SHOPIFY_DRAFT_ORDER_WRITES_ENABLED !== "true") {
    throw new HandoffError(503, "SHOPIFY_DRAFT_ORDERS_DISABLED");
  }
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .toLowerCase();
  if (
    !domain ||
    !/^[a-z0-9-]+\.myshopify\.com$/.test(domain) ||
    process.env.SHOPIFY_DRAFT_ORDER_EXPECTED_DOMAIN?.trim().toLowerCase() !== domain ||
    !process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ||
    !process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.CATALOG_SOURCE !== "shopify"
  ) {
    throw new HandoffError(503, "SHOPIFY_STORE_IDENTITY_UNVERIFIED");
  }

  const shopData = await shopifyAdminGraphql<{
    shop: { myshopifyDomain: string; currencyCode: string };
  }>("query DraftShopIdentity { shop { myshopifyDomain currencyCode } }");
  if (
    shopData.shop.myshopifyDomain.toLowerCase() !== domain ||
    shopData.shop.currencyCode !== "YER"
  ) {
    throw new HandoffError(503, "SHOPIFY_STORE_IDENTITY_UNVERIFIED");
  }
  // This gate is a read-only probe: a missing live migration must NOT
  // produce a local order that the current code cannot confirm as committed.
  const schema = getSupabaseAdmin() as unknown as SupabaseClient<DraftDatabase>;
  const [ordersSchema, linksSchema, quoteProbe] = await Promise.all([
    schema.from("orders").select("id,checkout_fingerprint,checkout_quote").limit(0),
    schema.from("shopify_whatsapp_draft_links").select("order_id,status").limit(0),
    schema.rpc("checkout_totals_v1", {
      _subtotal: 0,
      _coupon_code: "",
      _cart_config: {},
    }),
  ]);
  const quote = quoteProbe.data;
  if (
    ordersSchema.error ||
    linksSchema.error ||
    quoteProbe.error ||
    !quote ||
    typeof quote !== "object" ||
    Array.isArray(quote) ||
    quote.currency !== "YER" ||
    !Number.isFinite(Number(quote.total)) ||
    Number(quote.total) < 0
  ) {
    throw new HandoffError(503, "SHOPIFY_DB_SCHEMA_UNAVAILABLE");
  }
}

export async function persistShopifyDraftOrder(
  input: CreateOrderPayload,
  local: CreateOrderResult,
) {
  return persistShopifyDraftOrderCore(input, local, {
    db: getSupabaseAdmin() as unknown as SupabaseClient<DraftDatabase>,
    graphql: shopifyAdminGraphql,
    assertReady: assertShopifyHandoffReady,
  });
}
