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
      .select("id, name, price, currency, sku, is_published, tenant_id, vendor_id")
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
      }>).map((p) => [p.id, p]),
    );

    const missing = productIds.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      throw new Error("بعض المنتجات غير متاحة حالياً.");
    }

    // 4. Build line items + totals from DB values.
    let currency = "YER";
    let subtotal = 0;
    const itemRows = data.items.map((i) => {
      const p = byId.get(i.productId)!;
      currency = p.currency ?? currency;
      const unitPrice = Number(p.price ?? 0);
      const lineTotal = unitPrice * i.quantity;
      subtotal += lineTotal;
      return {
        tenant_id: tenantId,
        product_id: p.id,
        quantity: i.quantity,
        unit_price: unitPrice,
        total_price: lineTotal,
        product_name_snapshot: p.name,
        product_sku_snapshot: p.sku ?? null,
        vendor_id: p.vendor_id ?? null,
      };
    });

    // SECURITY (F1): never trust a client-provided discount. The client may
    // send any value (including the full subtotal). Until a server-side coupon
    // service exists, the applied discount is ALWAYS 0; `couponCode` is stored
    // as metadata only and grants nothing.
    const validatedDiscount = 0;
    const total = Math.max(0, subtotal - validatedDiscount);

    // 5. Insert the order (service role). user_id is our verified value or null.
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        customer_name: data.customerName ?? null,
        customer_phone: data.customerPhone,
        customer_address: data.customerAddress ?? null,
        customer_email: data.customerEmail ?? null,
        notes: data.notes ?? null,
        status: "pending",
        payment_status: "pending",
        payment_provider: data.paymentProvider ?? null,
        total,
        currency,
        coupon_code: data.couponCode ?? null,
        discount_amount: validatedDiscount,
      })
      .select("id")
      .single();

    if (orderErr || !order) throw new Error("تعذّر إنشاء الطلب.");

    // 6. Insert order items.
    const { data: insertedItems, error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .insert(itemRows.map(({ vendor_id, ...r }) => ({ ...r, order_id: order.id })))
      .select("id, order_id, product_id, quantity, unit_price, total_price");

    if (itemsErr || !insertedItems) {
      // Best-effort cleanup so we don't leave an order with no items.
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error("تعذّر حفظ عناصر الطلب.");
    }

    // 6b. Multi-Vendor Sub-Orders splitting (best-effort)
    try {
      const { splitOrderIntoVendorOrders } = await import("@/lib/services/vendor-order.service");
      const orderItemsWithVendor = insertedItems.map((item) => {
        const matchingRow = itemRows.find((r) => r.product_id === item.product_id);
        return {
          ...item,
          vendor_id: matchingRow?.vendor_id ?? null,
        };
      });

      await splitOrderIntoVendorOrders(supabaseAdmin as any, {
        tenantId,
        orderId: order.id,
        items: orderItemsWithVendor,
      });
    } catch (splitEx) {
      console.warn("[createOrder] multi-vendor order split notice:", splitEx);
    }

    // 7. Initial audit entry (Task 4) — best-effort: never fails the order.
    try {
      const { error: histErr } = await supabaseAdmin.from("order_status_history").insert({
        order_id: order.id,
        tenant_id: tenantId,
        from_status: null,
        to_status: "pending",
        changed_by: userId,
        note: "Order created via checkout",
      });
      if (histErr) console.warn("[createOrder] status history notice:", histErr.message);
    } catch (histEx) {
      console.warn("[createOrder] status history skipped:", histEx);
    }

    return { orderId: order.id, total, currency, itemsCount: itemRows.length };
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
