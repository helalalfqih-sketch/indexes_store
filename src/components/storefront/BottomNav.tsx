import React from "react";
import { motion } from "framer-motion";
import { ActiveTab } from "./types";
import { ShoppingCart, Search, Home, LayoutGrid, User } from "lucide-react";

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  cartCount: number;
  onOpenSupport?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, cartCount }) => {
  const tabs: { key: ActiveTab; label: string; icon: React.ReactNode; ariaLabel: string }[] = [
    { key: "account", label: "أنا", ariaLabel: "حسابي", icon: <User className="h-5 w-5" /> },
    {
      key: "categories" as ActiveTab,
      label: "القنوات",
      ariaLabel: "القنوات والتصنيفات",
      icon: <LayoutGrid className="h-5 w-5" />,
    },
    {
      key: "home",
      label: "الرئيسية",
      ariaLabel: "الصفحة الرئيسية",
      icon: <Home className="h-5 w-5" />,
    },
    { key: "search", label: "البحث", ariaLabel: "البحث", icon: <Search className="h-5 w-5" /> },
    {
      key: "cart",
      label: "حقيبة التسوق",
      ariaLabel: "حقيبة التسوق",
      icon: <ShoppingCart className="h-5 w-5" />,
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white pb-[calc(5px+env(safe-area-inset-bottom,0px))] text-black md:hidden"
      aria-label="التنقل السفلي"
      dir="rtl"
    >
      <div className="mx-auto grid h-[58px] max-w-md grid-cols-5 items-center px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <motion.button
              key={tab.key}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => setActiveTab(tab.key)}
              aria-label={tab.ariaLabel}
              className={`relative flex h-full min-w-0 flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${isActive ? "font-black text-black" : "text-neutral-500"}`}
            >
              <span className="relative grid h-6 place-items-center">
                {React.cloneElement(tab.icon as React.ReactElement<{ className?: string }>, {
                  className: `h-5 w-5 ${isActive ? "stroke-[2.2]" : "stroke-[1.5]"}`,
                })}
                {tab.key === "cart" && cartCount > 0 && (
                  <span className="absolute -right-2 -top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[#ff2442] px-0.5 text-[8px] font-black text-white">
                    {cartCount}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate px-0.5">{tab.label}</span>
              {isActive && <span className="absolute inset-x-4 bottom-0 h-[2px] bg-black" />}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
