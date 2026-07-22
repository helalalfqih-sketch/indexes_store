import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Sparkles,
  Package,
  Activity,
  Settings,
  Store,
  ShoppingBag,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Search,
  Image as ImageIcon,
  BarChart3,
  Wand2,
  Users,
  Languages,
  LogOut,
  Loader2,
  ShieldAlert,
  Building2,
  FolderTree,
  Boxes,
  Palette,
  Globe,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { getSessionUser } from "@/lib/auth.functions";
import { claimFirstAdmin } from "@/lib/admin-bootstrap.functions";
import noqtaLogo from "@/assets/noqta-logo.png";

export function AdminShell() {
  return (
    <I18nProvider>
      <AdminGate>
        <ShellInner />
      </AdminGate>
    </I18nProvider>
  );
}

function AdminGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const [status, setStatus] = useState<"checking" | "unauth" | "no-role" | "ok">("checking");
  const [queryError, setQueryError] = useState<string | null>(null);
  const fetchSessionUser = useServerFn(getSessionUser);

  const {
    data: sessionUser,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["session-user"],
    queryFn: () => fetchSessionUser(),
    retry: false,
    enabled: status !== "unauth",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) setStatus("unauth");
    });
  }, []);

  useEffect(() => {
    if (status === "unauth") {
      navigate({ to: "/auth", search: { next: "/admin" }, replace: true });
    }
  }, [status, navigate]);

  useEffect(() => {
    if (isLoading) return;
    if (isError) {
      console.error("Admin user session error:", error);
      setQueryError(error instanceof Error ? error.message : String(error));
      setStatus("no-role");
      return;
    }
    if (!sessionUser) return;
    if (sessionUser.roles.includes("admin")) {
      setQueryError(null);
      setStatus("ok");
    } else {
      setStatus("no-role");
    }
  }, [sessionUser, isLoading, isError, error]);

  if (status === "ok") return <>{children}</>;

  if (status === "no-role") {
    return <NoRoleScreen onClaimed={() => setStatus("checking")} errorMsg={queryError} />;
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground flex items-center justify-center"
      dir="rtl"
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function NoRoleScreen({
  onClaimed,
  errorMsg,
}: {
  onClaimed: () => void;
  errorMsg?: string | null;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const claim = useServerFn(claimFirstAdmin);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(errorMsg || null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (errorMsg) {
      setError(errorMsg);
    }
  }, [errorMsg]);

  const handleClaim = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await claim();
      if (res.granted) {
        await queryClient.invalidateQueries({ queryKey: ["session-user"] });
        onClaimed();
      } else {
        setNotice("يوجد مدير آخر بالفعل. تواصل معه لمنحك الصلاحية.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground flex items-center justify-center px-4"
      dir="rtl"
    >
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">صلاحية الوصول مرفوضة</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          حسابك لا يملك صلاحية دخول لوحة الإدارة. إن كنت مالك المتجر ولم يتم تعيين مدير بعد، يمكنك
          المطالبة بصلاحية المدير الأول.
        </p>
        {notice && <p className="mt-3 text-xs text-warning">{notice}</p>}
        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={handleClaim}
            disabled={busy}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60 transition hover:bg-primary/90"
          >
            {busy ? "جارٍ..." : "المطالبة بصلاحية المدير الأول"}
          </button>
          <Link
            to="/"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold hover:bg-accent/80 transition"
          >
            العودة للمتجر
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-accent transition"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}

function ShellInner() {
  const { t, dir, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  // Desktop sidebar collapse (icons-only), persisted across sessions.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem("admin.sidebar.collapsed") === "1") setCollapsed(true);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const toggleCollapsed = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem("admin.sidebar.collapsed", c ? "0" : "1");
      } catch {
        /* storage unavailable */
      }
      return !c;
    });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  useEffect(() => {
    console.log("[ShellInner] pathname:", pathname);
    if (pathname === "/admin" || pathname === "/app/admin") {
      navigate({ to: "/admin", replace: true });
    }
  }, [pathname, navigate]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  type NavItem = {
    to: string;
    label: string;
    icon: typeof LayoutDashboard;
    exact?: boolean;
    /** Planned page — rendered disabled with a «قريباً» badge (route doesn't exist yet). */
    soon?: boolean;
  };
  type NavGroup = { label: string; emoji: string; items: NavItem[] };

  // SaaS Commerce-OS information architecture. Items marked `soon` are part of
  // the target IA but their routes don't exist yet — shown disabled, never linked.
  const groups: NavGroup[] = [
    {
      label: "نظرة عامة",
      emoji: "🏠",
      items: [
        { to: "/admin", label: t("nav.dashboard"), icon: LayoutDashboard, exact: true },
        { to: "/admin/sessions", label: t("nav.sessions"), icon: Activity },
      ],
    },
    {
      label: "التجارة",
      emoji: "🛒",
      items: [
        { to: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
        { to: "/admin/products", label: t("nav.products"), icon: Package },
        { to: "/admin/categories", label: "التصنيفات", icon: FolderTree },
        { to: "/admin/inventory", label: "المخزون", icon: Boxes },
        { to: "/admin/branches", label: "الفروع", icon: Building2 },
      ],
    },
    {
      label: "تجربة المتجر",
      emoji: "🎨",
      items: [
        { to: "/admin/storefront", label: "Storefront CMS", icon: Globe },
        { to: "/admin/appearance", label: "مظهر المتجر", icon: Palette },
        { to: "#pages", label: "الصفحات", icon: FileText, soon: true },
        { to: "#seo", label: "SEO", icon: Search, soon: true },
        { to: "#media", label: "مكتبة الوسائط", icon: ImageIcon, soon: true },
      ],
    },
    {
      label: "الذكاء الاصطناعي",
      emoji: "🤖",
      items: [
        { to: "/admin/studio", label: t("nav.studio"), icon: Sparkles },
        { to: "#insights", label: "رؤى AI", icon: BarChart3, soon: true },
        { to: "#generator", label: "مولّد المنتجات", icon: Wand2, soon: true },
      ],
    },
    {
      label: "المنصة",
      emoji: "⚙️",
      items: [
        { to: "/admin/stores", label: "المتاجر", icon: Store },
        { to: "/admin/platform", label: "Platform (SaaS)", icon: Globe },
        { to: "#users", label: "المستخدمون والصلاحيات", icon: Users, soon: true },
        { to: "/admin/settings", label: t("nav.settings"), icon: Settings },
      ],
    },
  ];

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div dir={dir} className="relative min-h-screen bg-background text-foreground">
      <aside
        className={`fixed inset-y-0 z-50 transform border-e border-border bg-surface transition-all duration-300 ${
          collapsed ? "w-64 lg:w-20" : "w-64"
        } ${dir === "rtl" ? "right-0" : "left-0"} ${
          open
            ? "translate-x-0"
            : dir === "rtl"
              ? "translate-x-full lg:translate-x-0"
              : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col p-5">
          <div className="flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-3">
              <img src={noqtaLogo} alt="Indexes Store" className="h-11 w-11 rounded-xl neon-ring" />
              <div className={`leading-tight ${collapsed ? "lg:hidden" : ""}`}>
                <div className="text-lg font-black">
                  <span className="neon-text">NOQTA</span>
                </div>
                <div className="text-[11px] text-muted-foreground">{t("brand.tagline")}</div>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleCollapsed}
                className="hidden rounded-lg p-2 text-muted-foreground hover:bg-accent lg:grid place-items-center"
                aria-label={collapsed ? "توسيع الشريط الجانبي" : "طيّ الشريط الجانبي"}
                title={collapsed ? "توسيع" : "طيّ"}
              >
                {collapsed ? (
                  dir === "rtl" ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />
                ) : dir === "rtl" ? (
                  <ChevronsRight className="h-4 w-4" />
                ) : (
                  <ChevronsLeft className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden"
                aria-label="close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto pb-2">
            {groups.map((group) => (
              <div key={group.label} className="mb-2">
                <p
                  className={`mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ${
                    collapsed ? "lg:hidden" : ""
                  }`}
                >
                  {group.emoji} {group.label}
                </p>
                {collapsed && <div className="mx-3 mb-1 hidden border-t border-border/50 lg:block" />}
                {group.items.map((it) => {
                  const Icon = it.icon;
                  if (it.soon) {
                    return (
                      <div
                        key={it.to}
                        title={`${it.label} — قريباً`}
                        aria-disabled="true"
                        className={`flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/40 ${
                          collapsed ? "lg:justify-center" : ""
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>{it.label}</span>
                        <span
                          className={`ms-auto rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold ${
                            collapsed ? "lg:hidden" : ""
                          }`}
                        >
                          قريباً
                        </span>
                      </div>
                    );
                  }
                  const active = isActive(it.to, it.exact);
                  return (
                    <Link
                      key={it.to}
                      to={it.to as string}
                      title={it.label}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        collapsed ? "lg:justify-center" : ""
                      } ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>{it.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              title="اللغة"
              className={`flex w-full items-center gap-2 rounded-xl border border-border/60 px-3.5 py-2.5 text-sm font-semibold hover:bg-accent ${
                collapsed ? "lg:justify-center lg:px-2" : "justify-between"
              }`}
            >
              <span className="flex items-center gap-2">
                <Languages className="h-4 w-4 shrink-0" />
                <span className={collapsed ? "lg:hidden" : ""}>
                  {lang === "ar" ? "العربية" : "English"}
                </span>
              </span>
              <span className={`text-xs text-muted-foreground ${collapsed ? "lg:hidden" : ""}`}>
                {lang === "ar" ? "AR → EN" : "EN → AR"}
              </span>
            </button>
            <Link
              to="/"
              title={t("nav.storefront")}
              className={`flex w-full items-center gap-2 rounded-xl border border-border/60 px-3.5 py-2.5 text-sm font-semibold hover:bg-accent ${
                collapsed ? "lg:justify-center lg:px-2" : ""
              }`}
            >
              <Store className="h-4 w-4 shrink-0" />
              <span className={collapsed ? "lg:hidden" : ""}>{t("nav.storefront")}</span>
            </Link>
            <button
              onClick={handleSignOut}
              title="تسجيل الخروج"
              className={`flex w-full items-center gap-2 rounded-xl border border-destructive/30 px-3.5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition ${
                collapsed ? "lg:justify-center lg:px-2" : ""
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className={collapsed ? "lg:hidden" : ""}>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-showcase/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <div
        className={
          dir === "rtl"
            ? collapsed
              ? "lg:pr-20 transition-all duration-300"
              : "lg:pr-64 transition-all duration-300"
            : collapsed
              ? "lg:pl-20 transition-all duration-300"
              : "lg:pl-64 transition-all duration-300"
        }
      >
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-surface border-b border-border px-4 py-3 lg:px-8">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden"
            aria-label="menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-muted-foreground">
              {t("brand.tagline")}
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
            <span className="text-xs font-semibold text-muted-foreground">AI Online</span>
          </div>
        </header>

        <main className="relative mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
