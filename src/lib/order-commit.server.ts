import { getRequest } from "@tanstack/react-start/server";
import { resolveCurrentTenant } from "@/lib/saas/tenant-resolver";
import { normalizeYemeniPhone } from "@/lib/shipping";
import {
  assertCheckoutCommit,
  requireSupabaseCheckoutProductIds,
  validateTenantCheckoutProducts,
} from "@/lib/checkout-product-contract";
import type { CreateOrderPayload, CreateOrderResult } from "@/lib/order-input";

/**
 * Server-internal order commit. No public server function is exported here.
 * The Shopify route must verify shop identity, schema and one-use challenge
 * BEFORE invoking this. Public createOrder is separately gated.
 */
/**
 * Extract a verified auth uid from the request bearer token, or null for guests.
 * Never throws for missing/invalid tokens — order creation stays open to guests.
 */
async function getOptionalUserId(admin: {
  auth: {
    getUser: (jwt: string) => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  };
}): Promise<string | null> {
  try {
    const req = getRequest();
    const authHeader = req?.headers?.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token || token.split(".").length !== 3) return null;
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

export async function commitCheckoutOrder(
  data: CreateOrderPayload,
  options: { readOnlyShopifyCatalog?: boolean } = {},
): Promise<CreateOrderResult> {
  const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
  const supabaseAdmin = getSupabaseAdmin();

  const normalizedPhone = normalizeYemeniPhone(data.customerPhone);
  const customerPhone = normalizedPhone ?? data.customerPhone;
  const userId = await getOptionalUserId(supabaseAdmin);
  const tenantId = await resolveCurrentTenant(supabaseAdmin, { userId });

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .select("id, status")
    .eq("id", tenantId)
    .maybeSingle();

  if (tenantError || !tenant || tenant.status !== "active") {
    throw new Error("The storefront tenant is unavailable.");
  }

  const shopifyVariantIds = data.items.flatMap((item) =>
    item.productRef.source === "shopify" ? [item.productRef.id] : [],
  );
  let shopifyProductIds = new Map<string, string>();
  if (shopifyVariantIds.length > 0) {
    const resolver = await import("@/lib/shopify/yemen-checkout.server");
    shopifyProductIds = options.readOnlyShopifyCatalog
      ? await resolver.resolveExistingShopifyVariantsForYemenCheckout(
          supabaseAdmin,
          tenantId,
          shopifyVariantIds,
        )
      : await resolver.resolveShopifyVariantsForYemenCheckout(
          supabaseAdmin,
          tenantId,
          shopifyVariantIds,
        );
  }
  const resolvedItems = data.items.map((item) => ({
    ...item,
    productRef:
      item.productRef.source === "shopify"
        ? ({ source: "supabase", id: shopifyProductIds.get(item.productRef.id) ?? "" } as const)
        : item.productRef,
  }));

  const productIds = requireSupabaseCheckoutProductIds(
    resolvedItems.map((item) => item.productRef),
  );
  const { data: catalogRows, error: catalogError } = await supabaseAdmin
    .from("products")
    .select("id, tenant_id, is_published")
    .in("id", Array.from(new Set(productIds)))
    .eq("tenant_id", tenantId)
    .eq("is_published", true);

  if (catalogError) {
    console.error("[createOrder] Tenant product validation failed:", catalogError);
    throw new Error("Unable to validate the checkout products.");
  }

  validateTenantCheckoutProducts(
    tenantId,
    resolvedItems.map((item) => item.productRef),
    catalogRows ?? [],
  );

  const rpcItems = resolvedItems.map((item) => ({
    source: item.productRef.source,
    id: item.productRef.id,
    quantity: item.quantity,
  }));

  const { data: committed, error: commitError } = await supabaseAdmin.rpc(
    "create_checkout_order_v2",
    {
      _tenant_id: tenantId,
      _user_id: userId,
      _customer_name: data.customerName,
      _customer_phone: customerPhone,
      _customer_address: data.customerAddress,
      _customer_email: data.customerEmail ?? null,
      _notes: data.notes ?? null,
      _coupon_code: data.couponCode ?? null,
      _expected_total: data.expectedTotal ?? null,
      _payment_provider: data.paymentProvider ?? null,
      _idempotency_key: data.idempotencyKey ?? null,
      _items: rpcItems,
    },
  );

  if (commitError) {
    console.error("[createOrder] Atomic checkout failed:", commitError);
  }
  const result = assertCheckoutCommit(committed, commitError, data.items.length);

  try {
    // Vendor splitting is optional and must not block the core checkout.
    const { data: vendorRows, error: vendorError } = await supabaseAdmin
      .from("products")
      .select("id, vendor_id")
      .in("id", Array.from(new Set(productIds)))
      .eq("tenant_id", tenantId);
    if (vendorError) {
      throw new Error("Optional vendor assignments are unavailable.");
    }
    const { data: insertedItems } = await supabaseAdmin
      .from("order_items")
      .select("id, order_id, product_id, quantity, unit_price, total_price")
      .eq("order_id", result.orderId)
      .eq("tenant_id", tenantId);
    const vendorByProduct = new Map(
      (vendorRows ?? []).map((row) => [row.id, row.vendor_id ?? null]),
    );
    const { splitOrderIntoVendorOrders } = await import("@/lib/services/vendor-order.service");
    await splitOrderIntoVendorOrders(supabaseAdmin, {
      tenantId,
      orderId: result.orderId,
      items: (insertedItems ?? []).map((item) => ({
        ...item,
        vendor_id: vendorByProduct.get(item.product_id) ?? null,
      })),
    });
  } catch (splitError) {
    console.warn("[createOrder] multi-vendor order split notice:", splitError);
  }

  return result;
}
