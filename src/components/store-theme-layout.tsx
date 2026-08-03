import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Menu, Rocket, ScanLine, Search, ShoppingCart, Truck, Zap } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
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
  const reducedMotion = useReducedMotion();

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
      {/* Lightweight static aurora for phones; avoids continuously animating large blurred layers. */}
      <div className="absolute inset-x-0 top-20 h-[46vh] bg-[radial-gradient(ellipse_at_30%_20%,rgba(124,58,237,0.2),transparent_55%),radial-gradient(ellipse_at_80%_50%,rgba(217,70,239,0.14),transparent_52%)] md:hidden" />

      {/* Transform-only aurora drift on larger screens. */}
      <motion.div
        animate={
          reducedMotion
            ? undefined
            : {
                x: [0, 46, -24, 0],
                y: [0, 34, 72, 0],
                scale: [1, 1.12, 0.96, 1],
              }
        }
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -start-24 top-[18vh] hidden h-[60vh] w-[60vh] rounded-full opacity-30 blur-3xl md:block"
      >
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, #7c3aed 45%, transparent) 0%, transparent 65%)",
          }}
        />
      </motion.div>
      <motion.div
        animate={
          reducedMotion
            ? undefined
            : {
                x: [0, -52, 18, 0],
                y: [0, -28, 54, 0],
                scale: [1, 0.94, 1.1, 1],
              }
        }
        transition={{ duration: 29, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -end-32 top-[58vh] hidden h-[70vh] w-[70vh] rounded-full opacity-25 blur-3xl md:block"
      >
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, #d946ef 40%, transparent) 0%, transparent 65%)",
          }}
        />
      </motion.div>
      <ParticleField count={14} />
    </div>
  );
}

export function StoreThemeLayout({ children }: { children: React.ReactNode }) {
  const { settings } = useAppearance();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <div
      className="storefront-v3 relative flex min-h-screen w-full max-w-full overflow-x-hidden flex-col font-sans transition-colors duration-300 selection:bg-primary/30 selection:text-white"
      dir="rtl"
    >
      <CinematicBackground />

      {/* 1. PWA & App Install Banner */}
      {pathname === "/" ? null : <AppInstallBanner />}

      {/* 2. Main Header */}
      <StoreTopBar />

      {/* 3. Delivery and shipping facts */}
      <ShippingInfoStrip />

      {/* 4. Main Body Content */}
      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-3 md:max-w-[1180px] md:px-9 md:pb-28 min-[1100px]:pb-12">
        {children}
        <SiteFooter isHome={true} />
      </main>

      {/* 5. Desktop Floating WhatsApp & Mobile Commerce Bar */}
      <StorefrontWhatsAppFloating />
      <MobileCommerceBottomBar />
    </div>
  );
}

function ShippingInfoStrip() {
  const { settings } = useAppearance();
  const threshold = settings.cart_config?.freeShippingThreshold ?? 30_000;
  const formattedThreshold = new Intl.NumberFormat("ar-YE").format(threshold);

  return (
    <aside
      aria-label="معلومات التوصيل والشحن"
      className="relative z-30 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center justify-between gap-3 rounded-[18px] border border-white/[0.07] bg-[#080d1a]/95 px-4 py-3 text-[10px] font-bold text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] md:w-[calc(100%-4.5rem)] md:max-w-[1108px] md:px-7 md:text-sm"
    >
      <span className="inline-flex min-w-0 items-center gap-2 whitespace-nowrap">
        <Zap className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
        توصيل سريع خلال 24 - 48 ساعة
      </span>
      <span className="inline-flex min-w-0 items-center gap-2 whitespace-nowrap">
        <Rocket className="hidden h-4 w-4 shrink-0 text-fuchsia-300 sm:block" aria-hidden="true" />
        {threshold > 0
          ? `شحن مجاني للطلبات فوق ${formattedThreshold} ريال`
          : "شحن مجاني لجميع الطلبات"}
        <Truck className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
      </span>
    </aside>
  );
}

function StoreTopBar() {
  const count = useCart((s) => s.count());
  const { settings } = useAppearance();
  const searchPlaceholder = settings.navigation?.searchPlaceholder || "ابحث عن منتج...";

  return (
    <header className="relative z-40 w-full px-4 pb-3 pt-5 md:px-9 md:pb-4 md:pt-8">
      <div className="mx-auto flex w-full max-w-md items-center gap-2.5 rounded-[22px] border border-violet-400/20 bg-[#050916]/98 px-3 py-2.5 shadow-[0_16px_45px_rgba(0,0,0,0.32)] md:max-w-[1108px] md:gap-4 md:px-4 md:py-3">
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
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-violet-200 transition hover:border-violet-400/45 hover:text-white"
          >
            <Bell className="h-5 w-5" />
            <span
              className="absolute end-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-violet-500"
              aria-hidden="true"
            />
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
