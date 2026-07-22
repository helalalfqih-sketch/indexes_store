import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Store, Loader2, Package, ShoppingBag, ArrowUpRight } from "lucide-react";
import { listStoresAdmin } from "@/lib/admin-stores.functions";
import { formatPrice } from "@/lib/store-data";

export const Route = createFileRoute("/admin/stores")({
  component: AdminStoresLayout,
});

function AdminStoresLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Render the details child route when navigated deeper.
  if (pathname !== "/admin/stores") return <Outlet />;
  return <StoresOverview />;
}

const FILTERS = [
  { id: "all", label: "الكل" },
  { id: "active", label: "نشط" },
  { id: "pending", label: "قيد الإعداد" },
  { id: "suspended", label: "معلَّق" },
  { id: "expired", label: "منتهي الاشتراك" },
] as const;

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  active: { label: "نشط", tone: "bg-success/10 text-success" },
  pending: { label: "قيد الإعداد", tone: "bg-amber-500/10 text-amber-500" },
  suspended: { label: "معلَّق", tone: "bg-destructive/10 text-destructive" },
};

const PLAN_LABELS: Record<string, string> = {
  free: "مجاني",
  pro: "احترافي",
  enterprise: "أعمال",
};

function StoresOverview() {
  const fetchStores = useServerFn(listStoresAdmin);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const storesQ = useQuery({
    queryKey: ["admin-stores"],
    queryFn: () => fetchStores(),
  });

  const all = storesQ.data ?? [];
  const stores = all.filter((s) => {
    if (filter === "all") return true;
    if (filter === "expired") return s.expired;
    return s.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black lg:text-4xl text-foreground flex items-center gap-3">
            <Store className="h-8 w-8 text-primary" />
            المتاجر
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {storesQ.isLoading ? "جارٍ التحميل..." : `${all.length} متجر على المنصّة`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl glass p-3">
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                filter === f.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Store cards */}
      {storesQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl glass" aria-busy="true" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="rounded-2xl glass p-10 text-center space-y-2">
          <Store className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-bold">لا توجد متاجر مطابقة</p>
          <p className="text-xs text-muted-foreground">
            يمكن إنشاء متاجر جديدة من صفحة Platform (SaaS).
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stores.map((s) => {
            const st = STATUS_LABELS[s.status] ?? { label: s.status, tone: "bg-muted text-muted-foreground" };
            return (
              <Link
                key={s.tenantId}
                to="/admin/stores/$tenantId"
                params={{ tenantId: s.tenantId }}
                className="group rounded-2xl glass p-5 transition hover:border-primary/40 hover:shadow-brand border border-transparent"
              >
                <div className="flex items-start gap-3">
                  {s.logoUrl ? (
                    <img src={s.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover border border-border" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-lg font-black text-primary">
                      {(s.displayName || s.name).slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-black">{s.displayName || s.name}</p>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:opacity-100" />
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
                      /{s.slug}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                  <span className={`rounded-full px-2 py-0.5 ${st.tone}`}>{st.label}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                    {PLAN_LABELS[s.plan] ?? s.plan}
                  </span>
                  {s.expired && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
                      اشتراك منتهٍ
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/50 pt-3 text-center">
                  <div>
                    <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                      <Package className="h-3 w-3" /> منتجات
                    </p>
                    <p className="text-sm font-black">{s.productsCount}</p>
                  </div>
                  <div>
                    <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                      <ShoppingBag className="h-3 w-3" /> طلبات
                    </p>
                    <p className="text-sm font-black">{s.ordersCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">الإيرادات</p>
                    <p className="truncate text-sm font-black text-primary">{formatPrice(s.revenue)}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>المالك: {s.ownerName || "—"}</span>
                  <span>{new Date(s.createdAt).toLocaleDateString("ar-EG")}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {storesQ.isFetching && !storesQ.isLoading && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> تحديث البيانات...
        </p>
      )}
    </div>
  );
}
