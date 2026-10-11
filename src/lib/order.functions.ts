import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createOrderInput, type CreateOrderResult } from "@/lib/order-input";
export type { CreateOrderPayload, CreateOrderResult } from "@/lib/order-input";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getMyOrders as getMyOrdersFromDb,
  getMyOrderDetails as getMyOrderDetailsFromDb,
  trackOrder as trackOrderFromDb,
  type MyOrderSummary,
  type MyOrderDetails,
} from "@/lib/services/order-history.service";
import { normalizeOrderNumber } from "@/lib/order-status";
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
 * The order commit is isolated in a server-only module; no service-role
 * operations are included in the browser checkout bundle.
 */

// ---------- validation ----------

// ---------- server functions ----------

/**
 * Create an order (guest or authenticated). Phase 2 + Phase 5.
 */
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => createOrderInput.parse(raw))
  .handler(async ({ data }): Promise<CreateOrderResult> => {
    // This public server function remains callable by legacy clients. Once
    // Shopify Draft Order handoff is enabled, only the trusted API endpoint
    // may commit an order; never accept an alternate Supabase-only path.
    if (process.env.SHOPIFY_DRAFT_ORDER_WRITES_ENABLED === "true") {
      throw new Error("SHOPIFY_DRAFT_ORDER_GATEWAY_REQUIRED");
    }
    const { commitCheckoutOrder } = await import("@/lib/order-commit.server");
    return commitCheckoutOrder(data);
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
