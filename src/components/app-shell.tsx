import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Bell,
  Grid2X2,
  Menu,
  ScanLine,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  User,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useCart } from "@/lib/cart-store";
import { MainMenu } from "@/components/main-menu";
import { MobileReferenceHeader } from "@/components/storefront/MobileReferenceHeader";
import { SiteFooter } from "@/components/site-footer";
import { SCROLL_SPRING } from "@/components/motion/motion-tokens";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isProductPage = pathname.startsWith("/product/");
  const isHomePage = pathname === "/";
  const isCheckoutFlow = pathname === "/cart";
  const ownsStorefrontChrome = isHomePage;
  const hideStorefrontChrome = ownsStorefrontChrome || isCheckoutFlow;

  return (
    <div dir="rtl" className="min-h-screen bg-ink text-ink-text">
      {!hideStorefrontChrome && (
        <div className="hidden md:block">
          <TopBar />
        </div>
      )}
      {!isProductPage && !hideStorefrontChrome && <MobileShellHeader />}
      <main
        className={hideStorefrontChrome ? "w-full" : "mx-auto w-full max-w-md lg:max-w-[1024px]"}
        style={{
          paddingBottom:
            isProductPage || hideStorefrontChrome
              ? 0
              : "calc(104px + env(safe-area-inset-bottom))",
        }}
      >
        {children}
        {!hideStorefrontChrome && <SiteFooter />}
      </main>
      {!isProductPage && !hideStorefrontChrome && <BottomNav />}
    </div>
  );
}

function useCartCount() {
  const [count, setCount] = useState(0);
  const items = useCart((s) => s.items);
  useEffect(() => {
    setCount(items.reduce((a, i) => a + i.qty, 0));
  }, [items]);
  return count;
}

function TopBar() {
  const count = useCartCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const smooth = useSpring(scrollY, SCROLL_SPRING);
  const bgAlpha = useTransform(smooth, [0, 80], [0.82, 0.96]);
  const background = useMotionTemplate`color-mix(in oklab, var(--color-bg-elevated) calc(${bgAlpha} * 100%), transparent)`;
  const borderAlpha = useTransform(smooth, [0, 80], [0.55, 1]);
  const borderColor = useMotionTemplate`color-mix(in oklab, var(--color-border-default) calc(${borderAlpha} * 100%), transparent)`;

  return (
    <motion.header
      dir="ltr"
      style={{ background, borderColor }}
      className="sticky top-0 z-40 mx-auto grid h-16 w-full max-w-md grid-cols-[44px_44px_1fr_44px_44px] items-center gap-2 border-b px-3.5 pt-2 shadow-[var(--shadow-sm)] backdrop-blur-xl lg:h-[72px] lg:max-w-[1024px] lg:grid-cols-[48px_48px_1fr_48px_48px] lg:gap-3 lg:px-5"
    >
      <button
        type="button"
        aria-label="القائمة"
        onClick={() => setMenuOpen(true)}
        className="press grid h-11 w-11 place-items-center rounded-[14px] border border-[var(--color-border-default)] bg-[var(--color-surface-1)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] lg:h-12 lg:w-12"
      >
        <Menu className="h-5 w-5" />
      </button>
      <Link
        to="/search"
        search={{ q: "" }}
        aria-label="المسح الضوئي"
        className="press grid h-11 w-11 place-items-center rounded-[14px] border border-[var(--color-border-default)] bg-[var(--color-surface-1)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] lg:h-12 lg:w-12"
      >
        <ScanLine className="h-5 w-5" />
      </Link>
      <Link
        to="/search"
        search={{ q: "" }}
        aria-label="البحث في المتجر"
        className="press flex h-[46px] min-w-0 items-center gap-2 rounded-[15px] border border-[var(--color-border-default)] bg-[var(--color-surface-1)] px-3.5 text-[11.5px] text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] hover:border-[var(--color-border-strong)] lg:h-12 lg:rounded-2xl lg:px-4 lg:text-sm"
      >
        <Search className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)] lg:h-[18px] lg:w-[18px]" />
        <span dir="rtl" className="min-w-0 flex-1 truncate text-right">
          ابحث عن منتج، قسم أو علامة تجارية...
        </span>
      </Link>
      <Link
        to="/account"
        aria-label="الإشعارات والحساب"
        className="press relative grid h-11 w-11 place-items-center rounded-[14px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] lg:h-12 lg:w-12"
      >
        <Bell className="h-[21px] w-[21px]" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-primary-ui)] ring-2 ring-[var(--color-bg-elevated)]" />
      </Link>
      <Link
        to="/cart"
        aria-label={`السلة${count > 0 ? `، ${count} عناصر` : ""}`}
        className="press relative grid h-11 w-11 place-items-center rounded-[14px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] lg:h-12 lg:w-12"
      >
        <ShoppingCart className="h-[21px] w-[21px]" />
        {count > 0 ? (
          <span className="absolute -right-0.5 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--color-primary-ui)] px-1 text-[10px] font-bold text-white ring-2 ring-[var(--color-bg-elevated)]">
            {count}
          </span>
        ) : null}
      </Link>
      <MainMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </motion.header>
  );
}

function MobileShellHeader() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const count = useCartCount();

  return (
    <div className="md:hidden">
      <MobileReferenceHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSubmitSearch={() => navigate({ to: "/search", search: { q: searchQuery } })}
        cartCount={count}
        unreadNotificationsCount={0}
        onOpenCart={() => navigate({ to: "/cart" })}
        onOpenNotifications={() => navigate({ to: "/account" })}
        onOpenMenu={() => setMenuOpen(true)}
        onSelectCategory={(categoryId) => {
          if (categoryId === "all") {
            navigate({ to: "/search", search: { q: "" } });
          } else {
            navigate({ to: "/category/$id", params: { id: categoryId } });
          }
        }}
      />
      <MainMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </div>
  );
}

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduced = useReducedMotion();
  const count = useCartCount();

  const tabs = [
    { to: "/", label: "المتجر", icon: Store },
    { to: "/search", label: "الفئات", icon: Grid2X2 },
    { to: "/offers", label: "ترندات", icon: Sparkles },
    { to: "/cart", label: "حقيبة التسوق", icon: ShoppingBag, badge: count },
    { to: "/account", label: "أنا", icon: User },
  ] as const;

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed inset-x-0 z-40 mx-auto h-[76px] w-full max-w-[430px] border-t border-[#e5e7eb] bg-white shadow-[0_-6px_24px_rgba(15,23,42,0.10)] md:hidden"
      style={{ bottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid h-full grid-cols-5 items-center px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((t) => {
          const active = t.to !== null && pathname === t.to;
          const Icon = t.icon;
          const inner = (
            <div className="flex min-h-12 min-w-12 flex-col items-center justify-center gap-1.5">
              <div
                className={`relative grid h-8 w-8 place-items-center rounded-md ${active ? "bg-[#0b0b0d] text-white" : "bg-transparent text-[#69707d]"}`}
              >
                <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.4 : 1.8} />
                {"badge" in t && t.badge ? (
                  <span className="absolute -end-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#ef4b23] px-1 text-[9px] font-black text-white">
                    {t.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={`whitespace-nowrap text-[10px] font-semibold ${active ? "text-[#111827]" : "text-[#69707d]"}`}
              >
                {t.label}
              </span>
            </div>
          );

          return (
            <li key={t.label}>
              <Link
                to={t.to}
                aria-label={t.label}
                className="press flex flex-col items-center"
                onClick={(e) => {
                  if (pathname !== t.to) return;
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
                }}
              >
                {inner}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
