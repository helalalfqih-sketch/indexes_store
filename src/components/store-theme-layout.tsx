import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Menu, ScanLine, Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { SiteFooter } from "@/components/site-footer";
import { useAppearance } from "@/components/appearance-provider";
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
      {/* Violet orbital glow */}
      <div className="absolute -start-24 top-[18vh] h-[60vh] w-[60vh] rounded-full opacity-30 blur-3xl">
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, #7c3aed 45%, transparent) 0%, transparent 65%)",
          }}
        />
      </div>
      {/* Teal ambient drift */}
      <div className="absolute -end-32 top-[58vh] h-[70vh] w-[70vh] rounded-full opacity-25 blur-3xl">
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, #d946ef 40%, transparent) 0%, transparent 65%)",
          }}
        />
      </div>
      <ParticleField count={14} />
    </div>
  );
}

export function StoreThemeLayout({ children }: { children: React.ReactNode }) {
  const { settings } = useAppearance();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

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
          شحن مجاني للطلبات فوق 30,000 ريال يمني 🚚
        </div>
      )}

      {/* 2. PWA & App Install Banner */}
      {pathname === "/" ? null : <AppInstallBanner />}

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
    </div>
  );
}

function StoreTopBar() {
  const count = useCart((s) => s.count());
  const { settings } = useAppearance();
  const searchPlaceholder = settings.navigation?.searchPlaceholder || "ابحث عن منتج...";

  return (
    <header className="sticky top-0 z-40 w-full px-3 py-3">
      <div className="mx-auto flex w-full max-w-md items-center gap-2.5 rounded-[22px] border border-violet-400/20 bg-[#050916]/98 px-3 py-2.5 shadow-[0_16px_45px_rgba(0,0,0,0.32)] md:max-w-6xl md:gap-4 md:px-4 lg:max-w-7xl">
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            to="/cart"
            preload="intent"
            aria-label="السلة"
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-violet-200 transition hover:border-violet-400/45 hover:text-white"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 ? (
              <span className="absolute -end-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-violet-600 px-1 text-[8px] font-black text-white">
                {count}
              </span>
            ) : null}
          </Link>
          <Link
            to="/account"
            preload="intent"
            aria-label="التنبيهات والحساب"
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-violet-200 transition hover:border-violet-400/45 hover:text-white"
          >
            <Bell className="h-5 w-5" />
          </Link>
        </div>

        <Link
          to="/search"
          preload="intent"
          onClick={() => trackEvent("click_search", { source: "header_desktop" })}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 py-3 text-xs font-semibold text-showcase-muted transition hover:border-violet-400/50 hover:bg-black/55 hover:text-white md:text-sm"
        >
          <Search className="h-4 w-4 shrink-0 text-violet-300" />
          <span className="truncate">{searchPlaceholder}</span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            to="/search"
            aria-label="البحث المرئي"
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-violet-200 transition hover:border-violet-400/45 hover:text-white"
          >
            <ScanLine className="h-5 w-5" />
          </Link>
          <Link
            to="/search"
            aria-label="قائمة الأقسام"
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-violet-200 transition hover:border-violet-400/45 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
