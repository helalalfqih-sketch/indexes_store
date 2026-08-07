import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SortOption } from "./types";
import {
  Grid,
  Shirt,
  Sparkles,
  Heart,
  Headphones,
  Home,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Flame,
  CheckCircle2,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

interface CategoryBarProps {
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  selectedSort: SortOption;
  onSelectSort: (sort: SortOption) => void;
}

const CATEGORY_ITEMS = [
  { id: "all", name: "المزيد", icon: Grid },
  { id: "fashion", name: "الأزياء", icon: Shirt },
  { id: "perfumes", name: "العطور", icon: Sparkles },
  { id: "beauty", name: "العناية", icon: Heart },
  { id: "electronics", name: "الإلكترونيات", icon: Headphones },
  { id: "home", name: "المنزل", icon: Home },
];

const SORT_OPTIONS: { id: SortOption; label: string; icon: LucideIcon; badge?: string }[] = [
  { id: "default", label: "الترتيب الافتراضي", icon: SlidersHorizontal },
  { id: "price-high", label: "الأعلى سعراً", icon: TrendingUp },
  { id: "price-low", label: "الأقل سعراً", icon: TrendingDown },
  { id: "best-selling", label: "الأكثر مبيعاً", icon: Flame, badge: "شائع" },
  { id: "newest", label: "الأحدث وصولاً", icon: Sparkles, badge: "جديد" },
];

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategoryId,
  onSelectCategory,
  selectedSort,
  onSelectSort,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentSortObj = SORT_OPTIONS.find((s) => s.id === selectedSort) || SORT_OPTIONS[0];
  const CurrentIcon = currentSortObj.icon;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="px-3 sm:px-6 py-2 space-y-3">
      {/* 6 Category Square Cards Grid */}
      <div className="grid grid-cols-6 gap-2 sm:gap-3">
        {CATEGORY_ITEMS.map((cat, idx) => {
          const isSelected = selectedCategoryId === cat.id;
          const IconComp = cat.icon;
          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl border transition-all cursor-pointer backdrop-blur-md relative overflow-hidden ${
                isSelected
                  ? "bg-[#7B3FFF]/20 border-[#7B3FFF] text-white shadow-sm"
                  : "bg-[#100B1A]/80 border-gray-800 text-gray-300 hover:border-gray-700 hover:text-white hover:bg-[#18112B]"
              }`}
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-1 transition-transform ${
                  isSelected ? "bg-[#7B3FFF] text-white scale-110" : "bg-[#18112B] text-gray-400"
                }`}
              >
                <IconComp className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-center line-clamp-1">
                {cat.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Sorting Filter Bar */}
      <div className="bg-[#100B1A]/80 border border-gray-800 rounded-2xl p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-sm backdrop-blur-md relative">
        {/* Left Side: Filter Label & Interactive Dropdown Trigger */}
        <div
          className="flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto relative"
          ref={dropdownRef}
        >
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-[#18112B] hover:bg-[#201838] border border-gray-800 hover:border-[#7B3FFF] px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md active:scale-95 group"
          >
            <CurrentIcon className="w-3.5 h-3.5 text-[#7B3FFF] group-hover:rotate-12 transition-transform" />
            <span className="text-gray-300">{currentSortObj.label}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Animated Dropdown Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 w-52 bg-[#120D22] border border-gray-800 rounded-2xl p-1.5 shadow-xl z-50 backdrop-blur-xl space-y-1 dir-rtl"
              >
                {SORT_OPTIONS.map((opt) => {
                  const isOptSelected = selectedSort === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        onSelectSort(opt.id as SortOption);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isOptSelected
                          ? "bg-[#7B3FFF] text-white shadow-md"
                          : "text-gray-300 hover:bg-[#1C1632] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-current" />
                        <span>{opt.label}</span>
                      </div>

                      {isOptSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
