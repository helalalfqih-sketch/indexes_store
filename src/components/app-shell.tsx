import { Link, useRouterState } from "@tanstack/react-router";
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
  Home,
  Menu,
  MessageCircle,
  ScanLine,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useCart } from "@/lib/cart-store";
import { MainMenu } from "@/components/main-menu";
import { SiteFooter } from "@/components/site-footer";
import { whatsappLink } from "@/lib/whatsapp";
import { SCROLL_SPRING } from "@/components/motion/motion-tokens";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen bg-ink text-ink-text">
      <TopBar />
      <main
        className="mx-auto w-full max-w-md lg:max-w-[1024px]"
        style={{ paddingBottom: "calc(104px + env(safe-area-inset-bottom))" }}
      >
        {children}
        <SiteFooter />
      </main>
      <BottomNav />
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

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduced = useReducedMotion();
  const count = useCartCount();

  const tabs = [
    { to: "/cart", label: "السلة", icon: ShoppingCart, badge: count },
    { to: "/search", label: "بحث", icon: Search },
    { to: "/", label: "الرئيسية", icon: Home, center: true },
    { to: null, label: "واتساب", icon: MessageCircle, dot: true },
    { to: "/account", label: "حسابي", icon: User },
  ] as const;

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed inset-x-3.5 z-40 mx-auto h-[70px] w-auto max-w-[398px] rounded-[28px] border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[var(--shadow-lg)] backdrop-blur-xl md:hidden"
      style={{ bottom: "calc(10px + env(safe-area-inset-bottom))" }}
    >
      <ul className="grid h-full grid-cols-5 items-center px-2">
        {tabs.map((t) => {
          const active = t.to !== null && pathname === t.to;
          const Icon = t.icon;
          const inner =
            "center" in t && t.center ? (
              <div className="flex flex-col items-center gap-1">
                <div className="grid h-14 w-14 -translate-y-4 place-items-center rounded-full border border-[var(--color-primary-border)] bg-[var(--color-primary-ui)] text-white shadow-[var(--shadow-md)]">
                  <Icon className="h-[22px] w-[22px]" />
                </div>
                <span className="-mt-3 text-[10px] font-bold text-[var(--color-primary-ui)]">
                  {t.label}
                </span>
              </div>
            ) : (
              <div className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-1">
                <div className="relative">
                  <Icon
                    className={`h-5 w-5 ${active ? "text-[var(--color-primary-ui)]" : "text-[var(--color-text-muted)]"}`}
                  />
                  {"badge" in t && t.badge ? (
                    <span className="absolute -end-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--color-primary-ui)] px-1 text-[9px] font-bold text-white">
                      {t.badge}
                    </span>
                  ) : null}
                  {"dot" in t && t.dot ? (
                    <span className="absolute -end-1 -top-1 h-2 w-2 rounded-full bg-[var(--color-success)]" />
                  ) : null}
                </div>
                <span
                  className={`text-[10px] font-semibold ${active ? "text-[var(--color-primary-ui)]" : "text-[var(--color-text-muted)]"}`}
                >
                  {t.label}
                </span>
              </div>
            );

          if (t.to === null) {
            return (
              <li key={t.label}>
                <a
                  href={whatsappLink("مرحباً، أريد الاستفسار عن منتج")}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="التواصل عبر واتساب"
                  className="press flex flex-col items-center"
                >
                  {inner}
                </a>
              </li>
            );
          }
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
