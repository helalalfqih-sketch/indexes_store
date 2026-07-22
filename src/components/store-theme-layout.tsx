import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, ShoppingCart, Tag, User, HelpCircle } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useCart } from "@/lib/cart-store";
import noqtaLogo from "@/assets/noqta-logo.png";
import { SiteFooter } from "@/components/site-footer";
import { useAppearance } from "@/components/appearance-provider";
import { NetworkManager } from "@/components/network-manager";
import { ParticleField } from "@/components/design-system/glass";

// Animated Cinematic Background Layer — futuristic showroom depth
function CinematicBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 90% at 50% -10%, var(--showcase-high) 0%, var(--showcase-mid) 45%, var(--showcase-deep) 100%)",
      }}
    >
      {/* Depth grid */}
      <div className="absolute inset-0 opacity-[0.1]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in oklab, var(--showcase-foreground) 40%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--showcase-foreground) 40%, transparent) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
            maskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)",
          }}
        />
      </div>
      {/* Neon-blue orbital glow */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
        className="absolute -start-24 top-[18vh] h-[60vh] w-[60vh] rounded-full opacity-30 blur-3xl"
      >
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--neon-blue) 45%, transparent) 0%, transparent 65%)",
          }}
        />
      </motion.div>
      {/* Teal ambient drift */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -end-32 top-[58vh] h-[70vh] w-[70vh] rounded-full opacity-25 blur-3xl"
      >
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--teal-glow) 40%, transparent) 0%, transparent 65%)",
          }}
        />
      </motion.div>
      {/* Copper luxury underglow */}
      <div
        className="absolute inset-x-0 bottom-[-20vh] h-[45vh] opacity-[0.16] blur-3xl"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 100%, color-mix(in oklab, var(--accent-copper) 55%, transparent) 0%, transparent 70%)",
        }}
      />
      {/* Floating light particles */}
      <ParticleField count={14} />
    </div>
  );
}

export function StoreThemeLayout({ children }: { children: ReactNode }) {
  const { settings } = useAppearance();

  return (
    <div
      className="relative flex min-h-screen w-full max-w-full overflow-x-hidden flex-col font-sans transition-colors duration-300 bg-showcase text-showcase-foreground selection:bg-primary/30 selection:text-white"
      dir="rtl"
    >
      <CinematicBackground />

      {settings.notifications?.announcementEnabled && (
        <div
          style={{ backgroundColor: settings.notifications.announcementBg }}
          className="relative z-50 text-white text-xs font-bold py-2 px-4 text-center shrink-0"
        >
          {settings.notifications.announcementText}
        </div>
      )}

      <StoreTopBar />
      
      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-24 pt-4 md:max-w-6xl md:px-6 lg:max-w-7xl">
        {children}
        <SiteFooter isHome={true} />
      </main>

      <StoreBottomNav />
      <NetworkManager />
    </div>
  );
}

function StoreTopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [count, setCount] = useState(0);
  const items = useCart((s) => s.items);
  const { settings } = useAppearance();

  useEffect(() => {
    setCount(items.reduce((a, i) => a + i.qty, 0));
  }, [items]);

  const activeLinks = [
    { to: "/", label: "الرئيسية", icon: Home },
    { to: "/offers", label: "العروض", icon: Tag },
    { to: "/cart", label: "السلة", icon: ShoppingCart, badge: count },
    { to: "/account", label: "حسابي", icon: User },
  ];

  const storeLogo = settings.navigation.logoUrl || noqtaLogo;
  const storeName = settings.navigation.storeName || "اندكس ستور";
  const searchPlaceholder = settings.navigation.searchPlaceholder || "بحث ذكي...";

  return (
    <header className="sticky top-0 z-40 w-full px-3 pt-3">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-full glass-dark glass-shimmer px-3 py-2 shadow-xl md:max-w-6xl md:px-5 lg:max-w-7xl">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative h-10 w-10 overflow-hidden rounded-full glow-neon transition-transform group-hover:scale-105">
            <img src={storeLogo} alt={storeName} className="h-full w-full object-cover" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-black tracking-tight text-white drop-shadow-sm">
              {storeName}
            </div>
            <div className="text-[10px] font-bold text-primary-light">Premium Store</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {activeLinks.map((tab) => {
            const active = pathname === tab.to;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  active
                    ? "bg-primary text-white shadow-brand"
                    : "text-showcase-muted hover:bg-showcase-foreground/10 hover:text-white"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span className="absolute -end-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[8px] font-bold text-white shadow-sm">
                    {tab.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <Link
          to="/search"
          className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-showcase-muted backdrop-blur-sm transition-all hover:border-neon/40 hover:bg-black/50 hover:text-white md:max-w-xs"
        >
          <Search className="h-4 w-4 text-neon" />
          <span className="text-xs font-semibold">{searchPlaceholder}</span>
        </Link>
      </div>
    </header>
  );
}

function StoreBottomNav() {
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
  ];

  return (
    <nav
      className="fixed inset-x-3 z-40 mx-auto w-auto max-w-md md:hidden"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <ul
        className="grid grid-cols-4 items-center rounded-[28px] px-2 py-1.5 shadow-2xl backdrop-blur-[20px]"
        style={{
          background: "rgba(6, 18, 30, 0.85)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "inset 0 1px 0 rgba(184,126,82,0.4), 0 18px 44px -16px rgba(0,0,0,0.75)",
        }}
      >
        {tabs.map((t) => {
          const active = pathname === t.to;
          const Icon = t.icon;
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className={`mx-auto flex w-fit flex-col items-center gap-1 rounded-2xl px-4 py-2 text-[10px] font-bold transition-all ${
                  active
                    ? "bg-neon/15 text-neon glow-neon"
                    : "text-showcase-muted hover:text-white"
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
                  {t.badge ? (
                    <span className="absolute -end-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-black text-white shadow-sm">
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
