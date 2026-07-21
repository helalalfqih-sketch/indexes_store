import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, ShoppingCart, Tag, User, Globe, Activity, Settings, HelpCircle, FileText } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useCart } from "@/lib/cart-store";
import noqtaLogo from "@/assets/noqta-logo.png";
import { SiteFooter } from "@/components/site-footer";
import { useAppearance } from "@/components/appearance-provider";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/" || pathname === "/app" || pathname === "/app/";
  const isShowcase = isHome || pathname.startsWith("/product/");
  const { settings } = useAppearance();

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isShowcase ? "bg-showcase text-showcase-foreground" : "bg-background text-foreground"
      }`}
    >
      {settings.notifications?.announcementEnabled && (
        <div
          style={{ backgroundColor: settings.notifications.announcementBg }}
          className="text-white text-xs font-bold py-2 px-4 text-center shrink-0"
        >
          {settings.notifications.announcementText}
        </div>
      )}
      <TopBar isHome={isShowcase} />
      <main className="mx-auto w-full max-w-md md:max-w-6xl lg:max-w-7xl px-4 md:px-6 pb-20 md:pb-12 flex-1">
        {children}
        <SiteFooter isHome={isShowcase} />
      </main>
      <BottomNav isHome={isShowcase} />
    </div>
  );
}

// Map string icon names to Lucide icons dynamically
const ICON_MAP: Record<string, any> = {
  Home,
  Tag,
  ShoppingCart,
  User,
  Globe,
  Activity,
  Settings,
  HelpCircle,
  FileText
};

function TopBar({ isHome }: { isHome: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [count, setCount] = useState(0);
  const items = useCart((s) => s.items);
  const { settings } = useAppearance();

  useEffect(() => {
    setCount(items.reduce((a, i) => a + i.qty, 0));
  }, [items]);

  // Read header links from CMS navigation setting
  const dbLinks = settings.navigation.headerLinks || [];
  const navLinks = dbLinks
    .filter((link) => link.visible)
    .sort((a, b) => a.order - b.order)
    .map((link) => {
      const IconComp = ICON_MAP[link.icon] || HelpCircle;
      return {
        to: link.to,
        label: link.label,
        icon: IconComp,
        badge: link.to === "/cart" ? count : undefined,
        external: link.external,
        target: link.target,
      };
    });

  // Fallback if links are empty
  const activeLinks = navLinks.length > 0 ? navLinks : [
    { to: "/", label: "الرئيسية", icon: Home, badge: undefined, external: false, target: "_self" as const },
    { to: "/offers", label: "العروض", icon: Tag, badge: undefined, external: false, target: "_self" as const },
    { to: "/cart", label: "السلة", icon: ShoppingCart, badge: count, external: false, target: "_self" as const },
    { to: "/account", label: "حسابي", icon: User, badge: undefined, external: false, target: "_self" as const },
  ];

  const storeLogo = settings.navigation.logoUrl || noqtaLogo;
  const storeName = settings.navigation.storeName || "اندكس ستور";
  const tagline = settings.navigation.tagline || "اختيارك الأفضل";
  const searchPlaceholder = settings.navigation.searchPlaceholder || "ابحث عن منتج...";

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b backdrop-blur transition-colors duration-300 ${
        isHome
          ? "bg-showcase/90 border-showcase-border text-showcase-foreground"
          : "bg-surface/90 border-border/60 text-foreground"
      } py-3`}
    >
      <div className="mx-auto flex w-full max-w-md md:max-w-6xl lg:max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        {/* Logo and Name */}
        <Link to="/" className="flex items-center gap-2">
          <img src={storeLogo} alt={storeName} className="h-10 w-10 rounded-xl shadow-brand object-cover" />
          <div className="leading-tight">
            <div
              className={`text-base font-black tracking-tight ${
                isHome ? "text-showcase-foreground" : "text-foreground"
              }`}
            >
              {storeName}
            </div>
            {tagline && (
              <div
                className={`text-[10px] ${isHome ? "text-showcase-muted" : "text-muted-foreground"}`}
              >
                {tagline}
              </div>
            )}
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-5">
          {activeLinks.map((tab) => {
            const active = pathname === tab.to;
            if (tab.external) {
              return (
                <a
                  key={tab.to}
                  href={tab.to}
                  target={tab.target || "_blank"}
                  rel="noopener noreferrer"
                  className={`relative flex items-center gap-1.5 text-xs font-bold transition py-1.5 px-3 rounded-lg ${
                    isHome
                      ? "text-showcase-muted hover:text-showcase-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </a>
              );
            }
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`relative flex items-center gap-1.5 text-xs font-bold transition py-1.5 px-3 rounded-lg ${
                  active
                    ? isHome
                      ? "bg-showcase-foreground/10 text-showcase-foreground"
                      : "bg-primary/10 text-primary"
                    : isHome
                      ? "text-showcase-muted hover:text-showcase-foreground"
                      : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span className="absolute -top-1.5 -end-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[8px] font-bold text-destructive-foreground">
                    {tab.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Search Link */}
        <Link
          to="/search"
          className={`flex flex-1 md:max-w-xs items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
            isHome
              ? "bg-showcase-foreground/10 text-showcase-muted hover:bg-showcase-foreground/15"
              : "bg-muted text-muted-foreground hover:bg-muted/70"
          }`}
        >
          <Search className="h-4 w-4" />
          <span>{searchPlaceholder}</span>
        </Link>
      </div>
    </header>
  );
}

function BottomNav({ isHome }: { isHome: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [count, setCount] = useState(0);
  const items = useCart((s) => s.items);
  const { settings } = useAppearance();

  useEffect(() => {
    setCount(items.reduce((a, i) => a + i.qty, 0));
  }, [items]);

  // Read links from CMS
  const dbLinks = settings.navigation.headerLinks || [];
  const navLinks = dbLinks
    .filter((link) => link.visible)
    .sort((a, b) => a.order - b.order)
    .map((link) => {
      const IconComp = ICON_MAP[link.icon] || HelpCircle;
      return {
        to: link.to,
        label: link.label,
        icon: IconComp,
        badge: link.to === "/cart" ? count : undefined,
        external: link.external,
      };
    });

  const tabs = navLinks.length > 0 ? navLinks : [
    { to: "/", label: "الرئيسية", icon: Home, badge: undefined, external: false },
    { to: "/offers", label: "العروض", icon: Tag, badge: undefined, external: false },
    { to: "/cart", label: "السلة", icon: ShoppingCart, badge: count, external: false },
    { to: "/account", label: "حسابي", icon: User, badge: undefined, external: false },
  ];

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t backdrop-blur md:hidden transition-colors duration-300 ${
        isHome
          ? "bg-showcase/95 border-showcase-border text-showcase-foreground"
          : "bg-surface/95 border-border/60 text-foreground"
      }`}
    >
      <ul className="grid grid-cols-4">
        {tabs.slice(0, 4).map((t) => {
          const active = pathname === t.to;
          const Icon = t.icon;
          if (t.external) {
            return (
              <li key={t.to}>
                <a
                  href={t.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                    isHome
                      ? "text-showcase-muted hover:text-showcase-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{t.label}</span>
                </a>
              </li>
            );
          }
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                  active
                    ? "text-primary"
                    : isHome
                      ? "text-showcase-muted hover:text-showcase-foreground"
                      : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
                  {"badge" in t && t.badge ? (
                    <span className="absolute -end-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                      {t.badge}
                    </span>
                  ) : null}
                </div>
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
