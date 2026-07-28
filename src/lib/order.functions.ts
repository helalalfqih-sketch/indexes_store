import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveCurrentTenant } from "@/lib/saas/tenant-resolver";
import {
  getMyOrders as getMyOrdersFromDb,
  getMyOrderDetails as getMyOrderDetailsFromDb,
  trackOrder as trackOrderFromDb,
  type MyOrderSummary,
  type MyOrderDetails,
} from "@/lib/services/order-history.service";
import { normalizeOrderNumber } from "@/lib/order-status";

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
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(999),
      }),
    )
    .min(1)
    .max(100),
  customerName: z.string().trim().max(200).optional(),
  customerPhone: z.string().trim().min(3).max(40),
  customerAddress: z.string().trim().max(500).optional(),
  customerEmail: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().trim().email().max(200).optional(),
  ),
  notes: z.string().trim().max(1000).optional(),
  couponCode: z.string().trim().max(60).optional(),
  discountAmount: z.number().min(0).optional(),
  paymentProvider: z.string().trim().max(60).optional(),
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
  auth: { getUser: (jwt: string) => Promise<{ data: { user: { id: string } | null }; error: unknown }> };
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Verified user id from the token (or null → guest). Never from the client.
    const userId = await getOptionalUserId(supabaseAdmin as any);

    // 2. Resolve the storefront tenant server-side.
    const tenantId = await resolveCurrentTenant(supabaseAdmin as any, { userId });

    // SECURITY (F3): the resolved tenant id can originate from client-controlled
    // headers (x-tenant-id / x-tenant-slug). Verify it references a real, ACTIVE
    // tenant before creating anything under it with the service role.
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from("tenants")
      .select("id, status")
      .eq("id", tenantId)
      .maybeSingle();
    if (tenantErr || !tenant || tenant.status !== "active") {
      throw new Error("المتجر غير متاح حالياً.");
    }

    // 3. Load the requested products for THIS tenant, published only. Price is
    //    authoritative from the DB — the client never sets prices.
    const productIds = Array.from(new Set(data.items.map((i) => i.productId)));
    const { data: products, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, name, price, currency, sku, is_published, tenant_id, vendor_id, stock")
      .in("id", productIds)
      .eq("tenant_id", tenantId)
      .eq("is_published", true);

    if (prodErr) throw new Error("تعذّر تحميل المنتجات المطلوبة.");

    const byId = new Map(
      ((products ?? []) as Array<{
        id: string;
        name: string;
        price: number;
        currency: string | null;
        sku: string | null;
        vendor_id: string | null;
        stock: number | null;
      }>).map((p) => [p.id, p]),
    );

    const missing = productIds.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      throw new Error("بعض المنتجات غير متاحة حالياً.");
    }

    // 4. Use Atomic RPC to handle stock validation, reduction, and order creation in one transaction.
    const itemsPayload = data.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    
    const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc("create_order_transaction", {
      _tenant_id: tenantId,
      _customer_name: data.customerName ?? null,
      _customer_phone: data.customerPhone,
      _customer_address: data.customerAddress ?? null,
      _customer_email: data.customerEmail ?? null,
      _notes: data.notes ?? null,
      _coupon_code: data.couponCode ?? null,
      _discount_amount: 0, // Force 0 discount until backend validation is supported
      _payment_provider: data.paymentProvider ?? null,
      _items: JSON.stringify(itemsPayload)
    });

    if (rpcErr || !rpcData) {
      console.error("[createOrder] RPC Error:", rpcErr);
      throw new Error("تعذّر إنشاء الطلب بسبب خطأ في الخادم.");
    }

    const { orderId, total, currency, itemsCount, insertedItems } = rpcData as unknown as any;

    // 6b. Multi-Vendor Sub-Orders splitting (best-effort)
    try {
      const { splitOrderIntoVendorOrders } = await import("@/lib/services/vendor-order.service");
      const orderItemsWithVendor = insertedItems.map((item: any) => ({
        ...item,
        order_id: orderId,
        tenant_id: tenantId
      }));

      if (orderItemsWithVendor.length > 0) {
        await splitOrderIntoVendorOrders(supabaseAdmin as any, {
          tenantId,
          orderId: orderId,
          items: orderItemsWithVendor,
        });
      }
    } catch (splitEx) {
      console.warn("[createOrder] multi-vendor order split notice:", splitEx);
    }

    return { orderId, total, currency, itemsCount };
  });

/**
 * List the signed-in customer's orders (Phase 4 + Phase 5).
 */
export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyOrderSummary[]> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
    return getMyOrdersFromDb(supabase, userId);
  });

/**
 * Details for one of the caller's own orders (Phase 4 + Phase 5).
 */
export const getMyOrderDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ orderId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }): Promise<MyOrderDetails | null> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
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
        phoneLast4: z.string().trim().regex(/^\d{4}$/, "أدخل آخر 4 أرقام من هاتفك"),
      })
      .parse(raw),
  )
  .handler(async ({ data }): Promise<MyOrderDetails | null> => {
    const normalized = normalizeOrderNumber(data.orderNumber);
    if (!normalized) return null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return trackOrderFromDb(supabaseAdmin as any, normalized, data.phoneLast4);
  });
