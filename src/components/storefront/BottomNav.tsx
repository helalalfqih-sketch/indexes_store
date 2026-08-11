import React from "react";
import { motion } from "framer-motion";
import { ActiveTab } from "./types";
import { STORE_INFO } from "./constants";
import { ShoppingCart, Tag, Home, MessageCircle, User } from "lucide-react";

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  cartCount: number;
  onOpenSupport?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  onOpenSupport,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-[var(--glass-bg)] backdrop-blur-2xl border-t border-[var(--color-border-default)] z-50 rounded-t-[28px] pb-[calc(8px+env(safe-area-inset-bottom,0px))] pt-2 px-4 shadow-[var(--shadow-lg)] transition-colors">
      <div className="max-w-md mx-auto flex justify-between items-center relative dir-rtl">
        {/* 1. السلة (Cart - Rightmost in RTL) */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setActiveTab("cart")}
          aria-label="السلة"
          className="flex flex-col items-center justify-center min-w-[56px] py-1 transition-all cursor-pointer group relative"
        >
          <div className="relative">
            <ShoppingCart
              className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200 ${
                activeTab === "cart"
                  ? "text-[#2F6BFF] scale-110"
                  : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]"
              }`}
            />
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-2 bg-[#2F6BFF] text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-[var(--color-bg)]"
              >
                {cartCount}
              </motion.span>
            )}
          </div>
          <span
            className={`text-[11px] font-bold mt-1 transition-colors ${
              activeTab === "cart"
                ? "text-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"
            }`}
          >
            السلة
          </span>
          {activeTab === "cart" && (
            <motion.span
              layoutId="activeDot"
              className="w-1.5 h-1.5 bg-[#2F6BFF] rounded-full mt-0.5"
            />
          )}
        </motion.button>

        {/* 2. العروض (Offers) */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setActiveTab("offers")}
          aria-label="العروض"
          className="flex flex-col items-center justify-center min-w-[56px] py-1 transition-all cursor-pointer group relative"
        >
          <div className="relative">
            <Tag
              className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200 ${
                activeTab === "offers"
                  ? "text-amber-400 scale-110"
                  : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]"
              }`}
            />
            <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          </div>
          <span
            className={`text-[11px] font-bold mt-1 transition-colors ${
              activeTab === "offers"
                ? "text-amber-400"
                : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"
            }`}
          >
            العروض
          </span>
          {activeTab === "offers" && (
            <motion.span
              layoutId="activeDot"
              className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-0.5"
            />
          )}
        </motion.button>

        {/* 3. CENTER ELEVATED BUTTON - الرئيسية (Home) */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("home")}
          aria-label="الصفحة الرئيسية"
          className="flex flex-col items-center justify-center -mt-6 relative z-10 cursor-pointer group"
        >
          <div
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full p-0.5 bg-[#2F6BFF] shadow-md shadow-blue-500/30 transition-all duration-300 ${
              activeTab === "home" ? "ring-2 ring-blue-400/90" : ""
            }`}
          >
            <div className="w-full h-full bg-[#2F6BFF] rounded-full flex items-center justify-center border border-white/20">
              <Home className="w-6 h-6 text-white" />
            </div>
          </div>
          <span className="text-[11px] text-[var(--color-text-primary)] mt-1 font-black tracking-wide">
            الرئيسية
          </span>
        </motion.button>

        {/* 4. الدعم / واتساب (WhatsApp Support Hub) */}
        <button
          type="button"
          onClick={() => {
            if (onOpenSupport) onOpenSupport();
          }}
          aria-label="تواصل عبر مركز المساعدة"
          className="flex flex-col items-center justify-center min-w-[56px] py-1 transition-all cursor-pointer group relative"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 group-hover:scale-110 transition-transform fill-emerald-500/20" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-[11px] font-bold mt-1 text-[var(--color-text-muted)] group-hover:text-emerald-400 transition-colors">
            الدعم
          </span>
        </button>

        {/* 5. حسابي (Account - Leftmost in RTL) */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setActiveTab("account")}
          aria-label="حسابي"
          className="flex flex-col items-center justify-center min-w-[56px] py-1 transition-all cursor-pointer group"
        >
          <User
            className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200 ${
              activeTab === "account"
                ? "text-[#2F6BFF] scale-110"
                : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]"
            }`}
          />
          <span
            className={`text-[11px] font-bold mt-1 transition-colors ${
              activeTab === "account"
                ? "text-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"
            }`}
          >
            حسابي
          </span>
          {activeTab === "account" && (
            <motion.span
              layoutId="activeDot"
              className="w-1.5 h-1.5 bg-[#2F6BFF] rounded-full mt-0.5"
            />
          )}
        </motion.button>
      </div>

      {/* Bottom Home Indicator Bar */}
      <div className="w-24 h-1 bg-[var(--color-border-subtle)] rounded-full mx-auto mt-2" />
    </nav>
  );
};
