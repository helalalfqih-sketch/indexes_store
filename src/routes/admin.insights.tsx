import { createFileRoute } from "@tanstack/react-router";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingBag,
  Search,
  Star,
  Loader2,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listAdminProducts } from "@/lib/actions/admin.actions";
import { getAdminDashboardStats, type AdminDashboardStats } from "@/lib/admin-dashboard.functions";
import { formatPrice } from "@/lib/store-data";

export const Route = createFileRoute("/admin/insights")({
  component: InsightsPage,
});

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function InsightsPage() {
  const productsQ = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listAdminProducts(),
  });
  const statsQ = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => getAdminDashboardStats(),
    refetchInterval: 60_000,
  });

  const products = (productsQ.data ?? []) as Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    rating?: number;
    is_published: boolean;
    old_price?: number | null;
    is_deal?: boolean;
    badge?: string | null;
    images?: string[];
  }>;

  const s = statsQ.data as AdminDashboardStats | undefined;

  const lowStock = products.filter((p) => (p.stock ?? 0) < 5 && p.is_published).slice(0, 10);
  const dealsActive = products.filter((p) => p.is_deal).slice(0, 10);
  const noImage = products.filter((p) => !p.images?.[0]).slice(0, 8);
  const noBadge = products.filter((p) => p.is_published && !p.badge).length;
  const topRated = [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 5);
  const maxPrice = Math.max(...products.map((p) => p.price ?? 0), 1);

  const isLoading = productsQ.isLoading || statsQ.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          رؤى الذكاء الاصطناعي
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          تحليل أداء المتجر وتوصيات التحسين
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI Cards */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                label: "إيرادات 7 أيام",
                value: s ? formatPrice(s.revenue7d) : "—",
                icon: TrendingUp,
                color: "text-success",
                bg: "bg-success/10",
              },
              {
                label: "الطلبات المعلقة",
                value: String(s?.pendingOrders ?? 0),
                icon: ShoppingBag,
                color: "text-warning",
                bg: "bg-warning/10",
              },
              {
                label: "منتجات بمخزون منخفض",
                value: String(lowStock.length),
                icon: AlertTriangle,
                color: "text-destructive",
                bg: "bg-destructive/10",
              },
              {
                label: "عروض نشطة",
                value: String(dealsActive.length),
                icon: Star,
                color: "text-primary",
                bg: "bg-primary/10",
              },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-2xl border border-border bg-surface p-4">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bg} mb-3`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
                <div className="text-xs text-muted-foreground">{kpi.label}</div>
              </div>
            ))}
          </section>

          {/* Low Stock Alert */}
          {lowStock.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                تحذير: منتجات بمخزون منخفض ({lowStock.length})
              </h2>
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 divide-y divide-border/50">
                {lowStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm font-medium truncate max-w-[60%]">{p.name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.stock <= 0 ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`}>
                      {p.stock <= 0 ? "نفد المخزون" : `${p.stock} قطعة`}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Top Rated Products */}
          <section>
            <h2 className="mb-3 text-sm font-bold flex items-center gap-2">
              <Star className="h-4 w-4 text-warning" />
              أعلى المنتجات تقييماً
            </h2>
            <div className="rounded-2xl border border-border bg-surface divide-y divide-border/50">
              {topRated.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs font-black text-muted-foreground w-5">#{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 fill-warning stroke-warning" />
                      <span className="text-xs font-bold">{p.rating ?? 5}</span>
                    </div>
                  </div>
                  <MiniBar value={p.price} max={maxPrice} />
                  <span className="text-xs font-bold text-primary shrink-0">{formatPrice(p.price)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* AI Recommendations */}
          <section>
            <h2 className="mb-3 text-sm font-bold flex items-center gap-2 text-primary">
              <Brain className="h-4 w-4" />
              توصيات الذكاء الاصطناعي
            </h2>
            <div className="space-y-2">
              {[
                noImage.length > 0 && {
                  type: "warning",
                  text: `${noImage.length} منتج بدون صور — أضف صوراً لتحسين معدل التحويل`,
                },
                noBadge > 10 && {
                  type: "info",
                  text: `${noBadge} منتج بدون Badge — أضف تسميات جذابة مثل "جديد" أو "الأكثر مبيعاً"`,
                },
                dealsActive.length === 0 && {
                  type: "tip",
                  text: "لا توجد عروض نشطة — العروض تزيد معدل المبيعات بنسبة 30% أو أكثر",
                },
                lowStock.length > 5 && {
                  type: "danger",
                  text: `${lowStock.length} منتج بمخزون منخفض — يُوصى بإعادة التوريد فوراً`,
                },
                products.length < 10 && {
                  type: "info",
                  text: "لديك عدد قليل من المنتجات — أضف المزيد لزيادة فرص البيع",
                },
              ]
                .filter(Boolean)
                .map((rec, i) => {
                  if (!rec) return null;
                  const colors: Record<string, string> = {
                    warning: "border-warning/30 bg-warning/5 text-warning",
                    info: "border-primary/30 bg-primary/5 text-primary",
                    tip: "border-success/30 bg-success/5 text-success",
                    danger: "border-destructive/30 bg-destructive/5 text-destructive",
                  };
                  return (
                    <div key={i} className={`rounded-xl border px-4 py-3 text-sm font-medium ${colors[rec.type]}`}>
                      {rec.type === "warning" && "⚠️ "}
                      {rec.type === "info" && "💡 "}
                      {rec.type === "tip" && "✅ "}
                      {rec.type === "danger" && "🚨 "}
                      {rec.text}
                    </div>
                  );
                })}

              {/* Always show positive recommendation */}
              <div className="rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm font-medium text-success">
                ✅ المتجر يعمل بشكل جيد · {products.filter((p) => p.is_published).length} منتج منشور
              </div>
            </div>
          </section>

          {/* Products without images */}
          {noImage.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                منتجات بدون صور ({noImage.length})
              </h2>
              <div className="rounded-2xl border border-border bg-surface divide-y divide-border/50">
                {noImage.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm font-medium truncate max-w-[75%]">{p.name}</span>
                    <a
                      href={`/admin/product/${p.id}`}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      أضف صورة
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
