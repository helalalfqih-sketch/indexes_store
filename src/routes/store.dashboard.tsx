import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DollarSign, ShoppingBag, Users, Package, AlertTriangle, Sparkles } from "lucide-react";
import { getAdminDashboardStats, type AdminDashboardStats } from "@/lib/admin-dashboard.functions";
import { useStoreContext } from "@/components/store/store-shell";
import { formatPrice } from "@/lib/store-data";

export const Route = createFileRoute("/store/dashboard")({
  component: StoreDashboardPage,
});

function StoreDashboardPage() {
  const { store } = useStoreContext();
  // RLS-scoped stats: for a store member this returns THEIR tenant's numbers.
  const fetchStats = useServerFn(getAdminDashboardStats);
  const statsQ = useQuery({
    queryKey: ["store-dashboard-stats"],
    queryFn: () => fetchStats(),
    refetchInterval: 60_000,
  });
  const s = statsQ.data as AdminDashboardStats | undefined;

  const cards = [
    { label: "إيرادات 7 أيام", value: s ? formatPrice(s.revenue7d) : "…", icon: DollarSign },
    { label: "طلبات 7 أيام", value: s ? String(s.orders7d) : "…", icon: ShoppingBag },
    { label: "عملاء مسجَّلون", value: s ? String(s.customersCount) : "…", icon: Users },
    { label: "المنتجات", value: s ? `${s.productsCount} (${s.publishedCount} منشور)` : "…", icon: Package },
    { label: "مخزون منخفض", value: s ? String(s.lowStock.length) : "…", icon: AlertTriangle },
  ];

  const insights: Array<{ text: string; to: string }> = [];
  if (s) {
    if (s.pendingOrders > 0) insights.push({ text: `📦 ${s.pendingOrders} طلب بانتظار التأكيد.`, to: "/store/orders" });
    if (s.lowStock.length > 0)
      insights.push({
        text: `⚠️ مخزون منخفض: ${s.lowStock.slice(0, 3).map((p) => p.name).join("، ")}${s.lowStock.length > 3 ? "…" : ""}`,
        to: "/store/inventory",
      });
    if (s.metaUnsyncedCount > 0) insights.push({ text: `🔄 ${s.metaUnsyncedCount} منتجاً غير متزامن مع Meta.`, to: "/store/products" });
    if (insights.length === 0) insights.push({ text: "✨ كل شيء على ما يرام — لا تنبيهات.", to: "/store/dashboard" });
  }

  const daily = s?.dailyRevenue ?? [];
  const max = Math.max(...daily, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black lg:text-3xl">مرحباً بك في {store.profile?.display_name || store.name} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">نظرة سريعة على أداء متجرك</p>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {statsQ.isLoading
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl glass" />)
          : cards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="rounded-2xl glass p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-muted-foreground">{c.label}</p>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-2 truncate text-lg font-black">{c.value}</p>
                </div>
              );
            })}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl glass p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black">المبيعات اليومية</h2>
            <span className="text-xs text-muted-foreground">آخر 12 يوماً</span>
          </div>
          {statsQ.isLoading ? (
            <div className="mt-4 h-40 animate-pulse rounded-xl bg-accent/50" />
          ) : max === 0 ? (
            <div className="mt-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              لا مبيعات بعد — ستظهر الأعمدة مع أول الطلبات 📈
            </div>
          ) : (
            <div className="mt-4 flex h-40 items-end gap-1.5">
              {daily.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-primary to-primary-light"
                  style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
                  title={formatPrice(v)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl glass p-5">
          <h2 className="text-sm font-black">رؤى ذكية</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {statsQ.isLoading
              ? Array.from({ length: 3 }).map((_, i) => <li key={i} className="h-10 animate-pulse rounded-xl bg-accent/50" />)
              : insights.map((tip, i) => (
                  <li key={i}>
                    <Link to={tip.to} className="flex items-start gap-2 rounded-xl bg-accent/50 p-2.5 transition hover:bg-accent">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{tip.text}</span>
                    </Link>
                  </li>
                ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
