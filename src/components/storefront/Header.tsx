import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Plus, Search, Bell, ShoppingCart, X, Sparkles, ShieldCheck, Heart, Sun, Moon, History, MessageCircle, Smartphone, Flame } from 'lucide-react';
import { Product, Currency } from './types';
import { formatPrice } from './currency';
import { getRecentSearches, saveRecentSearch, removeRecentSearch, clearRecentSearches } from './searchHistory';
import { StoreLogo } from './StoreLogo';
import { STORE_INFO } from './constants';
import { LiteModeToggle } from './LiteModeToggle';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  unreadNotificationsCount: number;
  wishlistCount?: number;
  compareCount?: number;
  products?: Product[];
  currency?: Currency;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenCart: () => void;
  onOpenNotifications: () => void;
  onOpenWishlist?: () => void;
  onOpenCompare?: () => void;
  onOpenMenu: () => void;
  onOpenTracker: () => void;
  onOpenAdmin?: () => void;
  onSelectProduct?: (product: Product) => void;
  isAdminUser?: boolean;
  onOpenAppDownload?: () => void;
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  cartCount,
  unreadNotificationsCount,
  wishlistCount = 0,
  compareCount = 0,
  products = [],
  currency = 'YER',
  theme = 'dark',
  onToggleTheme,
  onOpenCart,
  onOpenNotifications,
  onOpenWishlist,
  onOpenCompare,
  onOpenMenu,
  onOpenTracker,
  onOpenAdmin,
  onSelectProduct,
  isAdminUser = false,
  onOpenAppDownload,
  selectedCategory = 'all',
  onSelectCategory,
}) => {
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const prevCartCount = useRef(cartCount);

  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setIsCartBouncing(true);
      const timer = setTimeout(() => setIsCartBouncing(false), 600);
      return () => clearTimeout(timer);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const handleSaveSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = saveRecentSearch(term);
    setRecentSearches(updated);
  };

  const handleRemoveSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const updated = removeRecentSearch(term);
    setRecentSearches(updated);
  };

  const handleClearAllSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = clearRecentSearches();
    setRecentSearches(updated);
  };

  const autocompleteMatches = searchQuery.trim().length > 0
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsAutocompleteOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[var(--glass-bg)] backdrop-blur-xl px-3 sm:px-6 py-2 border-b border-[var(--color-border-default)] shadow-[var(--shadow-sm)] transition-colors dir-rtl">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
        {/* 1. Primary Action: Shopping Cart Button with Badge */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          animate={isCartBouncing ? { y: [0, -6, 2, -3, 0], scale: [1, 1.15, 0.96, 1.05, 1] } : { y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          onClick={onOpenCart}
          aria-label="سلة التسوق"
          title="سلة التسوق"
          className="relative min-w-[44px] min-h-[44px] w-11 h-11 text-[var(--color-text-primary)] flex items-center justify-center rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] transition-all cursor-pointer shrink-0 shadow-sm"
        >
          <motion.div
            animate={isCartBouncing ? { rotate: [0, -12, 12, -8, 8, 0] } : { rotate: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ShoppingCart className="w-5 h-5 text-[#2F6BFF]" />
          </motion.div>
          {cartCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={isCartBouncing ? { scale: [1, 1.35, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className="absolute -top-1.5 -right-1.5 bg-[#2F6BFF] text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[var(--color-bg)] shadow-md shadow-blue-500/30"
            >
              {cartCount}
            </motion.span>
          )}
        </motion.button>

        {/* Desktop Secondary Actions (Hidden on compact mobile screens to keep header clean) */}
        <div className="hidden lg:flex items-center gap-2">
          {onOpenWishlist && (
            <button
              onClick={onOpenWishlist}
              aria-label="المفضلة"
              title="المفضلة"
              className="relative w-10 h-10 text-[var(--color-text-primary)] flex items-center justify-center rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] transition-all cursor-pointer shrink-0 shadow-sm"
            >
              <Heart className="w-4 h-4 text-rose-400" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onOpenNotifications}
            aria-label="الإشعارات"
            title="الإشعارات"
            className="relative w-10 h-10 text-[var(--color-text-primary)] flex items-center justify-center rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] transition-all cursor-pointer shrink-0 shadow-sm"
          >
            <Bell className="w-4 h-4 text-[var(--color-text-secondary)]" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-amber-400 border-2 border-[var(--color-bg)] w-2.5 h-2.5 rounded-full" />
            )}
          </button>

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
              title={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
              className="w-10 h-10 flex items-center justify-center border border-[var(--color-border-default)] rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] transition-all cursor-pointer shrink-0 text-amber-400 shadow-sm"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
            </button>
          )}

          <LiteModeToggle variant="button" />
        </div>

        {/* 4. Centered Search Bar with Autocomplete Dropdown */}
        <div ref={searchRef} className="flex-grow relative h-10 sm:h-11 mx-1 max-w-2xl">
          <input
            type="text"
            value={searchQuery}
            onFocus={() => {
              setRecentSearches(getRecentSearches());
              setIsAutocompleteOpen(true);
            }}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setIsAutocompleteOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                handleSaveSearch(searchQuery);
                setIsAutocompleteOpen(false);
              }
            }}
            placeholder="ابحث عن المنتجات، الساعات، الإلكترونيات..."
            aria-label="بحث عن المنتجات"
            className="w-full h-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] focus:border-[var(--color-primary)] rounded-full pr-10 pl-10 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] text-right focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]/20 transition-all shadow-inner"
          />
          {/* Right Search Icon */}
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] w-4 h-4 pointer-events-none" />
          
          {/* Left Sparkle Icon inside input */}
          <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400 w-4 h-4 pointer-events-none" />

          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange('');
                setIsAutocompleteOpen(false);
              }}
              aria-label="مسح البحث"
              className="absolute left-9 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Autocomplete & Recent Searches Dropdown */}
          <AnimatePresence>
            {isAutocompleteOpen && (searchQuery.trim().length > 0 || recentSearches.length > 0) && (
              <motion.div
                key="header-autocomplete-dropdown"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute top-12 left-0 right-0 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-2xl shadow-xl p-3 z-50 space-y-3"
              >
                {/* 1. Recent Search Quick-Access Chips */}
                {recentSearches.length > 0 && (
                  <div className="border-b border-[var(--color-border-subtle)] pb-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[var(--color-text-muted)] mb-2">
                      <span className="flex items-center gap-1.5 text-[#2F6BFF]">
                        <History className="w-3.5 h-3.5" />
                        <span>عمليات البحث الأخيرة (آخر 5)</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleClearAllSearches}
                        className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                      >
                        مسح الكل
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 dir-rtl">
                      {recentSearches.map((term, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-1 bg-[var(--color-surface-2)] hover:bg-[#2F6BFF]/15 text-[var(--color-text-primary)] border border-[var(--color-border-default)] hover:border-[#2F6BFF]/40 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer group"
                        >
                          <span
                            onClick={() => {
                              onSearchChange(term);
                              handleSaveSearch(term);
                              setIsAutocompleteOpen(false);
                            }}
                            className="flex items-center gap-1"
                          >
                            <span>{term}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveSearch(e, term)}
                            className="text-[var(--color-text-muted)] hover:text-rose-400 p-0.5 rounded-full transition-colors"
                            title="حذف"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Autocomplete Product Suggestions */}
                {searchQuery.trim().length > 0 && (
                  <div>
                    {autocompleteMatches.length === 0 ? (
                      <div className="p-3 text-center text-xs text-[var(--color-text-secondary)]">
                        لا توجد نتائج مطابقة لـ &quot;{searchQuery}&quot; 🔍
                      </div>
                    ) : (
                      <>
                        <div className="px-1 py-1 text-[11px] font-bold text-[var(--color-text-muted)] text-right">
                          اقتراحات المنتجات ({autocompleteMatches.length})
                        </div>
                        <div className="space-y-1">
                          {autocompleteMatches.map((product) => (
                            <div
                              key={product.id}
                              onClick={() => {
                                handleSaveSearch(product.name);
                                if (onSelectProduct) onSelectProduct(product);
                                setIsAutocompleteOpen(false);
                              }}
                              className="p-2 flex items-center gap-3 hover:bg-[var(--color-surface-2)] rounded-xl cursor-pointer transition-colors"
                            >
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-10 h-10 object-contain rounded-lg bg-[var(--color-surface-2)] p-1 border border-[var(--color-border-subtle)]"
                              />
                              <div className="flex-1 min-w-0 text-right">
                                <div className="text-xs font-bold text-[var(--color-text-primary)] line-clamp-1">{product.name}</div>
                                <div className="text-[10px] text-[var(--color-text-secondary)] line-clamp-1">{product.subtitle}</div>
                              </div>
                              <div className="text-xs font-extrabold text-[var(--color-text-primary)] shrink-0">
                                {formatPrice(product.priceYER, currency as Currency)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
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
            aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
            title={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center border border-[var(--color-border-default)] rounded-2xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] transition-all cursor-pointer shrink-0 text-amber-400 shadow-sm"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-blue-600" />
            )}
          </motion.button>
        )}

        {/* Lite Mode Network Speed Button (Desktop only in header to keep mobile clean) */}
        <div className="hidden sm:block">
          <LiteModeToggle variant="button" />
        </div>

        {/* App Download Button (SHEIN style) */}
        {onOpenAppDownload && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenAppDownload}
            aria-label="تحميل التطبيق"
            title="حمّل تطبيق إندكس ستور واحصل على خصم 15%"
            className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-neutral-900 text-white hover:bg-black transition-all cursor-pointer shrink-0 shadow-sm border border-neutral-700/60"
          >
            <Smartphone className="w-4 h-4 text-[#F93A00]" />
            <span className="text-xs font-black">حمّل التطبيق</span>
            <span className="bg-[#F93A00] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
              -15%
            </span>
          </motion.button>
        )}

        {/* 6. Plus / Fast Tracker Button (Desktop / Tablet) */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenTracker}
          aria-label="تتبع الطلب"
          className="hidden sm:flex w-10 h-10 sm:w-11 sm:h-11 items-center justify-center text-white border border-blue-500/30 rounded-2xl bg-[#2F6BFF] hover:bg-[#2458D8] transition-all cursor-pointer shrink-0 shadow-md shadow-blue-600/20"
          title="تتبع طلبي المباشر"
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>

        {/* 7. Admin Panel Control Button (Only for authenticated Admin/Owner) */}
        {isAdminUser && onOpenAdmin && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenAdmin}
            aria-label="لوحة التحكم"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all cursor-pointer shrink-0 shadow-md ${
              isAdminUser
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white font-black border border-purple-400/50 shadow-purple-900/40'
                : 'bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-emerald-400 border border-[var(--color-border-default)] font-bold'
            }`}
            title="لوحة تحكم الأدمن"
          >
            <ShieldCheck className={`w-5 h-5 ${isAdminUser ? 'text-amber-300' : 'text-emerald-400'}`} />
            <span className="text-xs font-black whitespace-nowrap hidden sm:inline">لوحة التحكم</span>
          </motion.button>
        )}

        {/* 8. Rightmost: Hamburger Menu Toggle & Store Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <StoreLogo variant="header" />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenMenu}
            aria-label="القائمة الرئيسية"
            title="القائمة الرئيسية"
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-[var(--color-text-primary)] border border-[var(--color-border-default)] rounded-2xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] transition-all cursor-pointer shrink-0 shadow-sm"
          >
            <Menu className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </motion.button>
        </div>
      </div>

      {/* 9. SHEIN-Style Sub-Navigation Bar */}
      {onSelectCategory && (
        <div className="w-full max-w-7xl mx-auto mt-2 pt-1 border-t border-[var(--color-border-subtle)] flex items-center justify-between overflow-x-auto no-scrollbar text-xs font-bold gap-4 sm:gap-6 text-[var(--color-text-secondary)] whitespace-nowrap px-1">
          <button
            onClick={() => onSelectCategory('all')}
            className={`py-1 transition-colors hover:text-black dark:hover:text-white ${
              selectedCategory === 'all' ? 'text-[#F93A00] font-black border-b-2 border-[#F93A00]' : ''
            }`}
          >
            جميع الفئات
          </button>
          <button
            onClick={() => onSelectCategory('smartwatches')}
            className={`py-1 transition-colors hover:text-black dark:hover:text-white ${
              selectedCategory === 'smartwatches' ? 'text-[#F93A00] font-black border-b-2 border-[#F93A00]' : ''
            }`}
          >
            ساعات ذكية
          </button>
          <button
            onClick={() => onSelectCategory('audio')}
            className={`py-1 transition-colors hover:text-black dark:hover:text-white ${
              selectedCategory === 'audio' ? 'text-[#F93A00] font-black border-b-2 border-[#F93A00]' : ''
            }`}
          >
            سماعات وصوتيات
          </button>
          <button
            onClick={() => onSelectCategory('accessories')}
            className={`py-1 transition-colors hover:text-black dark:hover:text-white ${
              selectedCategory === 'accessories' ? 'text-[#F93A00] font-black border-b-2 border-[#F93A00]' : ''
            }`}
          >
            شواحن وإكسسوارات
          </button>
          <button
            onClick={() => onSelectCategory('home_appliances')}
            className={`py-1 transition-colors hover:text-black dark:hover:text-white ${
              selectedCategory === 'home_appliances' ? 'text-[#F93A00] font-black border-b-2 border-[#F93A00]' : ''
            }`}
          >
            أجهزة ومنزل
          </button>
          <button
            onClick={() => onSelectCategory('perfumes')}
            className={`py-1 transition-colors hover:text-black dark:hover:text-white ${
              selectedCategory === 'perfumes' ? 'text-[#F93A00] font-black border-b-2 border-[#F93A00]' : ''
            }`}
          >
            عطور وبخور
          </button>
          <button
            onClick={() => onSelectCategory('automotive')}
            className={`py-1 transition-colors hover:text-black dark:hover:text-white ${
              selectedCategory === 'automotive' ? 'text-[#F93A00] font-black border-b-2 border-[#F93A00]' : ''
            }`}
          >
            مستلزمات السيارات
          </button>
          <button
            onClick={() => onSelectCategory('all')}
            className="py-1 text-[#F93A00] font-black flex items-center gap-1 hover:underline"
          >
            <Flame className="w-3.5 h-3.5" />
            عروض اليوم
          </button>
        </div>
      )}
    </header>
  );
};
