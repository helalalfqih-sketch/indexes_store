import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, ShoppingCart, Tag, User, Menu, X, Zap, Truck } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/lib/cart-store";
import noqtaLogo from "@/assets/noqta-logo.png";
import { SiteFooter } from "@/components/site-footer";
import { useAppearance } from "@/components/appearance-provider";
import { NetworkManager } from "@/components/network-manager";
import { ParticleField } from "@/components/design-system/glass";
import { AppInstallBanner } from "@/components/app-install-banner";
import {
  StorefrontWhatsAppFloating,
  MobileCommerceBottomBar,
} from "@/components/storefront-whatsapp-floating";
import { trackEvent } from "@/lib/analytics";

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
      <div className="absolute -start-24 top-[18vh] h-[60vh] w-[60vh] rounded-full opacity-30 blur-3xl">
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--neon-blue) 45%, transparent) 0%, transparent 65%)",
          }}
        />
      </div>
      {/* Teal ambient drift */}
      <div className="absolute -end-32 top-[58vh] h-[70vh] w-[70vh] rounded-full opacity-25 blur-3xl">
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--teal-glow) 40%, transparent) 0%, transparent 65%)",
          }}
        />
      </div>
      <ParticleField count={14} />
    </div>
  );
}

/* ── Mobile Navigation Drawer ─────────────────────────────────────────── */
function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { settings } = useAppearance();
  const storeLogo = settings.store_identity?.logoUrl || settings.navigation?.logoUrl || noqtaLogo;
  const storeName =
    settings.brand_settings?.storeName || settings.navigation?.storeName || "اندكس ستور";

  const navLinks = [
    { to: "/", label: "الرئيسية", icon: Home },
    { to: "/offers", label: "العروض", icon: Tag },
    { to: "/search", label: "البحث", icon: Search },
    { to: "/cart", label: "السلة", icon: ShoppingCart },
    { to: "/account", label: "حسابي", icon: User },
  ];

  // Scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* Drawer panel */}
      <nav
        role="dialog"
        aria-modal="true"
        aria-label="القائمة الرئيسية"
        className="fixed inset-y-0 end-0 z-50 w-[280px] max-w-[85vw] overflow-y-auto"
        style={{
          background: "linear-gradient(180deg, #0a1628 0%, #06101e 100%)",
          borderInlineStart: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="h-10 w-10 overflow-hidden rounded-full border border-white/15">
              <img src={storeLogo} alt={storeName} className="h-full w-full object-cover" />
            </div>
            <span className="text-sm font-black text-white">{storeName}</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق القائمة"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white hover:bg-white/15 transition min-h-[44px] min-w-[44px]"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Navigation links */}
        <ul className="flex flex-col gap-1 px-3 py-4">
          {navLinks.map((link) => {
            const active = pathname === link.to;
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all min-h-[44px] ${
                    active
                      ? "bg-primary/15 text-primary border border-primary/20"
                      : "text-slate-300 hover:bg-white/5 hover:text-white border border-transparent"
                  }`}
                >
                  <link.icon className={`h-5 w-5 ${active ? "text-primary" : "text-slate-500"}`} />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

export function StoreThemeLayout({ children }: { children: React.ReactNode }) {
  const { settings } = useAppearance();

  // Build shipping threshold text from real cart config
  const freeShippingThreshold = settings.cart_config?.freeShippingThreshold ?? 0;
  const hasRealFreeShipping = freeShippingThreshold > 0;

  return (
    <div
      className="relative flex min-h-screen w-full max-w-full overflow-x-hidden flex-col font-sans transition-colors duration-300 bg-showcase text-showcase-foreground selection:bg-primary/30 selection:text-white"
      dir="rtl"
    >
      <CinematicBackground />

      {/* 1. Announcement Bar — dual-info matching reference */}
      {settings.notifications?.announcementEnabled ? (
        <div
          style={{ backgroundColor: settings.notifications.announcementBg }}
          className="relative z-50 text-white text-xs font-bold py-2 px-4 text-center shrink-0"
        >
          {settings.notifications.announcementText}
        </div>
      ) : settings.navigation?.deliveryInfoText || hasRealFreeShipping ? (
        <div className="px-4 py-2 sm:px-6">
          <div className="flex items-center justify-between border border-slate-800/70 rounded-full px-4 sm:px-8 py-2.5 sm:py-3.5 text-xs sm:text-sm bg-[#0A0714] text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-sm sm:text-base">⚡</span>
              <span>{settings.navigation?.deliveryInfoText || "توصيل سريع خلال 24 - 48 ساعة"}</span>
            </div>
            {hasRealFreeShipping && (
              <div className="flex items-center gap-2">
                <span>🚀</span>
                <span>
                  شحن مجاني للطلبات فوق{" "}
                  <span className="text-purple-400 font-bold mx-1">
                    {freeShippingThreshold.toLocaleString("ar-YE")}
                  </span>{" "}
                  ريال
                </span>
                <span className="text-amber-400">🚚</span>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* 2. PWA & App Install Banner */}
      <AppInstallBanner />

      {/* 3. Main Header */}
      <StoreTopBar />

      {/* 4. Main Body Content */}
      <main className="relative z-10 mx-auto flex w-full flex-1 flex-col pb-28 pt-4 md:pb-12 lg:max-w-7xl">
        {children}
        <SiteFooter isHome={true} />
      </main>

      {/* 5. Desktop Floating WhatsApp & Mobile Commerce Bar */}
      <StorefrontWhatsAppFloating />
      <MobileCommerceBottomBar />

      <NetworkManager />
    </div>
  );
}

function StoreTopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const count = useCart((s) => s.items.reduce((count, item) => count + item.qty, 0));
  const { settings } = useAppearance();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const activeLinks = [
    { to: "/", label: "الرئيسية", icon: Home },
    { to: "/offers", label: "العروض", icon: Tag },
    { to: "/cart", label: "السلة", icon: ShoppingCart, badge: count },
    { to: "/account", label: "حسابي", icon: User },
  ];

  const storeLogo = settings.store_identity?.logoUrl || settings.navigation?.logoUrl || noqtaLogo;
  const storeName =
    settings.brand_settings?.storeName || settings.navigation?.storeName || "اندكس ستور";
  const searchPlaceholder =
    settings.navigation?.searchPlaceholder || "ابحث عن منتج، قسم أو علامة تجارية...";

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full bg-[#08060F] border-b border-slate-800/80"
        style={{
          backdropFilter: "blur(16px) saturate(150%)",
        }}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
          {/* Mobile: Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="فتح القائمة"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-[#0F0C1B] text-white hover:bg-slate-800/80 transition md:hidden shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop: Brand Logo & Name */}
          <Link to="/" className="hidden md:flex items-center gap-2.5 group shrink-0">
            <div className="relative h-9 w-9 overflow-hidden rounded-full glow-neon transition-transform group-hover:scale-105">
              <img src={storeLogo} alt={storeName} className="h-full w-full object-cover" />
            </div>
            <span className="text-sm font-black tracking-tight text-white drop-shadow-sm">
              {storeName}
            </span>
          </Link>

          {/* Search Bar — full-width on mobile, constrained on desktop */}
          <Link
            to="/search"
            preload="intent"
            onClick={() => trackEvent("click_search", { source: "header" })}
            className="flex flex-1 items-center gap-2.5 rounded-full border border-slate-800 bg-[#151025] px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-400 transition-all hover:border-slate-700 md:max-w-lg"
            aria-label="بحث"
          >
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <span className="truncate">{searchPlaceholder}</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1.5 md:flex">
            {activeLinks.map((tab) => {
              const active = pathname === tab.to;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  preload="intent"
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

          {/* Cart icon — mobile right side */}
          <Link
            to="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition md:hidden min-h-[44px] min-w-[44px]"
            title="السلة"
            aria-label={`السلة${count > 0 ? ` (${count} منتج)` : ""}`}
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -end-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-white shadow-lg shadow-primary/40">
                {count}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileDrawer open={drawerOpen} onClose={closeDrawer} />
    </>
  );
}
