import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, ShoppingCart, User, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useAppearance } from "@/components/appearance-provider";
import { whatsappLink } from "@/lib/whatsapp";
import { trackEvent } from "@/lib/analytics";

export function StorefrontWhatsAppFloating() {
  const { settings } = useAppearance();
  const phone = settings.navigation?.whatsappPhone || "967771370740";
  const storeName = settings.navigation?.storeName || "اندكس ستور";
  const waHref = whatsappLink(`مرحباً، أود الاستفسار والتسوق من ${storeName}`, phone);

  const handleWhatsAppClick = () => {
    trackEvent("click_whatsapp", { source: "floating_button" });
  };

  return (
    <>
      {/* Desktop Single Floating WhatsApp Button (hidden on mobile) */}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleWhatsAppClick}
        title="تواصل معنا عبر واتساب"
        className="fixed bottom-6 end-6 z-40 hidden md:flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-emerald-500 hover:shadow-emerald-500/30 border border-emerald-400/40 group"
      >
        <MessageCircle className="h-5 w-5 text-white animate-pulse" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300">
          تواصل معنا على واتساب
        </span>
      </a>
    </>
  );
}

export function MobileCommerceBottomBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const count = useCart((s) => s.count());
  const { settings } = useAppearance();
  const phone = settings.navigation?.whatsappPhone || "967771370740";
  const storeName = settings.navigation?.storeName || "اندكس ستور";
  const waHref = whatsappLink(`مرحباً، أود الاستفسار والتسوق من ${storeName}`, phone);

  const items = [
    { to: "/", label: "الرئيسية", icon: Home },
    { to: "/search", label: "البحث", icon: Search, event: "click_search" },
    { to: "/cart", label: "السلة", icon: ShoppingCart, badge: count },
    { isWhatsApp: true, href: waHref, label: "واتساب", icon: MessageCircle, event: "click_whatsapp" },
    { to: "/account", label: "حسابي", icon: User },
  ];

  return (
    <nav
      className="fixed inset-x-3 z-40 mx-auto w-auto max-w-md md:hidden"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <ul
        className="grid grid-cols-5 items-center rounded-[28px] px-1 py-1.5 shadow-2xl backdrop-blur-[20px]"
        style={{
          background: "rgba(6, 18, 30, 0.92)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "inset 0 1px 0 rgba(31,94,255,0.4), 0 18px 44px -16px rgba(0,0,0,0.85)",
        }}
      >
        {items.map((it, idx) => {
          const Icon = it.icon;
          if (it.isWhatsApp) {
            return (
              <li key={idx}>
                <a
                  href={it.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("click_whatsapp", { source: "bottom_nav" })}
                  className="mx-auto flex w-fit flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[10px] font-bold text-emerald-400 hover:text-white transition-all"
                >
                  <Icon className="h-5 w-5 stroke-[2.5]" />
                  <span>{it.label}</span>
                </a>
              </li>
            );
          }

          const active = pathname === it.to;
          return (
            <li key={idx}>
              <Link
                to={it.to!}
                preload="intent"
                onClick={() => {
                  if (it.event === "click_search") {
                    trackEvent("click_search", { source: "bottom_nav" });
                  }
                }}
                className={`mx-auto flex w-fit flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[10px] font-bold transition-all ${
                  active
                    ? "bg-primary/20 text-neon glow-neon"
                    : "text-showcase-muted hover:text-white"
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
                  {it.badge ? (
                    <span className="absolute -end-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-black text-white shadow-sm">
                      {it.badge}
                    </span>
                  ) : null}
                </div>
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
