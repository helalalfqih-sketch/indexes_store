import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  DollarSign,
  Eye,
  ShoppingBag,
  Package,
  Users,
  Sparkles,
  TrendingUp,
  Palette,
  Settings2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAdmin } from "@/lib/admin-store";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAdminProducts } from "@/lib/actions/admin.actions";
import {
  getAdminDashboardStats,
  type AdminDashboardStats,
} from "@/lib/admin-dashboard.functions";
import { formatPrice } from "@/lib/store-data";

/** Format a 7-day-over-7-day change as a signed percentage badge. */
function deltaPct(current: number, previous: number): { text: string; up: boolean } {
  if (previous <= 0) {
    return current > 0 ? { text: "جديد ↑", up: true } : { text: "—", up: true };
  }
  const pct = ((current - previous) / previous) * 100;
  return { text: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, up: pct >= 0 };
}

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

type AdminProduct = Awaited<ReturnType<typeof listAdminProducts>>[number];

function DashboardPage() {
  const { t, lang } = useI18n();
  const sessions = useAdmin((s) => s.sessions);

  const productsQ = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listAdminProducts(),
  });
  const products: AdminProduct[] = productsQ.data ?? [];

  // REAL dashboard numbers from the database (orders, customers, products, CMS).
  const fetchStats = useServerFn(getAdminDashboardStats);
  const statsQ = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => fetchStats(),
    refetchInterval: 60_000,
  });
  const s = statsQ.data as AdminDashboardStats | undefined;

  const revenueDelta = deltaPct(s?.revenue7d ?? 0, s?.revenuePrev7d ?? 0);
  const ordersDelta = deltaPct(s?.orders7d ?? 0, s?.ordersPrev7d ?? 0);

  const stats = [
    {
      k: "dash.revenue",
      value: s ? formatPrice(s.revenue7d) : "…",
      sub: "آخر 7 أيام",
      delta: revenueDelta.text,
      up: revenueDelta.up,
      icon: DollarSign,
    },
    {
      k: "dash.orders",
      value: s ? String(s.orders7d) : "…",
      sub: `${s?.pendingOrders ?? 0} بانتظار التأكيد`,
      delta: ordersDelta.text,
      up: ordersDelta.up,
      icon: ShoppingBag,
    },
    {
      k: "dash.products",
      value: s ? String(s.productsCount) : String(products.length || "…"),
      sub: `${s?.publishedCount ?? 0} منشور`,
      delta: s ? `${s.metaUnsyncedCount} غير متزامن` : "",
      up: (s?.metaUnsyncedCount ?? 0) === 0,
      icon: Package,
    },
    {
      k: "dash.customers",
      value: s ? String(s.customersCount) : "…",
      sub: "حسابات مسجَّلة",
      delta: "",
      up: true,
      icon: Users,
    },
  ];

  // Rule-based, DATA-DRIVEN insights (no fabricated numbers).
  const insights: Array<{ text: string; to: string }> = [];
  if (s) {
    if (s.pendingOrders > 0)
      insights.push({ text: `📦 ${s.pendingOrders} طلب بانتظار التأكيد — راجع الطلبات الآن.`, to: "/admin/orders" });
    if (s.lowStock.length > 0)
      insights.push({
        text: `⚠️ ${s.lowStock.length} منتجات منشورة مخزونها ≤ 5: ${s.lowStock.slice(0, 3).map((p) => p.name).join("، ")}${s.lowStock.length > 3 ? "…" : ""}`,
        to: "/admin/inventory",
      });
    if (s.metaUnsyncedCount > 0)
      insights.push({ text: `🔄 ${s.metaUnsyncedCount} منتجاً منشوراً غير متزامن مع كتالوج Meta.`, to: "/admin/products" });
    if (s.cmsDraftCount > 0)
      insights.push({ text: `📝 لديك ${s.cmsDraftCount} مسودة CMS غير منشورة.`, to: "/admin/storefront" });
    if (insights.length === 0)
      insights.push({ text: "✨ كل شيء على ما يرام — لا تنبيهات حالياً.", to: "/admin" });
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 lg:p-10">
        <div className="absolute -top-24 -end-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -start-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI Commerce OS
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight lg:text-5xl">
              <span className="neon-text animate-gradient">
                {lang === "ar" ? "أهلاً بك في اندكس ستور" : "Welcome to Indexes Store"}
              </span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground lg:text-base">
              {lang === "ar"
                ? "منصة تجارة إلكترونية مدعومة بالذكاء الاصطناعي — أنشئ، حلّل، وانشر منتجاتك بلمسات."
                : "AI-powered commerce OS — create, analyze and publish products in seconds."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/admin/studio"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-brand hover:bg-primary/90 transition"
              >
                <Sparkles className="h-4 w-4" />
                {t("nav.studio")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                to="/admin/products"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-bold hover:bg-accent transition"
              >
                <Package className="h-4 w-4" />
                {t("nav.products")}
              </Link>
              <Link
                to="/admin/appearance"
                className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-5 py-3 text-sm font-bold text-primary hover:bg-primary/20 transition"
              >
                <Palette className="h-4 w-4" />
                {lang === "ar" ? "مظهر المتجر" : "Store Appearance"}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-bold hover:bg-accent transition"
              >
                <Eye className="h-4 w-4" />
                {lang === "ar" ? "معاينة المتجر" : "Preview Store"}
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="animate-float rounded-2xl border border-border bg-surface p-6 neon-ring">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary">
                  <TrendingUp className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t("dash.performance")} · إيرادات 7 أيام
                  </div>
                  <div className={`text-lg font-black ${revenueDelta.up ? "text-success" : "text-destructive"}`}>
                    {revenueDelta.text}
                  </div>
                </div>
              </div>
              <Sparkline points={s?.dailyRevenue} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats — real database numbers */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsQ.isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl border border-border bg-surface"
                aria-busy="true"
              />
            ))
          : stats.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.k}
                  className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-card transition hover:border-primary/30"
                >
                  <div className="relative flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">{t(card.k)}</div>
                      <div className="mt-2 text-2xl font-black">{card.value}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        {card.delta && (
                          <span className={`font-bold ${card.up ? "text-success" : "text-destructive"}`}>
                            {card.delta}
                          </span>
                        )}
                        <span className="text-muted-foreground">{card.sub}</span>
                      </div>
                    </div>
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </div>
              );
            })}
      </section>

      {/* Grid */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">{t("dash.performance")}</h2>
            <span className="text-xs text-muted-foreground">الإيرادات اليومية · آخر 12 يوماً</span>
          </div>
          <BigChart values={s?.dailyRevenue} loading={statsQ.isLoading} />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-lg font-black">{t("dash.aiInsights")}</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {statsQ.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="h-12 animate-pulse rounded-xl bg-accent/50" />
              ))
            ) : (
              insights.map((tip, i) => (
                <li key={i}>
                  <Link
                    to={tip.to}
                    className="flex items-start gap-3 rounded-xl bg-accent/50 p-3 transition hover:bg-accent"
                  >
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{tip.text}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      {/* Quick Actions — Appearance & Settings */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            to: "/admin/appearance",
            label: lang === "ar" ? "مظهر المتجر" : "Store Appearance",
            desc: lang === "ar" ? "تخصيص الألوان، الخطوط، والهيكل البصري" : "Colors, fonts & visual identity",
            icon: Palette,
            accent: "text-violet-500 bg-violet-500/10",
          },
          {
            to: "/admin/settings",
            label: lang === "ar" ? "إعدادات المدير" : "Admin Settings",
            desc: lang === "ar" ? "المظهر الشخصي للوحة التحكم واللغة" : "Dashboard theme & language",
            icon: Settings2,
            accent: "text-sky-500 bg-sky-500/10",
          },
          {
            to: "/admin/products",
            label: lang === "ar" ? "إدارة المنتجات" : "Products",
            desc: lang === "ar" ? "إضافة، تعديل، وحذف المنتجات" : "Add, edit and delete products",
            icon: Package,
            accent: "text-emerald-500 bg-emerald-500/10",
          },
          {
            to: "/admin/studio",
            label: lang === "ar" ? "استوديو الذكاء" : "AI Studio",
            desc: lang === "ar" ? "توليد منتجات بالذكاء الاصطناعي" : "Generate listings with AI",
            icon: Sparkles,
            accent: "text-amber-500 bg-amber-500/10",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card hover:border-primary/40 hover:shadow-brand transition-all"
            >
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${item.accent}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-black">
                  {item.label}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">{item.desc}</div>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-lg font-black">{t("dash.topProducts")}</h2>
          <div className="mt-4 space-y-3">
            {(products.length ? products.slice(0, 4) : []).map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-border/60 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {p?.images?.[0] && (
                      <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">
                      {p?.name || (lang === "ar" ? "منتج تجريبي" : "Sample product")}
                    </div>
                    <div className="text-xs text-muted-foreground">{p?.brand || "—"}</div>
                  </div>
                </div>
                <div className="text-sm font-black text-primary">
                  {p ? `${p.price} ${p.currency}` : "$—"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-lg font-black">{t("dash.recentSessions")}</h2>
          <div className="mt-4 space-y-3">
            {sessions.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {lang === "ar" ? "لا توجد جلسات بعد" : "No sessions yet"}
              </div>
            )}
            {sessions.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-border/60 p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{s.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleString()}
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                  {s.step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Sparkline({ points: input }: { points?: number[] }) {
  const raw = input && input.length >= 2 ? input : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  // Flat-line gracefully when there's no revenue yet.
  const points = raw.every((v) => v === 0) ? raw.map(() => 1) : raw.map((v) => v + 0.0001);
  const max = Math.max(...points);
  const w = 200;
  const h = 60;
  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step},${h - (p / max) * h}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-16 w-full">
      <defs>
        <linearGradient id="sl" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--primary-light)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--primary-light)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${w},${h} L 0,${h} Z`} fill="url(#sl)" />
      <path d={d} stroke="var(--primary)" strokeWidth={2} fill="none" strokeLinecap="round" />
    </svg>
  );
}

function BigChart({ values, loading }: { values?: number[]; loading?: boolean }) {
  if (loading) {
    return <div className="mt-6 h-48 animate-pulse rounded-xl bg-accent/50" aria-busy="true" />;
  }
  const data = values && values.length > 0 ? values : [];
  const max = Math.max(...data, 0);
  if (max === 0) {
    return (
      <div className="mt-6 flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        لا توجد إيرادات في آخر 12 يوماً بعد — ستظهر الأعمدة هنا مع أول الطلبات 📈
      </div>
    );
  }
  return (
    <div className="mt-6 flex h-48 items-end gap-2">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-lg bg-gradient-to-t from-primary to-primary-light transition-all hover:opacity-90"
          style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
          title={`${v.toLocaleString("ar-EG")}`}
        />
      ))}
    </div>
  );
}
