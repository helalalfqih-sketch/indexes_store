import React from 'react';
import { motion } from 'framer-motion';
import { ActiveTab } from './types';
import { ShoppingCart, Search, Home, LayoutGrid, User } from 'lucide-react';

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
}) => {
  const tabs: { key: ActiveTab; label: string; icon: React.ReactNode; ariaLabel: string }[] = [
    {
      key: 'cart',
      label: 'السلة',
      ariaLabel: 'السلة',
      icon: (
        <div className="relative">
          <ShoppingCart
            className={`w-5 h-5 transition-all duration-200 ${
              activeTab === 'cart'
                ? 'text-[#2F6BFF] scale-110'
                : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]'
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
      ),
    },
    {
      key: 'search',
      label: 'البحث',
      ariaLabel: 'البحث',
      icon: (
        <Search
          className={`w-5 h-5 transition-all duration-200 ${
            activeTab === 'search'
              ? 'text-[#2F6BFF] scale-110'
              : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]'
          }`}
        />
      ),
    },
    {
      key: 'home',
      label: 'الرئيسية',
      ariaLabel: 'الصفحة الرئيسية',
      icon: null, // handled separately as elevated center button
    },
    {
      key: 'categories' as ActiveTab,
      label: 'التصنيفات',
      ariaLabel: 'التصنيفات',
      icon: (
        <LayoutGrid
          className={`w-5 h-5 transition-all duration-200 ${
            activeTab === ('categories' as ActiveTab)
              ? 'text-[#2F6BFF] scale-110'
              : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]'
          }`}
        />
      ),
    },
    {
      key: 'account',
      label: 'حسابي',
      ariaLabel: 'حسابي',
      icon: (
        <User
          className={`w-5 h-5 transition-all duration-200 ${
            activeTab === 'account'
              ? 'text-[#2F6BFF] scale-110'
              : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]'
          }`}
        />
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-[var(--glass-bg)] backdrop-blur-2xl border-t border-[var(--color-border-default)] z-50 rounded-t-[28px] pb-[calc(8px+env(safe-area-inset-bottom,0px))] pt-2 px-4 shadow-[var(--shadow-lg)] transition-colors">
      <div className="max-w-md mx-auto flex justify-between items-center relative dir-rtl">
        {tabs.map((tab) => {
          if (tab.key === 'home') {
            return (
              <motion.button
                key="home"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('home')}
                aria-label="الصفحة الرئيسية"
                className="flex flex-col items-center justify-center -mt-6 relative z-10 cursor-pointer group"
              >
                <div
                  className={`w-13 h-13 rounded-full p-0.5 bg-[#2F6BFF] shadow-md shadow-blue-500/30 transition-all duration-300 ${
                    activeTab === 'home' ? 'ring-2 ring-blue-400/90' : ''
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
            );
          }

          return (
            <motion.button
              key={tab.key}
              whileTap={{ scale: 0.92 }}
              onClick={() => setActiveTab(tab.key)}
              aria-label={tab.ariaLabel}
              className="flex flex-col items-center justify-center min-w-[56px] py-1 transition-all cursor-pointer group"
            >
              {tab.icon}
              <span
                className={`text-[11px] font-bold mt-1 transition-colors ${
                  activeTab === tab.key
                    ? 'text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]'
                }`}
              >
                {tab.label}
              </span>
              {activeTab === tab.key && (
                <motion.span
                  layoutId="activeDot"
                  className="w-1.5 h-1.5 bg-[#2F6BFF] rounded-full mt-0.5"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Bottom Home Indicator Bar */}
      <div className="w-24 h-1 bg-[var(--color-border-subtle)] rounded-full mx-auto mt-2" />
    </nav>
  );
};
