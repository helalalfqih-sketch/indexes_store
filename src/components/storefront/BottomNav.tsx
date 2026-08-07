import React from "react";
import { motion } from "framer-motion";
import { ActiveTab } from "./types";
import { ShoppingCart, Search, Home, MessageCircle, User } from "lucide-react";

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  cartCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, cartCount }) => {
  const whatsappUrl = `https://wa.me/967771370740?text=${encodeURIComponent(
    "السلام عليكم، أود الاستفسار عن منتجات متجر إندكس",
  )}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-[#08060F]/90 backdrop-blur-2xl border-t border-gray-800 z-50 rounded-t-[28px] pb-3 pt-2 px-4 shadow-lg transition-colors">
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
                  ? "text-[#7B3FFF] scale-110"
                  : "text-gray-400 group-hover:text-white"
              }`}
            />
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-2 bg-[#7B3FFF] text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-[#08060F]"
              >
                {cartCount}
              </motion.span>
            )}
          </div>
          <span
            className={`text-[11px] font-bold mt-1 transition-colors ${
              activeTab === "cart" ? "text-white" : "text-gray-400 group-hover:text-gray-300"
            }`}
          >
            السلة
          </span>
          {activeTab === "cart" && (
            <motion.span
              layoutId="activeDot"
              className="w-1.5 h-1.5 bg-[#7B3FFF] rounded-full mt-0.5"
            />
          )}
        </motion.button>

        {/* 2. البحث (Search) */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setActiveTab("search")}
          aria-label="البحث"
          className="flex flex-col items-center justify-center min-w-[56px] py-1 transition-all cursor-pointer group"
        >
          <Search
            className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200 ${
              activeTab === "search"
                ? "text-[#7B3FFF] scale-110"
                : "text-gray-400 group-hover:text-white"
            }`}
          />
          <span
            className={`text-[11px] font-bold mt-1 transition-colors ${
              activeTab === "search" ? "text-white" : "text-gray-400 group-hover:text-gray-300"
            }`}
          >
            البحث
          </span>
          {activeTab === "search" && (
            <motion.span
              layoutId="activeDot"
              className="w-1.5 h-1.5 bg-[#7B3FFF] rounded-full mt-0.5"
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
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full p-0.5 bg-[#7B3FFF] shadow-md shadow-purple-500/30 transition-all duration-300 ${
              activeTab === "home" ? "ring-2 ring-purple-400/90" : ""
            }`}
          >
            <div className="w-full h-full bg-[#7B3FFF] rounded-full flex items-center justify-center border border-white/20">
              <Home className="w-6 h-6 text-white" />
            </div>
          </div>
          <span className="text-[11px] text-white mt-1 font-black tracking-wide">الرئيسية</span>
        </motion.button>

        {/* 4. واتساب (WhatsApp) */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="تواصل عبر واتساب"
          className="flex flex-col items-center justify-center min-w-[56px] py-1 transition-all cursor-pointer group relative"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 group-hover:scale-110 transition-transform fill-emerald-500/20" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-[11px] font-bold mt-1 text-gray-400 group-hover:text-emerald-400 transition-colors">
            واتساب
          </span>
        </a>

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
                ? "text-[#7B3FFF] scale-110"
                : "text-gray-400 group-hover:text-white"
            }`}
          />
          <span
            className={`text-[11px] font-bold mt-1 transition-colors ${
              activeTab === "account" ? "text-white" : "text-gray-400 group-hover:text-gray-300"
            }`}
          >
            حسابي
          </span>
          {activeTab === "account" && (
            <motion.span
              layoutId="activeDot"
              className="w-1.5 h-1.5 bg-[#7B3FFF] rounded-full mt-0.5"
            />
          )}
        </motion.button>
      </div>

      {/* Bottom Home Indicator Bar */}
      <div className="w-24 h-1 bg-gray-800 rounded-full mx-auto mt-2" />
    </nav>
  );
};
