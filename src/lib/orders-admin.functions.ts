import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getOrderDetailsForStaff,
  type StaffOrderDetails,
} from "@/lib/services/order-history.service";
import {
  ORDER_STATUS_TRANSITIONS,
  ORDER_STATUS_LABELS_AR,
  normalizeOrderNumber,
} from "@/lib/order-status";
import type { Database } from "@/integrations/supabase/types";

/**
 * Admin/staff order-management server functions.
 *
 * Authorization model: every function runs with the caller's RLS-SCOPED client
 * (requireSupabaseAuth). The database policies are the security boundary:
 *   - SELECT/UPDATE on orders  → can_manage_tenant(tenant_id, auth.uid())
 *   - INSERT on order_status_history → staff-only policy
 * No service role is used here — a non-staff caller simply sees zero rows.
 */

type OrderStatus = Database["public"]["Enums"]["order_status"];

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

const statusEnum = z.enum(ORDER_STATUSES);

export interface TenantOrderRow {
  id: string;
  created_at: string;
  status: OrderStatus;
  payment_status: Database["public"]["Enums"]["payment_status"];
  total: number;
  currency: string;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
}

export interface TenantOrdersPage {
  rows: TenantOrderRow[];
  count: number;
  limit: number;
  offset: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const listInput = z
  .object({
    status: statusEnum.optional(),
    search: z.string().trim().max(120).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
  })
  .optional();

/** List orders the caller may manage (RLS-scoped), newest first. */
export const listTenantOrders = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => listInput.parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<TenantOrdersPage> => {
    const { supabase } = context as unknown as { supabase: any };
    const limit = data?.limit ?? 20;
    const offset = data?.offset ?? 0;

    let q = supabase
      .from("orders")
      .select(
        "id, created_at, status, payment_status, total, currency, customer_name, customer_phone, notes",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (data?.status) q = q.eq("status", data.status);
    if (data?.search) {
      const s = data.search;
      const orderNumber = normalizeOrderNumber(s);
      if (UUID_RE.test(s)) {
        q = q.eq("id", s);
      } else if (orderNumber) {
        q = q.eq("order_number", orderNumber);
      } else {
        const like = `%${s.replace(/[%_]/g, "")}%`;
        q = q.or(`customer_phone.ilike.${like},customer_name.ilike.${like}`);
      }
    }

    const { data: rows, error, count } = await q;
    if (error) throw new Error("تعذّر تحميل الطلبات.");
    return { rows: (rows ?? []) as TenantOrderRow[], count: count ?? 0, limit, offset };
  });

/** Full order details for staff (items + timeline + customer contact). */
export const getTenantOrderDetails = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ orderId: z.string().uuid() }).parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<StaffOrderDetails | null> => {
    const { supabase } = context as unknown as { supabase: any };
    return getOrderDetailsForStaff(supabase, data.orderId);
  });

/**
 * Change an order's status and append an audit entry to order_status_history.
 * Both writes run under the caller's RLS (staff policies) — no service role.
 */
export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        toStatus: statusEnum,
        note: z.string().trim().max(500).optional(),
      })
      .parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      data,
      context,
    }): Promise<{ ok: true; from: OrderStatus; to: OrderStatus }> => {
      const { supabase, userId } = context as unknown as { supabase: any; userId: string };

      // Read under RLS: proves the caller can manage this order's tenant.
      const { data: order, error: readErr } = await supabase
        .from("orders")
        .select("id, status, tenant_id, total, currency")
        .eq("id", data.orderId)
        .maybeSingle();
      if (readErr || !order) {
        throw new Error("الطلب غير موجود أو لا تملك صلاحية إدارته.");
      }

      const fromStatus = order.status as OrderStatus;
      if (fromStatus === data.toStatus) {
        return { ok: true, from: fromStatus, to: data.toStatus };
      }

      // Enforce the allowed status flow (e.g. never delivered → processing,
      // never cancelled → any active state). UI mirrors this map, but the
      // server is the authority.
      const allowed = ORDER_STATUS_TRANSITIONS[fromStatus] ?? [];
      if (!allowed.includes(data.toStatus)) {
        throw new Error(
          `انتقال غير مسموح: من "${ORDER_STATUS_LABELS_AR[fromStatus]}" إلى "${ORDER_STATUS_LABELS_AR[data.toStatus]}".`,
        );
      }

      const { error: updErr } = await supabase
        .from("orders")
        .update({ status: data.toStatus })
        .eq("id", data.orderId);
      if (updErr) throw new Error("تعذّر تحديث حالة الطلب.");

      const { error: histErr } = await supabase.from("order_status_history").insert({
        order_id: data.orderId,
        tenant_id: order.tenant_id,
        from_status: fromStatus,
        to_status: data.toStatus,
        changed_by: userId,
        note: data.note ?? null,
      });
      if (histErr) {
        console.warn("[updateOrderStatus] history notice:", histErr.message);
      }

      // P4 — financial ledger hooks (best-effort, idempotent, service role;
      // ledger has NO client INSERT policy so this is the only write path).
      // A failure here never fails the status change.
      if (data.toStatus === "delivered" || data.toStatus === "refunded") {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const fin = await import("@/lib/services/store-financial.service");
          const orderRow = {
            id: order.id,
            tenant_id: order.tenant_id,
            total: Number(order.total ?? 0),
            currency: order.currency ?? "YER",
          };
          if (data.toStatus === "delivered") {
            await fin.recordOrderIncome(supabaseAdmin as any, orderRow);
          } else {
            await fin.recordOrderRefund(supabaseAdmin as any, orderRow);
          }
        } catch (finErr) {
          console.warn("[updateOrderStatus] financial ledger notice:", finErr);
        }
      }

      return { ok: true, from: fromStatus, to: data.toStatus };
    },
  );
