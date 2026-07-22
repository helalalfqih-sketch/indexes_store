import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, TrendingUp, Trophy } from "lucide-react";
import { getAdminDashboardStats, type AdminDashboardStats } from "@/lib/admin-dashboard.functions";
import { getStoreTopProducts } from "@/lib/store-dashboard.functions";
import { formatPrice } from "@/lib/store-data";

export const Route = createFileRoute("/store/analytics")({
  component: StoreAnalyticsPage,
});

function StoreAnalyticsPage() {
  const fetchStats = useServerFn(getAdminDashboardStats);
  const fetchTop = useServerFn(getStoreTopProducts);

  const statsQ = useQuery({ queryKey: ["store-analytics-stats"], queryFn: () => fetchStats() });
  const topQ = useQuery({ queryKey: ["store-top-products"], queryFn: () => fetchTop() });

  const s = statsQ.data as AdminDashboardStats | undefined;
  const daily = s?.dailyRevenue ?? [];
  const max = Math.max(...daily, 0);
  const top = topQ.data ?? [];
  const topMax = Math.max(...top.map((t) => t.revenue), 0);

  const conversionHint =
    s && s.customersCount > 0 ? `${((s.totalOrders / Math.max(1, s.customersCount)) * 100).toFixed(0)}% طلب/عميل مسجَّل` : "—";

  return (
    <div className="space-y-5">
      <h1 className="flex items-center gap-2 text-2xl font-black">
        <BarChart3 className="h-6 w-6 text-primary" /> التحليلات
      </h1>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "إجمالي الطلبات", value: s ? String(s.totalOrders) : "…" },
          { label: "إيرادات 7 أيام", value: s ? formatPrice(s.revenue7d) : "…" },
          { label: "العملاء المسجَّلون", value: s ? String(s.customersCount) : "…" },
          { label: "معدل الطلب لكل عميل", value: conversionHint },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl glass p-4 text-center">
            <p className="text-[11px] text-muted-foreground">{k.label}</p>
            <p className="mt-1 truncate text-lg font-black">{k.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl glass p-5">
        <h2 className="flex items-center gap-2 text-sm font-black">
          <TrendingUp className="h-4 w-4 text-primary" /> الإيرادات اليومية (آخر 12 يوماً)
        </h2>
        {statsQ.isLoading ? (
          <div className="mt-4 h-40 animate-pulse rounded-xl bg-accent/50" />
        ) : max === 0 ? (
          <div className="mt-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
            لا بيانات بعد
          </div>
        ) : (
          <div className="mt-4 flex h-40 items-end gap-1.5">
            {daily.map((v, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-primary to-primary-light" style={{ height: `${Math.max(4, (v / max) * 100)}%` }} title={formatPrice(v)} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl glass p-5 space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-black">
          <Trophy className="h-4 w-4 text-amber-500" /> المنتجات الأكثر مبيعاً
        </h2>
        {topQ.isLoading ? (
          <div className="h-32 animate-pulse rounded-xl bg-accent/50" />
        ) : top.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">لا مبيعات بعد</p>
        ) : (
          <div className="space-y-2">
            {top.map((t, i) => (
              <div key={t.product_id} className="flex items-center gap-3 text-xs">
                <span className="w-5 text-center font-black text-muted-foreground">{i + 1}</span>
                <span className="w-40 truncate font-bold sm:w-56">{t.name}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-l from-primary to-primary-light" style={{ width: `${topMax ? Math.max(4, (t.revenue / topMax) * 100) : 0}%` }} />
                </div>
                <span className="w-24 text-end font-black text-primary">{formatPrice(t.revenue)}</span>
                <span className="hidden w-14 text-end text-muted-foreground sm:block">{t.quantity} قطعة</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
