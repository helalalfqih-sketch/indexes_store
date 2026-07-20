import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, ShoppingCart, Tag, User } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useCart } from "@/lib/cart-store";
import noqtaLogo from "@/assets/noqta-logo.png";
import { SiteFooter } from "@/components/site-footer";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/" || pathname === "/app" || pathname === "/app/";

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isHome ? "bg-[#000209] text-white" : "bg-background text-foreground"
    }`}>
      <TopBar isHome={isHome} />
      <main className="mx-auto w-full max-w-md md:max-w-6xl lg:max-w-7xl px-4 md:px-6 pb-20 md:pb-12 flex-1">
        {children}
        <SiteFooter isHome={isHome} />
      </main>
      <BottomNav isHome={isHome} />
    </div>
  );
}

function TopBar({ isHome }: { isHome: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [count, setCount] = useState(0);
  const items = useCart((s) => s.items);

  useEffect(() => {
    setCount(items.reduce((a, i) => a + i.qty, 0));
  }, [items]);

  const navLinks = [
    { to: "/", label: "الرئيسية", icon: Home },
    { to: "/offers", label: "العروض", icon: Tag },
    { to: "/cart", label: "السلة", icon: ShoppingCart, badge: count },
    { to: "/account", label: "حسابي", icon: User },
  ] as const;

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur transition-colors duration-300 ${
      isHome 
        ? "bg-[#000209]/90 border-white/10 text-white" 
        : "bg-surface/90 border-border/60 text-foreground"
    } py-3`}>
      <div className="mx-auto flex w-full max-w-md md:max-w-6xl lg:max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        {/* Logo and Name */}
        <Link to="/" className="flex items-center gap-2">
          <img src={noqtaLogo} alt="اندكس ستور" className="h-10 w-10 rounded-xl shadow-brand" />
          <div className="leading-tight">
            <div className={`text-base font-black tracking-tight ${isHome ? "text-white" : "text-foreground"}`}>اندكس ستور</div>
            <div className={`text-[10px] ${isHome ? "text-white/60" : "text-muted-foreground"}`}>اختيارك الأفضل</div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-5">
          {navLinks.map((tab) => {
            const active = pathname === tab.to;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`relative flex items-center gap-1.5 text-xs font-bold transition py-1.5 px-3 rounded-lg ${
                  active 
                    ? isHome ? "bg-white/10 text-white" : "bg-primary/10 text-primary"
                    : isHome ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"
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
              ? "bg-white/10 text-white/70 hover:bg-white/15" 
              : "bg-muted text-muted-foreground hover:bg-muted/70"
          }`}
        >
          <Search className="h-4 w-4" />
          <span>ابحث عن منتج...</span>
        </Link>
      </div>
    </header>
  );
}

function BottomNav({ isHome }: { isHome: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [count, setCount] = useState(0);
  const items = useCart((s) => s.items);
  useEffect(() => {
    setCount(items.reduce((a, i) => a + i.qty, 0));
  }, [items]);

  const tabs = [
    { to: "/", label: "الرئيسية", icon: Home },
    { to: "/offers", label: "العروض", icon: Tag },
    { to: "/cart", label: "السلة", icon: ShoppingCart, badge: count },
    { to: "/account", label: "حسابي", icon: User },
  ] as const;

  return (
    <nav className={`fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t backdrop-blur md:hidden transition-colors duration-300 ${
      isHome 
        ? "bg-[#000209]/95 border-white/10 text-white" 
        : "bg-surface/95 border-border/60 text-foreground"
    }`}>
      <ul className="grid grid-cols-4">
        {tabs.map((t) => {
          const active = pathname === t.to;
          const Icon = t.icon;
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                  active 
                    ? "text-primary" 
                    : isHome ? "text-white/60 hover:text-white" : "text-muted-foreground hover:text-foreground"
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
