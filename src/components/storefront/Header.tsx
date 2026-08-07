import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Plus,
  Search,
  Bell,
  ShoppingCart,
  X,
  Sparkles,
  ShieldCheck,
  Heart,
  Sun,
  Moon,
} from "lucide-react";
import { Product, Currency } from "./types";
import { formatPrice } from "./currency";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  unreadNotificationsCount: number;
  wishlistCount?: number;
  compareCount?: number;
  products?: Product[];
  currency?: Currency;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
  onOpenCart: () => void;
  onOpenNotifications: () => void;
  onOpenWishlist?: () => void;
  onOpenCompare?: () => void;
  onOpenMenu: () => void;
  onOpenTracker: () => void;
  onOpenAdmin?: () => void;
  onSelectProduct?: (product: Product) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  cartCount,
  unreadNotificationsCount,
  wishlistCount = 0,
  compareCount = 0,
  products = [],
  currency = "YER",
  theme = "dark",
  onToggleTheme,
  onOpenCart,
  onOpenNotifications,
  onOpenWishlist,
  onOpenCompare,
  onOpenMenu,
  onOpenTracker,
  onOpenAdmin,
  onSelectProduct,
}) => {
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const autocompleteMatches =
    searchQuery.trim().length > 0
      ? products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.category.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .slice(0, 5)
      : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsAutocompleteOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#08060F]/90 backdrop-blur-xl px-3 sm:px-6 py-2 border-b border-gray-800/80 shadow-md transition-colors dir-rtl">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
        {/* 1. Leftmost: Shopping Cart Button with Badge */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenCart}
          aria-label="سلة التسوق"
          title="سلة التسوق"
          className="relative w-10 h-10 sm:w-11 sm:h-11 text-white flex items-center justify-center rounded-2xl border border-gray-800 bg-[#120D22] hover:bg-[#1A1430] transition-all cursor-pointer shrink-0 shadow-sm"
        >
          <ShoppingCart className="w-5 h-5 text-[#7B3FFF]" />
          {cartCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={cartCount}
              className="absolute -top-1.5 -right-1.5 bg-[#7B3FFF] text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#08060F] shadow-md shadow-purple-500/30"
            >
              {cartCount}
            </motion.span>
          )}
        </motion.button>

        {/* 2. Wishlist Button */}
        {onOpenWishlist && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenWishlist}
            aria-label="المفضلة"
            title="المفضلة"
            className="relative w-10 h-10 sm:w-11 sm:h-11 text-white flex items-center justify-center rounded-2xl border border-gray-800 bg-[#120D22] hover:bg-[#1A1430] transition-all cursor-pointer shrink-0 shadow-sm"
          >
            <Heart className="w-5 h-5 text-rose-400" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#08060F]">
                {wishlistCount}
              </span>
            )}
          </motion.button>
        )}

        {/* 3. Notification Bell Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenNotifications}
          aria-label="الإشعارات"
          title="الإشعارات"
          className="relative w-10 h-10 sm:w-11 sm:h-11 text-white flex items-center justify-center rounded-2xl border border-gray-800 bg-[#120D22] hover:bg-[#1A1430] transition-all cursor-pointer shrink-0 shadow-sm"
        >
          <Bell className="w-5 h-5 text-gray-400" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-amber-400 border-2 border-[#08060F] w-2.5 h-2.5 rounded-full" />
          )}
        </motion.button>

        {/* 4. Centered Search Bar with Autocomplete Dropdown */}
        <div ref={searchRef} className="flex-grow relative h-10 sm:h-11 mx-1 max-w-2xl">
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsAutocompleteOpen(true)}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setIsAutocompleteOpen(true);
            }}
            placeholder="ابحث عن المنتجات، الساعات، الإلكترونيات..."
            aria-label="بحث عن المنتجات"
            className="w-full h-full bg-[#120D22] border border-gray-800 focus:border-[#7B3FFF] rounded-full pr-10 pl-10 text-xs sm:text-sm text-white placeholder-gray-500 text-right focus:outline-none focus:ring-2 focus:ring-[#7B3FFF]/20 transition-all shadow-inner"
          />
          {/* Right Search Icon */}
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />

          {/* Left Sparkle Icon inside input */}
          <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 w-4 h-4 pointer-events-none" />

          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange("");
                setIsAutocompleteOpen(false);
              }}
              aria-label="مسح البحث"
              className="absolute left-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {isAutocompleteOpen && searchQuery.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute top-12 left-0 right-0 bg-[#120D22] border border-gray-800 rounded-2xl shadow-xl p-2 z-50 divide-y divide-gray-800/60"
              >
                {autocompleteMatches.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">
                    لا توجد نتائج مطابقة لـ &quot;{searchQuery}&quot; 🔍
                  </div>
                ) : (
                  <>
                    <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 text-right">
                      اقتراحات البحث السريعة ({autocompleteMatches.length})
                    </div>
                    {autocompleteMatches.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => {
                          if (onSelectProduct) onSelectProduct(product);
                          setIsAutocompleteOpen(false);
                        }}
                        className="p-2 flex items-center gap-3 hover:bg-[#1C1632] rounded-xl cursor-pointer transition-colors"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 object-contain rounded-lg bg-[#08060F] p-1 border border-gray-800"
                        />
                        <div className="flex-1 min-w-0 text-right">
                          <div className="text-xs font-bold text-white line-clamp-1">
                            {product.name}
                          </div>
                          <div className="text-[10px] text-gray-400 line-clamp-1">
                            {product.subtitle}
                          </div>
                        </div>
                        <div className="text-xs font-extrabold text-white shrink-0">
                          {formatPrice(product.priceYER, currency as Currency)}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 5. Dark / Light Theme Toggle Button */}
        {onToggleTheme && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
            title={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center border border-gray-800 rounded-2xl bg-[#120D22] hover:bg-[#1A1430] transition-all cursor-pointer shrink-0 text-amber-400 shadow-sm"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-blue-600" />
            )}
          </motion.button>
        )}

        {/* 6. Plus / Fast Tracker Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenTracker}
          aria-label="تتبع الطلب"
          className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-white border border-purple-500/30 rounded-2xl bg-[#7B3FFF] hover:bg-[#682BDD] transition-all cursor-pointer shrink-0 shadow-md shadow-purple-600/20"
          title="تتبع طلبي المباشر"
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>

        {/* 7. Admin Panel Shield Button */}
        {onOpenAdmin && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenAdmin}
            aria-label="لوحة الأدمن"
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-emerald-400 border border-gray-800 rounded-2xl bg-[#120D22] hover:bg-[#1A1430] transition-all cursor-pointer shrink-0 shadow-sm"
            title="لوحة تحكم الأدمن"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </motion.button>
        )}

        {/* 8. Rightmost: Hamburger Menu Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenMenu}
          aria-label="القائمة الرئيسية"
          title="القائمة الرئيسية"
          className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-white border border-gray-800 rounded-2xl bg-[#120D22] hover:bg-[#1A1430] transition-all cursor-pointer shrink-0 shadow-sm"
        >
          <Menu className="w-5 h-5 text-gray-400" />
        </motion.button>
      </div>
    </header>
  );
};
