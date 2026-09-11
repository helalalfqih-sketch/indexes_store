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
  const count = useCart((s) => s.items.reduce((count, item) => count + item.qty, 0));
  const { settings } = useAppearance();
  const phone = settings.navigation?.whatsappPhone || "967771370740";
  const storeName = settings.navigation?.storeName || "اندكس ستور";
  const waHref = whatsappLink(`مرحباً، أود الاستفسار والتسوق من ${storeName}`, phone);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 w-full bg-[#0F0C1B] border-t border-slate-800/90 h-[72px] sm:h-[84px] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="التنقل الرئيسي"
    >
      <div className="flex items-center justify-around h-full px-4 max-w-md mx-auto relative">
        {/* 1. Account */}
        <Link
          to="/account"
          className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
            pathname === "/account" ? "text-white font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <User className="h-5 w-5" />
          <span>حسابي</span>
        </Link>

        {/* 2. WhatsApp */}
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("click_whatsapp", { source: "bottom_nav" })}
          className="flex flex-col items-center gap-1 text-xs font-medium text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          <span>واتساب</span>
        </a>

        {/* 3. Cart */}
        <Link
          to="/cart"
          className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors relative ${
            pathname === "/cart" ? "text-white font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-[#0F0C1B]">
                {count}
              </span>
            )}
          </div>
          <span>السلة</span>
        </Link>

        {/* 4. Search */}
        <Link
          to="/search"
          onClick={() => trackEvent("click_search", { source: "bottom_nav" })}
          className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
            pathname === "/search" ? "text-white font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <Search className="h-5 w-5" />
          <span>البحث</span>
        </Link>

        {/* 5. Central Floating Home Tab */}
        <Link
          to="/"
          className="flex flex-col items-center justify-center relative -top-4 sm:-top-5"
        >
          <div className="absolute inset-0 bg-purple-600 rounded-full blur-xl opacity-60" />
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#0F0C1B] border-2 border-purple-500 flex flex-col items-center justify-center text-white relative z-10 shadow-[0_0_20px_rgba(123,63,255,0.6)] transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg, #7b3fff 0%, #4f24e0 100%)" }}
          >
            <Home className="h-5 w-5 text-white" />
            <span className="text-[9px] font-bold text-white mt-0.5">الرئيسية</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
