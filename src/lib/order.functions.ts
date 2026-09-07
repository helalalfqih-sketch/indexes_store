import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveCurrentTenant } from "@/lib/saas/tenant-resolver";
import { normalizeYemeniPhone } from "@/lib/shipping";
import {
  assertCheckoutCommit,
  checkoutProductRefSchema,
  requireSupabaseCheckoutProductIds,
  validateTenantCheckoutProducts,
} from "@/lib/checkout-product-contract";
import {
  getMyOrders as getMyOrdersFromDb,
  getMyOrderDetails as getMyOrderDetailsFromDb,
  trackOrder as trackOrderFromDb,
  type MyOrderSummary,
  type MyOrderDetails,
} from "@/lib/services/order-history.service";
import { normalizeOrderNumber } from "@/lib/order-status";
import { yemeniPhoneSchema } from "@/lib/validation/phone";
import type { SupabaseAdminClient } from "@/integrations/supabase/client.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Order server functions — the AUTH BOUNDARY for orders (spec Phase 5).
 *
 *  - createOrder:        creates orders for guests OR authenticated customers.
 *                        user_id is derived SERVER-SIDE from the verified bearer
 *                        token — never from the client payload. Prices/totals are
 *                        recomputed from the DB, never trusted from the client.
 *  - getMyOrders:        signed-in customer's own orders (RLS-scoped client).
 *  - getMyOrderDetails:  one of the caller's own orders (RLS-scoped client).
 *  - getTrackedOrder:    public tracking lookup (order number + phone last-4)
 *                        via the service role with explicit ownership checks
 *                        (NOT open RLS); response carries no PII.
 *
 * The service-role client is imported dynamically INSIDE handlers so it never
 * reaches the browser bundle.
 */

// ---------- validation ----------

const createOrderInput = z.object({
  items: z
    .array(
      z.object({
        productRef: checkoutProductRefSchema,
        quantity: z.number().int().min(1).max(999),
      }),
    )
    .min(1)
    .max(100),
  customerName: z.string().trim().min(2, "الاسم مطلوب (حرفان على الأقل)").max(200),
  customerPhone: yemeniPhoneSchema,
  customerAddress: z.string().trim().min(3, "العنوان مطلوب").max(500),
  customerEmail: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().trim().email().max(200).optional(),
  ),
  notes: z.string().trim().max(1000).optional(),
  couponCode: z.string().trim().max(60).optional(),
  // discountAmount is NEVER accepted from the client — computed server-side.
  expectedTotal: z.number().nonnegative().optional(),
  paymentProvider: z.string().trim().max(60).optional(),
  /** Client-generated UUID to prevent duplicate order creation. */
  idempotencyKey: z.string().uuid().optional(),
});
export type CreateOrderPayload = z.infer<typeof createOrderInput>;

export interface CreateOrderResult {
  orderId: string;
  total: number;
  currency: string;
  itemsCount: number;
}

// ---------- helpers ----------

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

// ---------- server functions ----------

/**
 * Create an order (guest or authenticated). Phase 2 + Phase 5.
 */
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => createOrderInput.parse(raw))
  .handler(async ({ data }): Promise<CreateOrderResult> => {
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

    const productIds = requireSupabaseCheckoutProductIds(
      data.items.map((item) => item.productRef),
    );
    const { data: catalogRows, error: catalogError } = await supabaseAdmin
      .from("products")
      .select("id, tenant_id, is_published, vendor_id")
      .in("id", Array.from(new Set(productIds)))
      .eq("tenant_id", tenantId)
      .eq("is_published", true);

    if (catalogError) {
      console.error("[createOrder] Tenant product validation failed:", catalogError);
      throw new Error("Unable to validate the checkout products.");
    }

    validateTenantCheckoutProducts(
      tenantId,
      data.items.map((item) => item.productRef),
      catalogRows ?? [],
    );

    const rpcItems = data.items.map((item) => ({
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
      const { data: insertedItems } = await supabaseAdmin
        .from("order_items")
        .select("id, order_id, product_id, quantity, unit_price, total_price")
        .eq("order_id", result.orderId)
        .eq("tenant_id", tenantId);
      const vendorByProduct = new Map(
        (catalogRows ?? []).map((row) => [row.id, row.vendor_id ?? null]),
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
  });

/**
 * List the signed-in customer's orders (Phase 4 + Phase 5).
 */
export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyOrderSummary[]> => {
    const { supabase, userId } = context as unknown as {
      supabase: SupabaseClient<Database>;
      userId: string;
    };
    return getMyOrdersFromDb(supabase, userId);
  });

/**
 * Details for one of the caller's own orders (Phase 4 + Phase 5).
 */
export const getMyOrderDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ orderId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }): Promise<MyOrderDetails | null> => {
    const { supabase, userId } = context as unknown as {
      supabase: SupabaseClient<Database>;
      userId: string;
    };
    return getMyOrderDetailsFromDb(supabase, userId, data.orderId);
  });

/**
 * Public tracking lookup: order number (ORD-XXXXXXXX / 8 hex / full uuid) +
 * last 4 digits of the customer phone. Service-role read with explicit
 * ownership checks inside the service — never an open RLS policy. The
 * response never contains name / email / address / full phone / tenant data.
 */
export const getTrackedOrder = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        orderNumber: z.string().trim().min(8).max(45),
        phoneLast4: z
          .string()
          .trim()
          .regex(/^\d{4}$/, "أدخل آخر 4 أرقام من هاتفك"),
      })
      .parse(raw),
  )
  .handler(async ({ data }): Promise<MyOrderDetails | null> => {
    const normalized = normalizeOrderNumber(data.orderNumber);
    if (!normalized) return null;
    const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin = getSupabaseAdmin();
    return trackOrderFromDb(supabaseAdmin, normalized, data.phoneLast4);
  });
