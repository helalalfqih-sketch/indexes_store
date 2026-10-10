import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";

// Branch-local schema extension. Regenerate the complete Supabase types from
// the verified staging database after the migration is applied.
type DraftLink = {
  order_id: string;
  tenant_id: string;
  shopify_draft_id: string | null;
  shopify_draft_name: string | null;
  status: "creating" | "verifying" | "ready" | "needs_reconciliation";
  created_at: string;
  updated_at: string;
};
type DraftDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Functions: Database["public"]["Functions"] & {
      checkout_totals_v1: {
        Args: { _subtotal: number; _coupon_code: string | null; _cart_config: Json };
        Returns: Json;
      };
    };
    Tables: Database["public"]["Tables"] & {
      shopify_whatsapp_draft_links: {
        Row: DraftLink;
        Insert: Pick<DraftLink, "order_id" | "tenant_id" | "status"> &
          Partial<Omit<DraftLink, "order_id" | "tenant_id" | "status">>;
        Update: Partial<DraftLink>;
        Relationships: [];
      };
    };
  };
};
import { shopifyAdminGraphql } from "@/lib/shopify/admin.functions";
import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { formatOrderNumber } from "@/lib/order-status";
import type { CreateOrderPayload, CreateOrderResult } from "@/lib/order.functions";

type Draft = {
  id: string;
  name: string;
  totalPriceSet: { presentmentMoney: { amount: string; currencyCode: string } };
};
type DraftLine = {
  quantity: number;
  variant: { id: string } | null;
  originalUnitPriceSet: { presentmentMoney: { amount: string; currencyCode: string } };
};

type VerifiedDraft = Draft & {
  status: string;
  tags: string[];
  customAttributes: Array<{ key: string; value: string }>;
  lineItems: {
    nodes: DraftLine[];
    pageInfo: { hasNextPage: boolean };
  };
};

type ExpectedDraftLine = { variantId: string; quantity: number; unitPrice: number };

type DraftResult = {
  draftOrderCreate: { draftOrder: VerifiedDraft | null; userErrors: Array<{ message: string }> };
};
type DraftCalculationResult = {
  draftOrderCalculate: {
    calculatedDraftOrder: Pick<Draft, "totalPriceSet"> | null;
    userErrors: Array<{ message: string }>;
  };
};
type Variant = {
  id: string;
  availableForSale: boolean;
  inventoryQuantity: number | null;
  inventoryPolicy: string;
  price: string;
  product: { status: string };
};
const UUID = /^[0-9a-f-]{36}$/i;

export class HandoffError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
  }
}

function money(value: number): string {
  if (!Number.isFinite(value) || value < 0) throw new HandoffError(422, "INVALID_AMOUNT");
  return value.toFixed(2);
}

export function validateDraftTotals(
  local: CreateOrderResult,
  draft: Pick<Draft, "totalPriceSet">,
): void {
  const amount = Number(draft.totalPriceSet.presentmentMoney.amount);
  if (
    draft.totalPriceSet.presentmentMoney.currencyCode !== "YER" ||
    !Number.isFinite(amount) ||
    Math.abs(amount - local.total) > 0.01
  ) {
    throw new HandoffError(409, "SHOPIFY_TOTAL_MISMATCH");
  }
}

/**
 * Shopify Draft Orders can be edited or completed after creation. A previously
 * linked draft must still match the committed local order before reuse.
 * This is a read-only check and never creates a second Shopify draft.
 */
export function assertShopifyDraftMatches(
  local: CreateOrderResult,
  draft: VerifiedDraft | null,
  expectedLines: ExpectedDraftLine[],
): asserts draft is VerifiedDraft {
  if (
    !draft ||
    !/^gid:\/\/shopify\/DraftOrder\/\d+$/.test(draft.id) ||
    draft.status !== "OPEN" ||
    !Array.isArray(draft.tags) ||
    !draft.tags.includes(`indexes-local-${local.orderId}`) ||
    !Array.isArray(draft.customAttributes) ||
    !draft.customAttributes.some(
      (entry) => entry.key === "indexes_local_order_id" && entry.value === local.orderId,
    ) ||
    !draft.lineItems ||
    draft.lineItems.pageInfo.hasNextPage ||
    draft.lineItems.nodes.length !== expectedLines.length
  ) {
    throw new HandoffError(409, "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED");
  }

  const expectedByVariant = new Map(expectedLines.map((line) => [line.variantId, line]));
  if (expectedByVariant.size !== expectedLines.length) {
    throw new HandoffError(409, "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED");
  }
  const seen = new Set<string>();
  for (const line of draft.lineItems.nodes) {
    const id = line.variant?.id;
    const expected = id ? expectedByVariant.get(id) : undefined;
    const moneyValue = line.originalUnitPriceSet?.presentmentMoney;
    if (
      !id ||
      !expected ||
      seen.has(id) ||
      line.quantity !== expected.quantity ||
      !moneyValue ||
      moneyValue.currencyCode !== "YER" ||
      !Number.isFinite(Number(moneyValue.amount)) ||
      Math.abs(Number(moneyValue.amount) - expected.unitPrice) > 0.01
    ) {
      throw new HandoffError(409, "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED");
    }
    seen.add(id);
  }
  validateDraftTotals(local, draft);
}

/**
 * Verify the target store and required server-side configuration before
 * creating the local order. A CORS Origin is NOT proof of authentication.
 * This is intentionally fail-closed until the Preview environment is wired.
 */
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
    Number(quote.total) !== 0
  ) {
    throw new HandoffError(503, "SHOPIFY_DB_SCHEMA_UNAVAILABLE");
  }
}

/**
 * Safe state machine: a durable claim is acquired before any non-idempotent
 * draftOrderCreate call. On timeout/unknown response NEVER auto-retry creation:
 * reconcile the Shopify reference first to avoid duplicate drafts.
 */
export async function persistShopifyDraftOrder(
  input: CreateOrderPayload,
  local: CreateOrderResult,
) {
  await assertShopifyHandoffReady();
  if (
    !UUID.test(local.orderId) ||
    local.currency !== "YER" ||
    local.itemsCount !== input.items.length ||
    local.quote.total !== local.total
  ) {
    throw new HandoffError(409, "LOCAL_ORDER_INTEGRITY_ERROR");
  }
  if (
    input.items.some(
      (item) =>
        item.productRef.source !== "shopify" ||
        !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(item.productRef.id),
    )
  ) {
    throw new HandoffError(422, "SHOPIFY_VARIANTS_REQUIRED");
  }

  const db = getSupabaseAdmin() as unknown as SupabaseClient<DraftDatabase>;
  // Match the exact variant IDs attached to the committed local line items.
  // Shopify IDs and local prices MUST never be taken from untrusted client totals.
  const { data: order, error: orderError } = await db
    .from("orders")
    .select(
      "id,tenant_id,total,currency,customer_name,customer_phone,customer_address,customer_email",
    )
    .eq("id", local.orderId)
    .single();
  if (orderError || !order || Number(order.total) !== local.total || order.currency !== "YER") {
    throw new HandoffError(409, "LOCAL_ORDER_NOT_VERIFIED");
  }
  const { data: lines, error: linesError } = await db
    .from("order_items")
    .select("product_id,quantity,unit_price,product_name_snapshot")
    .eq("order_id", local.orderId)
    .eq("tenant_id", order.tenant_id);
  if (linesError || !lines || lines.length !== input.items.length) {
    throw new HandoffError(409, "LOCAL_ORDER_LINES_MISMATCH");
  }
  const ids = lines.map((line) => line.product_id);
  const { data: products, error: productsError } = await db
    .from("products")
    .select("id,external_id")
    .eq("tenant_id", order.tenant_id)
    .in("id", ids);
  if (productsError || !products || products.length !== ids.length) {
    throw new HandoffError(409, "LOCAL_SHOPIFY_MAPPING_MISSING");
  }
  const externalByLocal = new Map(products.map((product) => [product.id, product.external_id]));
  const variantIds = lines.map((line) => externalByLocal.get(line.product_id));
  if (variantIds.some((id) => !id || !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(id))) {
    throw new HandoffError(409, "LOCAL_SHOPIFY_MAPPING_INVALID");
  }
  // Do not allow a retry with changed product references or quantities.
  const requested = new Map(input.items.map((item) => [item.productRef.id, item.quantity]));
  if (
    requested.size !== input.items.length ||
    lines.some((line, i) => requested.get(variantIds[i]!) !== line.quantity)
  ) {
    throw new HandoffError(409, "ORDER_PRODUCT_MISMATCH");
  }

  const variantData = await shopifyAdminGraphql<{ nodes: Array<Variant | null> }>(
    `query DraftVariants($ids: [ID!]!) {
      nodes(ids: $ids) { ... on ProductVariant {
        id availableForSale inventoryQuantity inventoryPolicy price product { status }
      } }
    }`,
    { ids: variantIds },
  );
  if (variantData.nodes.length !== lines.length)
    throw new HandoffError(409, "SHOPIFY_VARIANTS_MISSING");
  lines.forEach((line, i) => {
    const node = variantData.nodes[i];
    if (
      !node ||
      node.id !== variantIds[i] ||
      !node.availableForSale ||
      node.product.status !== "ACTIVE" ||
      !Number.isFinite(Number(node.price)) ||
      Math.abs(Number(node.price) - Number(line.unit_price)) > 0.01 ||
      (node.inventoryPolicy !== "CONTINUE" &&
        (node.inventoryQuantity === null || node.inventoryQuantity < line.quantity))
    ) {
      throw new HandoffError(409, "SHOPIFY_PRICE_OR_STOCK_CHANGED");
    }
  });

  const expectedDraftLines: ExpectedDraftLine[] = lines.map((line, index) => ({
    variantId: variantIds[index]!,
    quantity: line.quantity,
    unitPrice: Number(line.unit_price),
  }));

  const draftInput = {
    lineItems: lines.map((line, i) => ({
      variantId: variantIds[i],
      quantity: line.quantity,
      priceOverride: { amount: money(Number(line.unit_price)), currencyCode: "YER" },
    })),
    presentmentCurrencyCode: "YER",
    acceptAutomaticDiscounts: false,
    allowDiscountCodesInCheckout: false,
    ...(local.quote.discount > 0
      ? {
          appliedDiscount: {
            title: "Indexes checkout discount",
            value: local.quote.discount,
            valueType: "FIXED_AMOUNT",
          },
        }
      : {}),
    shippingLine: {
      title: "التوصيل",
      priceWithCurrency: { amount: money(local.quote.shipping), currencyCode: "YER" },
    },
    shippingAddress: {
      address1: order.customer_address,
      countryCode: "YE",
      firstName: order.customer_name,
      phone: order.customer_phone,
    },
    phone: order.customer_phone,
    ...(order.customer_email ? { email: order.customer_email } : {}),
    note: `Indexes COD WhatsApp | Local order: ${local.orderId} | Pending confirmation`,
    tags: ["indexes-whatsapp-cod", `indexes-local-${local.orderId}`],
    customAttributes: [
      { key: "indexes_local_order_id", value: local.orderId },
      { key: "payment_method", value: "cash_on_delivery" },
    ],
  };
  // Shopify computes taxes, shipping and discounts without saving a draft.
  // Reject a mismatching amount before claiming or creating anything in Shopify.
  const calculated = await shopifyAdminGraphql<DraftCalculationResult>(
    `mutation CalculateIndexesDraft($input: DraftOrderInput!) {
      draftOrderCalculate(input: $input) {
        calculatedDraftOrder {
          totalPriceSet { presentmentMoney { amount currencyCode } }
        }
        userErrors { message }
      }
    }`,
    { input: draftInput },
  );
  if (
    calculated.draftOrderCalculate.userErrors.length > 0 ||
    !calculated.draftOrderCalculate.calculatedDraftOrder
  ) {
    throw new HandoffError(409, "SHOPIFY_DRAFT_CALCULATION_FAILED");
  }
  validateDraftTotals(local, calculated.draftOrderCalculate.calculatedDraftOrder);

  // INSERT conflicts on order_id; only the first caller may create a Shopify draft.
  const { error: claimError } = await db.from("shopify_whatsapp_draft_links").insert({
    order_id: local.orderId,
    tenant_id: order.tenant_id,
    status: "creating",
  });
  if (claimError) {
    if (claimError.code === "23505") {
      const { data: existing } = await db
        .from("shopify_whatsapp_draft_links")
        .select("status,shopify_draft_id,shopify_draft_name")
        .eq("order_id", local.orderId)
        .eq("tenant_id", order.tenant_id)
        .maybeSingle();
      if (existing?.status === "ready" && existing.shopify_draft_id) {
        // A stale or edited draft must not be approved just because the local
        // linkage says "ready". Re-read Shopify, never re-create on retry.
        const lookup = await shopifyAdminGraphql<{ draftOrder: VerifiedDraft | null }>(
          `query VerifyIndexesDraft($id: ID!) {
            draftOrder(id: $id) {
              id name status tags customAttributes { key value }
              totalPriceSet { presentmentMoney { amount currencyCode } }
              lineItems(first: 100) {
                nodes {
                  quantity variant { id }
                  originalUnitPriceSet { presentmentMoney { amount currencyCode } }
                }
                pageInfo { hasNextPage }
              }
            }
          }`,
          { id: existing.shopify_draft_id },
        );
        assertShopifyDraftMatches(local, lookup.draftOrder, expectedDraftLines);
        if (lookup.draftOrder.id !== existing.shopify_draft_id) {
          throw new HandoffError(409, "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED");
        }
        return {
          ...local,
          orderNumber: formatOrderNumber(local.orderId),
          draftOrderId: lookup.draftOrder.id,
          draftOrderName: lookup.draftOrder.name,
          whatsappReady: true,
        };
      }
      throw new HandoffError(409, "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED");
    }
    throw new HandoffError(503, "SHOPIFY_DRAFT_CLAIM_UNAVAILABLE");
  }

  // This mutation has no end-to-end cross-system transaction; any failure
  // after claim remains blocked for manual reconciliation (no blind retry).
  const response = await shopifyAdminGraphql<DraftResult>(
    `mutation CreateIndexesDraft($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id name status tags customAttributes { key value }
          totalPriceSet { presentmentMoney { amount currencyCode } }
          lineItems(first: 100) {
            nodes {
              quantity variant { id }
              originalUnitPriceSet { presentmentMoney { amount currencyCode } }
            }
            pageInfo { hasNextPage }
          }
        }
        userErrors { message }
      }
    }`,
    { input: draftInput },
  );
  const draft = response.draftOrderCreate.draftOrder;
  if (response.draftOrderCreate.userErrors.length || !draft) {
    throw new HandoffError(409, "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED");
  }
  // Preserve ID even if a pricing check fails, for a manual reconciliation.
  const { error: linkError } = await db
    .from("shopify_whatsapp_draft_links")
    .update({
      shopify_draft_id: draft.id,
      shopify_draft_name: draft.name,
      status: "verifying",
    })
    .eq("order_id", local.orderId)
    .eq("tenant_id", order.tenant_id)
    .eq("status", "creating");
  if (linkError) throw new HandoffError(503, "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED");
  assertShopifyDraftMatches(local, draft, expectedDraftLines);
  const { data: ready, error: readyError } = await db
    .from("shopify_whatsapp_draft_links")
    .update({ status: "ready" })
    .eq("order_id", local.orderId)
    .eq("tenant_id", order.tenant_id)
    .eq("status", "verifying")
    .select("shopify_draft_id")
    .single();
  if (readyError || ready?.shopify_draft_id !== draft.id)
    throw new HandoffError(503, "SHOPIFY_DRAFT_RECONCILIATION_REQUIRED");
  return {
    ...local,
    orderNumber: formatOrderNumber(local.orderId),
    draftOrderId: draft.id,
    draftOrderName: draft.name,
    whatsappReady: true,
  };
}
