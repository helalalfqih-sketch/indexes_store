import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  Users,
  Megaphone,
  Wallet,
  BarChart3,
  Settings,
  Store,
  LogOut,
  Loader2,
  ShieldAlert,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyStore, type MyStore } from "@/lib/store.functions";
import { hasStorePermission, STORE_ROLE_LABELS, type StoreRole } from "@/lib/store/store-gate";

/**
 * StoreShell — the /store/* workspace (Tenant = Electronic Store).
 * StoreGate: NO child page renders or fetches before the caller's session,
 * tenant membership, and role are validated here.
 */

interface StoreCtx {
  store: MyStore;
  role: StoreRole;
  can: (min: StoreRole) => boolean;
  refetch: () => void;
}

const StoreContext = createContext<StoreCtx | null>(null);

export function useStoreContext(): StoreCtx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStoreContext must be used inside StoreShell");
  return ctx;
}

export function StoreShell() {
  const navigate = useNavigate();
  const fetchStore = useServerFn(getMyStore);
  const [authState, setAuthState] = useState<"checking" | "unauth" | "ok">("checking");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthState(data.session ? "ok" : "unauth");
    });
  }, []);

  useEffect(() => {
    if (authState === "unauth") {
      navigate({ to: "/auth", search: { next: "/store/dashboard" }, replace: true });
    }
  }, [authState, navigate]);

  const storeQ = useQuery({
    queryKey: ["my-store"],
    queryFn: () => fetchStore(),
    enabled: authState === "ok",
    retry: false,
  });

  if (authState !== "ok" || storeQ.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground" dir="rtl">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const store = storeQ.data;
  if (!store || !store.myRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground" dir="rtl">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-xl font-bold">لست عضواً في أي متجر</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            حسابك غير مرتبط بأي متجر على المنصّة. تواصل مع مالك المتجر أو إدارة المنصّة لإضافتك.
          </p>
          <Link to="/" className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
            العودة للمتجر
          </Link>
        </div>
      </div>
    );
  }

  const role = store.myRole as StoreRole;
  const ctx: StoreCtx = {
    store,
    role,
    can: (min) => hasStorePermission(role, min),
    refetch: () => storeQ.refetch(),
  };

  return (
    <StoreContext.Provider value={ctx}>
      <ShellInner />
    </StoreContext.Provider>
  );
}

function ShellInner() {
  const { store, role, can } = useStoreContext();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setOpen(false), [pathname]);

  type Item = { to: string; label: string; icon: typeof Store; min: StoreRole };
  const groups: Array<{ label: string; items: Item[] }> = [
    {
      label: "نظرة عامة",
      items: [
        { to: "/store/dashboard", label: "لوحة القيادة", icon: LayoutDashboard, min: "viewer" },
        { to: "/store/analytics", label: "التحليلات", icon: BarChart3, min: "viewer" },
      ],
    },
    {
      label: "التجارة",
      items: [
        { to: "/store/products", label: "المنتجات", icon: Package, min: "viewer" },
        { to: "/store/orders", label: "الطلبات", icon: ShoppingBag, min: "viewer" },
        { to: "/store/inventory", label: "المخزون", icon: Boxes, min: "viewer" },
        { to: "/store/customers", label: "العملاء", icon: Users, min: "staff" },
      ],
    },
    {
      label: "النمو",
      items: [
        { to: "/store/earnings", label: "الأرباح", icon: Wallet, min: "manager" },
        { to: "/store/marketing", label: "التسويق", icon: Megaphone, min: "manager" },
      ],
    },
    {
      label: "الإدارة",
      items: [{ to: "/store/settings", label: "إعدادات المتجر", icon: Settings, min: "owner" }],
    },
  ];

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div dir="rtl" className="relative min-h-screen bg-background text-foreground" style={{ fontFamily: "Tajawal, system-ui, sans-serif" }}>
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-64 transform border-e border-border bg-surface transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col p-5">
          <div className="flex items-center justify-between">
            <Link to="/store/dashboard" className="flex items-center gap-3">
              {store.profile?.logo_url ? (
                <img src={store.profile.logo_url} alt="" className="h-11 w-11 rounded-xl object-cover neon-ring" />
              ) : (
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-lg font-black text-primary neon-ring">
                  {(store.profile?.display_name || store.name).slice(0, 1)}
                </div>
              )}
              <div className="leading-tight">
                <div className="truncate text-sm font-black">{store.profile?.display_name || store.name}</div>
                <div className="text-[11px] text-muted-foreground">{STORE_ROLE_LABELS[role]}</div>
              </div>
            </Link>
            <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden" aria-label="close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto pb-2">
            {groups.map((g) => {
              const visible = g.items.filter((it) => can(it.min));
              if (visible.length === 0) return null;
              return (
                <div key={g.label} className="mb-2">
                  <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{g.label}</p>
                  {visible.map((it) => {
                    const Icon = it.icon;
                    return (
                      <Link
                        key={it.to}
                        to={it.to as string}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive(it.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="truncate">{it.label}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          <div className="mt-4 space-y-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2 rounded-xl border border-border/60 px-3.5 py-2.5 text-sm font-semibold hover:bg-accent"
            >
              <Store className="h-4 w-4" />
              معاينة المتجر
            </a>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-xl border border-destructive/30 px-3.5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-showcase/40 backdrop-blur-sm lg:hidden" />}

      <div className="lg:pr-64">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 lg:px-8">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden" aria-label="menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 truncate text-sm font-semibold text-muted-foreground">
            مركز إدارة المتجر — Indexes Store
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className={`h-2 w-2 rounded-full ${store.status === "active" ? "bg-success animate-pulse" : "bg-destructive"}`} />
            <span className="text-xs font-semibold text-muted-foreground">
              {store.status === "active" ? "المتجر يعمل" : store.status === "suspended" ? "المتجر معلَّق" : "قيد الإعداد"}
            </span>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
