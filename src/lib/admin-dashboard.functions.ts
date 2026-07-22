/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { countPendingDrafts } from "@/lib/services/storefront.service";

/**
 * Admin dashboard statistics — REAL numbers from the database (replacing the
 * previous hardcoded demo values). Runs with the caller's RLS-scoped client:
 * staff/admin see their tenant's orders via can_manage_tenant policies; a
 * non-staff caller simply gets zeros. The AdminGate shell is the UI gate.
 */

export interface DashboardInsight {
  text: string;
  to: string;
  tone: "warning" | "info" | "success";
}

export interface AdminDashboardStats {
  revenue7d: number;
  revenuePrev7d: number;
  orders7d: number;
  ordersPrev7d: number;
  totalOrders: number;
  pendingOrders: number;
  customersCount: number;
  productsCount: number;
  publishedCount: number;
  lowStock: Array<{ id: string; name: string; stock: number }>;
  metaUnsyncedCount: number;
  cmsDraftCount: number;
  /** Revenue per day for the last 12 days (oldest → newest), excludes cancelled/refunded. */
  dailyRevenue: number[];
  currency: string;
}

const DAY = 86400000;

export const getAdminDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminDashboardStats> => {
    const { supabase } = context as unknown as { supabase: any };

    // Orders (RLS-scoped). Small store — computing aggregates in the fn is fine.
    const { data: orderRows } = await supabase
      .from("orders")
      .select("total, status, currency, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);

    const orders = (orderRows ?? []) as Array<{
      total: number;
      status: string;
      currency: string | null;
      created_at: string;
    }>;

    const isActive = (o: { status: string }) => o.status !== "cancelled" && o.status !== "refunded";
    const now = Date.now();

    let revenue7d = 0;
    let revenuePrev7d = 0;
    let orders7d = 0;
    let ordersPrev7d = 0;
    let pendingOrders = 0;
    const dailyRevenue = new Array(12).fill(0) as number[];
    let currency = "YER";

    for (const o of orders) {
      const t = new Date(o.created_at).getTime();
      const age = now - t;
      if (o.currency) currency = o.currency;
      if (o.status === "pending") pendingOrders++;
      if (!isActive(o)) continue;
      const total = Number(o.total ?? 0);
      if (age <= 7 * DAY) {
        revenue7d += total;
        orders7d++;
      } else if (age <= 14 * DAY) {
        revenuePrev7d += total;
        ordersPrev7d++;
      }
      const dayIdx = Math.floor(age / DAY);
      if (dayIdx >= 0 && dayIdx < 12) {
        dailyRevenue[11 - dayIdx] += total;
      }
    }

    // Customers (profiles) — readable by platform admins per RLS.
    const { count: customersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Products stats.
    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });
    const { count: publishedCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true);
    const { count: metaUnsyncedCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .neq("meta_sync_status", "synced");

    const { data: lowStockRows } = await supabase
      .from("products")
      .select("id, name, stock")
      .eq("is_published", true)
      .lte("stock", 5)
      .order("stock", { ascending: true })
      .limit(5);

    // Pending CMS drafts — via the unified storefront service layer.
    const cmsDraftCount = await countPendingDrafts(supabase);

    return {
      revenue7d,
      revenuePrev7d,
      orders7d,
      ordersPrev7d,
      totalOrders: orders.length,
      pendingOrders,
      customersCount: customersCount ?? 0,
      productsCount: productsCount ?? 0,
      publishedCount: publishedCount ?? 0,
      lowStock: (lowStockRows ?? []) as Array<{ id: string; name: string; stock: number }>,
      metaUnsyncedCount: metaUnsyncedCount ?? 0,
      cmsDraftCount: cmsDraftCount ?? 0,
      dailyRevenue,
      currency,
    };
  });
