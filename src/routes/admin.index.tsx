import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  DollarSign,
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
import { listAdminProducts } from "@/lib/actions/admin.actions";

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

  const stats = [
    {
      k: "dash.revenue",
      value: "$48,290",
      delta: "+12.4%",
      icon: DollarSign,
    },
    {
      k: "dash.orders",
      value: "1,284",
      delta: "+8.1%",
      icon: ShoppingBag,
    },
    {
      k: "dash.products",
      value: String(products.length || 24),
      delta: "+3",
      icon: Package,
    },
    {
      k: "dash.customers",
      value: "9,340",
      delta: "+5.6%",
      icon: Users,
    },
  ];

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
            </div>
          </div>
          <div className="relative">
            <div className="animate-float rounded-2xl border border-border bg-surface p-6 neon-ring">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary">
                  <TrendingUp className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("dash.performance")}</div>
                  <div className="text-lg font-black">+18.3%</div>
                </div>
              </div>
              <Sparkline />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.k}
              className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-card transition hover:border-primary/30"
            >
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">{t(s.k)}</div>
                  <div className="mt-2 text-2xl font-black">{s.value}</div>
                  <div className="mt-1 text-xs font-bold text-success">{s.delta}</div>
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
            <span className="text-xs text-muted-foreground">Last 30 days</span>
          </div>
          <BigChart />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-lg font-black">{t("dash.aiInsights")}</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {(lang === "ar"
              ? [
                  "زيادة 24% في مشاهدات فئة الإلكترونيات — فكّر بحملة إعلانية.",
                  "3 منتجات نفدت من المخزون خلال اليومين الماضيين.",
                  "أفضل وقت للنشر: 8–10 مساءً بحسب تحليل الجمهور.",
                ]
              : [
                  "24% surge in Electronics category — consider an ad push.",
                  "3 SKUs went out of stock in the last 48h.",
                  "Best posting window: 8–10pm based on audience analytics.",
                ]
            ).map((tip, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl bg-accent/50 p-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{tip}</span>
              </li>
            ))}
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

function Sparkline() {
  const points = [8, 14, 10, 18, 12, 22, 19, 28, 24, 32, 30, 40];
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

function BigChart() {
  const bars = [42, 58, 36, 74, 52, 88, 66, 92, 70, 84, 60, 96];
  return (
    <div className="mt-6 flex h-48 items-end gap-2">
      {bars.map((b, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-lg bg-gradient-to-t from-primary to-primary-light transition-all hover:opacity-90"
          style={{ height: `${b}%` }}
          title={`${b}%`}
        />
      ))}
    </div>
  );
}
