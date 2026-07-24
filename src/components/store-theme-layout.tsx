import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, ShoppingCart, Tag, User } from "lucide-react";
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

export function StoreThemeLayout({ children }: { children: React.ReactNode }) {
  const { settings } = useAppearance();

  return (
    <div
      className="relative flex min-h-screen w-full max-w-full overflow-x-hidden flex-col font-sans transition-colors duration-300 bg-showcase text-showcase-foreground selection:bg-primary/30 selection:text-white"
      dir="rtl"
    >
      <CinematicBackground />

      {/* 1. Announcement Bar */}
      {settings.notifications?.announcementEnabled ? (
        <div
          style={{ backgroundColor: settings.notifications.announcementBg }}
          className="relative z-50 text-white text-xs font-bold py-2 px-4 text-center shrink-0"
        >
          {settings.notifications.announcementText}
        </div>
      ) : (
        <div className="relative z-50 bg-primary/90 text-white text-xs font-bold py-1.5 px-4 text-center shrink-0">
          شحن مجاني للطلبات فوق 50,000 ريال يمني 🚚
        </div>
      )}

      {/* 2. PWA & App Install Banner */}
      <AppInstallBanner />

      {/* 3. Main Header */}
      <StoreTopBar />

      {/* 4. Main Body Content */}
      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-4 md:max-w-6xl md:px-6 md:pb-12 lg:max-w-7xl">
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
  const count = useCart((s) => s.count());
  const { settings } = useAppearance();

  const activeLinks = [
    { to: "/", label: "الرئيسية", icon: Home },
    { to: "/offers", label: "العروض", icon: Tag },
    { to: "/cart", label: "السلة", icon: ShoppingCart, badge: count },
    { to: "/account", label: "حسابي", icon: User },
  ];

  const storeLogo = settings.store_identity?.logoUrl || settings.navigation?.logoUrl || noqtaLogo;
  const storeName = settings.brand_settings?.storeName || settings.navigation?.storeName || "اندكس ستور";
  const searchPlaceholder = settings.navigation?.searchPlaceholder || "ابحث عن منتج...";

  return (
    <header className="sticky top-0 z-40 w-full px-3 pt-3">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-full glass-dark glass-shimmer px-4 py-2.5 shadow-xl md:max-w-6xl md:px-5 lg:max-w-7xl">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative h-9 w-9 overflow-hidden rounded-full glow-neon transition-transform group-hover:scale-105">
            <img src={storeLogo} alt={storeName} className="h-full w-full object-cover" />
          </div>
          <div className="leading-none">
            <span className="text-sm font-black tracking-tight text-white drop-shadow-sm">
              {storeName}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-2 md:flex">
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

        {/* Desktop Single Search Bar */}
        <Link
          to="/search"
          preload="intent"
          onClick={() => trackEvent("click_search", { source: "header_desktop" })}
          className="hidden md:flex flex-1 max-w-xs items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-semibold text-showcase-muted backdrop-blur-sm transition-all hover:border-neon/40 hover:bg-black/50 hover:text-white"
        >
          <Search className="h-3.5 w-3.5 text-neon" />
          <span className="truncate">{searchPlaceholder}</span>
        </Link>

        {/* Mobile Header Quick Actions */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/search"
            onClick={() => trackEvent("click_search", { source: "header_mobile" })}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-showcase-muted hover:text-white"
            title="بحث"
          >
            <Search className="h-4 w-4 text-neon" />
          </Link>
          <Link
            to="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-showcase-muted hover:text-white"
            title="السلة"
          >
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -end-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[8px] font-bold text-white shadow-sm">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
