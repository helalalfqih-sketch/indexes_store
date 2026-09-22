import { STOREFRONT_CATEGORIES } from "./categories";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SortOption } from "./types";
import {
  Grid,
  Watch,
  Headphones,
  Sparkles,
  Home,
  Smartphone,
  Wrench,
  Car,
  Dumbbell,
  Baby,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Flame,
  CheckCircle2,
  ChevronDown,
  X,
  Filter,
  Banknote,
  Coins,
  ArrowUpDown,
  Sliders,
  Tag,
  Star,
  Award,
  Check,
  RotateCcw,
} from "lucide-react";

export type PriceRangePreset = "all" | "under-20k" | "20k-50k" | "over-50k" | "custom";

import { STORE_BRANDS, RATING_OPTIONS } from "./filter-options";

export interface CategoryBarProps {
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  selectedSort: SortOption;
  onSelectSort: (sort: SortOption) => void;
  selectedPriceRange?: PriceRangePreset;
  onSelectPriceRange?: (range: PriceRangePreset, customMin?: number, customMax?: number) => void;
  customMinPrice?: number;
  customMaxPrice?: number;
  selectedBrands?: string[];
  onSelectBrands?: (brands: string[]) => void;
  selectedRatings?: string[];
  onSelectRatings?: (ratings: string[]) => void;
}

const CATEGORY_ITEMS = STOREFRONT_CATEGORIES.map((category) => ({ ...category, icon: Grid }));

const PRICE_PRESETS: {
  id: PriceRangePreset;
  label: string;
  icon: React.ElementType<{ className?: string }>;
  sublabel: string;
}[] = [
  { id: "all", label: "كافة الأسعار", icon: Coins, sublabel: "الكل" },
  { id: "under-20k", label: "أقل من 20,000 ر.ي", icon: Banknote, sublabel: "منخفض" },
  { id: "20k-50k", label: "20,000 - 50,000 ر.ي", icon: Coins, sublabel: "متوسط" },
  { id: "over-50k", label: "أكثر من 50,000 ر.ي", icon: Sparkles, sublabel: "مرتفع" },
];

const SORT_OPTIONS: {
  id: SortOption;
  label: string;
  icon: React.ElementType<{ className?: string }>;
  badge?: string;
}[] = [
  { id: "default", label: "الترتيب الافتراضي", icon: SlidersHorizontal },
  { id: "price-low", label: "الأقل سعراً (منخفض-مرتفع)", icon: TrendingDown, badge: "رخيص" },
  { id: "price-high", label: "الأعلى سعراً (مرتفع-منخفض)", icon: TrendingUp, badge: "فاخر" },
  { id: "best-selling", label: "الأكثر مبيعاً", icon: Flame, badge: "شائع" },
  { id: "newest", label: "الأحدث وصولاً", icon: Sparkles, badge: "جديد" },
];

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategoryId,
  onSelectCategory,
  selectedSort,
  onSelectSort,
  selectedPriceRange = "all",
  onSelectPriceRange,
  customMinPrice,
  customMaxPrice,
  selectedBrands = [],
  onSelectBrands,
  selectedRatings = [],
  onSelectRatings,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCustomDrawerOpen, setIsCustomDrawerOpen] = useState(false);
  const [isBrandDrawerOpen, setIsBrandDrawerOpen] = useState(false);
  const [isRatingDrawerOpen, setIsRatingDrawerOpen] = useState(false);
  const [tempMin, setTempMin] = useState<string>(customMinPrice ? String(customMinPrice) : "");
  const [tempMax, setTempMax] = useState<string>(customMaxPrice ? String(customMaxPrice) : "");

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

  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = tempMin ? Number(tempMin) : undefined;
    const maxVal = tempMax ? Number(tempMax) : undefined;
    if (onSelectPriceRange) {
      onSelectPriceRange("custom", minVal, maxVal);
    }
    setIsCustomDrawerOpen(false);
  };

  const handleToggleBrand = (brandId: string) => {
    if (!onSelectBrands) return;
    if (selectedBrands.includes(brandId)) {
      onSelectBrands(selectedBrands.filter((b) => b !== brandId));
    } else {
      onSelectBrands([...selectedBrands, brandId]);
    }
  };

  const handleToggleRating = (ratingId: string) => {
    if (!onSelectRatings) return;
    if (selectedRatings.includes(ratingId)) {
      onSelectRatings(selectedRatings.filter((r) => r !== ratingId));
    } else {
      onSelectRatings([...selectedRatings, ratingId]);
    }
  };

  const handleResetAllFilters = () => {
    onSelectCategory("all");
    if (onSelectPriceRange) onSelectPriceRange("all");
    if (onSelectBrands) onSelectBrands([]);
    if (onSelectRatings) onSelectRatings([]);
    onSelectSort("default");
    setIsCustomDrawerOpen(false);
    setIsBrandDrawerOpen(false);
    setIsRatingDrawerOpen(false);
  };

  const hasActiveFilters =
    selectedCategoryId !== "all" ||
    selectedPriceRange !== "all" ||
    selectedBrands.length > 0 ||
    selectedRatings.length > 0 ||
    selectedSort !== "default";

  return (
    <div className="px-3 sm:px-6 py-2 space-y-3">
      {/* 1. Category Horizontal Scroll Row on Mobile & Desktop */}
      <div
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth dir-rtl"
        style={{ touchAction: "pan-x pan-y", scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {CATEGORY_ITEMS.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const IconComp = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              aria-label={`تصفية الفئة: ${cat.name}`}
              aria-pressed={isSelected}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-sm font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-[var(--color-primary-ui)] border-[var(--color-primary-ui)] text-white shadow-md shadow-blue-500/20"
                  : "bg-[var(--color-surface-1)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
              </div>
              <span className="whitespace-nowrap">{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Sub-Filter Bar for Price Range (شريط فلترة فرعي لنطاق السعر) */}
      <div className="bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-2xl p-2.5 space-y-2 shadow-sm dir-rtl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Right Label & Preset Pill Buttons */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <div className="flex items-center gap-1.5 text-sm font-extrabold text-[var(--color-text-primary)] shrink-0 pl-1 border-l border-[var(--color-border-subtle)] ml-1">
              <Banknote className="w-4 h-4 text-[var(--color-primary-ui)]" />
              <span>تصفية السعر:</span>
            </div>

            {/* Scrollable Price Preset Chips */}
            <div
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
              style={{
                touchAction: "pan-x pan-y",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {PRICE_PRESETS.map((preset) => {
                const isSelected = selectedPriceRange === preset.id;
                const PresetIcon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-label={preset.label}
                    aria-pressed={isSelected}
                    onClick={() => {
                      if (onSelectPriceRange) {
                        onSelectPriceRange(preset.id);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-[var(--color-primary-ui)] border-[var(--color-primary-ui)] text-white shadow-sm"
                        : "bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]"
                    }`}
                  >
                    <PresetIcon
                      className={`w-3 h-3 ${isSelected ? "text-white" : "text-[var(--color-primary-ui)]"}`}
                    />
                    <span>{preset.label}</span>
                  </button>
                );
              })}

              {/* Custom Min/Max Trigger Pill */}
              <button
                type="button"
                onClick={() => setIsCustomDrawerOpen(!isCustomDrawerOpen)}
                aria-label="نطاق مخصص"
                aria-expanded={isCustomDrawerOpen}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-bold transition-all shrink-0 cursor-pointer ${
                  selectedPriceRange === "custom"
                    ? "bg-[var(--color-primary-ui)] border-[var(--color-primary-ui)] text-white shadow-sm"
                    : "bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <Sliders className="w-3 h-3 text-cyan-400" />
                <span>
                  {selectedPriceRange === "custom" && (customMinPrice || customMaxPrice)
                    ? `مخصص (${customMinPrice || 0} - ${customMaxPrice || "∞"})`
                    : "نطاق مخصص ⚙️"}
                </span>
              </button>
            </div>
          </div>

          {/* Left Side: Sorting & Reset Controls */}
          <div className="flex items-center gap-2 shrink-0 relative" ref={dropdownRef}>
            {/* Low-to-High / High-to-Low Direct Sort Toggles */}
            <button
              onClick={() =>
                onSelectSort(selectedSort === "price-low" ? "price-high" : "price-low")
              }
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                selectedSort === "price-low" || selectedSort === "price-high"
                  ? "bg-[var(--color-primary-ui)]/15 text-[var(--color-primary-ui)] border-[var(--color-primary-ui)]/50 shadow-sm"
                  : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:text-[var(--color-text-primary)]"
              }`}
              title="تبديل الترتيب بين المنخفض والمرتفع"
              aria-label="سعر منخفض/مرتفع"
            >
              <ArrowUpDown className="w-3 h-3 text-[var(--color-primary-ui)]" />
              <span className="hidden sm:inline">
                {selectedSort === "price-low"
                  ? "منخفض → مرتفع"
                  : selectedSort === "price-high"
                    ? "مرتفع → منخفض"
                    : "سعر منخفض/مرتفع"}
              </span>
              <span className="sm:hidden">
                {selectedSort === "price-low"
                  ? "منخفض"
                  : selectedSort === "price-high"
                    ? "مرتفع"
                    : "السعر"}
              </span>
            </button>

            {/* Dropdown Menu Trigger for Full Sorting Options */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label={`ترتيب المنتجات: ${currentSortObj.label}`}
              aria-expanded={isDropdownOpen}
              className={`flex items-center gap-1.5 border px-2.5 py-1.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                selectedSort !== "default"
                  ? "bg-[var(--color-primary-ui)] text-white border-[var(--color-primary-ui)]"
                  : "bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]"
              }`}
            >
              <CurrentIcon className="w-3 h-3 text-current" />
              <span>{currentSortObj.label}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Animated Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  key="category-sort-dropdown"
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-56 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-2xl p-1.5 shadow-xl z-50 space-y-1 dir-rtl"
                >
                  {SORT_OPTIONS.map((opt) => {
                    const isOptSelected = selectedSort === opt.id;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          onSelectSort(opt.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                          isOptSelected
                            ? "bg-[var(--color-primary-ui)] text-white shadow-sm"
                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
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

          {/* Brand Filter Trigger */}
          {onSelectBrands && (
            <button
              type="button"
              onClick={() => {
                setIsBrandDrawerOpen(!isBrandDrawerOpen);
                setIsRatingDrawerOpen(false);
                setIsCustomDrawerOpen(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-sm font-bold transition-all shrink-0 cursor-pointer ${
                selectedBrands.length > 0
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:text-[var(--color-text-primary)]"
              }`}
              title="فلترة حسب العلامة التجارية"
              aria-label="العلامة"
              aria-expanded={isBrandDrawerOpen}
            >
              <Award className="w-3 h-3" />
              <span className="hidden sm:inline">العلامة</span>
              {selectedBrands.length > 0 && (
                <span className="bg-amber-400 text-black text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {selectedBrands.length}
                </span>
              )}
            </button>
          )}

          {/* Rating Filter Trigger */}
          {onSelectRatings && (
            <button
              type="button"
              onClick={() => {
                setIsRatingDrawerOpen(!isRatingDrawerOpen);
                setIsBrandDrawerOpen(false);
                setIsCustomDrawerOpen(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-sm font-bold transition-all shrink-0 cursor-pointer ${
                selectedRatings.length > 0
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:text-[var(--color-text-primary)]"
              }`}
              title="فلترة حسب التقييم"
              aria-label="التقييم"
              aria-expanded={isRatingDrawerOpen}
            >
              <Star className="w-3 h-3" />
              <span className="hidden sm:inline">التقييم</span>
              {selectedRatings.length > 0 && (
                <span className="bg-rose-400 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {selectedRatings.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Applied Filters Active Status Bar & Reset Button */}
        {hasActiveFilters && (
          <div className="pt-1 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-2 flex-wrap text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-extrabold text-[var(--color-text-secondary)]">
                الفلاتر المطبقة:
              </span>

              {selectedPriceRange !== "all" && (
                <div className="inline-flex items-center gap-1 bg-[var(--color-primary-ui)]/15 text-[var(--color-primary-ui)] border border-[var(--color-primary-ui)]/30 px-2.5 py-0.5 rounded-full text-sm font-bold">
                  <Filter className="w-3 h-3 animate-pulse" />
                  <span>
                    السعر:{" "}
                    {PRICE_PRESETS.find((p) => p.id === selectedPriceRange)?.label ??
                      `مخصص (${customMinPrice || 0} - ${customMaxPrice || "∞"} ر.ي)`}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectPriceRange && onSelectPriceRange("all")}
                    className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer mr-1"
                    title="إزالة فلتر السعر"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {selectedBrands.map((bid) => {
                const br = STORE_BRANDS.find((b) => b.id === bid);
                return br ? (
                  <div
                    key={bid}
                    className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-sm font-bold"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{br.name}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleBrand(bid)}
                      className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer mr-1"
                      title="إزالة"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : null;
              })}

              {selectedRatings.map((rid) => {
                const ratingOpt = RATING_OPTIONS.find((r) => r.id === rid);
                return ratingOpt ? (
                  <div
                    key={rid}
                    className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-sm font-bold"
                  >
                    <Star className="w-3 h-3" />
                    <span>{ratingOpt.id}+</span>
                    <button
                      type="button"
                      onClick={() => handleToggleRating(rid)}
                      className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer mr-1"
                      title="إزالة"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : null;
              })}

              {selectedSort !== "default" && (
                <div className="inline-flex items-center gap-1 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full text-sm font-bold">
                  <ArrowUpDown className="w-3 h-3" />
                  <span>
                    الترتيب:{" "}
                    {SORT_OPTIONS.find((s) => s.id === selectedSort)?.label ?? selectedSort}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectSort("default")}
                    className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer mr-1"
                    title="إعادة الترتيب للافتراضي"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleResetAllFilters}
              className="text-sm font-extrabold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1 mr-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة ضبط الكل</span>
            </button>
          </div>
        )}

        {/* Brand Drawer */}
        <AnimatePresence>
          {isBrandDrawerOpen && onSelectBrands && (
            <motion.div
              key="brand-drawer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl p-3 mt-2 dir-rtl"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-primary)]">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>تصفية حسب العلامة التجارية</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBrandDrawerOpen(false)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STORE_BRANDS.map((brand) => {
                  const isSelected = selectedBrands.includes(brand.id);
                  return (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => handleToggleBrand(brand.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-500/25 text-amber-200 border-amber-500/50"
                          : "bg-[var(--color-surface-1)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{brand.label}</span>
                    </button>
                  );
                })}
              </div>
              {selectedBrands.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectBrands([])}
                  className="mt-2 text-sm text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>إلغاء تحديد العلامات</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rating Drawer */}
        <AnimatePresence>
          {isRatingDrawerOpen && onSelectRatings && (
            <motion.div
              key="rating-drawer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl p-3 mt-2 dir-rtl"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-primary)]">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>تصفية حسب التقييم</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRatingDrawerOpen(false)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {RATING_OPTIONS.map((ratingOpt) => {
                  const isSelected = selectedRatings.includes(ratingOpt.id);
                  return (
                    <button
                      key={ratingOpt.id}
                      type="button"
                      onClick={() => handleToggleRating(ratingOpt.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold transition-all cursor-pointer text-right ${
                        isSelected
                          ? "bg-rose-500/20 text-rose-200 border-rose-500/40"
                          : "bg-[var(--color-surface-1)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {ratingOpt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Expandable Custom Range Drawer */}
        <AnimatePresence>
          {isCustomDrawerOpen && (
            <motion.form
              onSubmit={handleApplyCustomPrice}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl p-3 mt-2 space-y-3 dir-rtl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-primary)]">
                  <Sliders className="w-3.5 h-3.5 text-[var(--color-primary-ui)]" />
                  <span>تحديد نطاق السعر بالريال اليمني (YER)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomDrawerOpen(false)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-extrabold text-[var(--color-text-secondary)] mb-1">
                    الحد الأدنى (من)
                  </label>
                  <input
                    type="number"
                    placeholder="مثال: 10000"
                    value={tempMin}
                    onChange={(e) => setTempMin(e.target.value)}
                    className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-lg px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary-ui)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-extrabold text-[var(--color-text-secondary)] mb-1">
                    الحد الأقصى (إلى)
                  </label>
                  <input
                    type="number"
                    placeholder="مثال: 60000"
                    value={tempMax}
                    onChange={(e) => setTempMax(e.target.value)}
                    className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-lg px-2.5 py-1.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary-ui)]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTempMin("");
                    setTempMax("");
                    if (onSelectPriceRange) onSelectPriceRange("all");
                    setIsCustomDrawerOpen(false);
                  }}
                  className="px-3 py-1 rounded-lg text-sm font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded-lg text-sm font-bold bg-[var(--color-primary-ui)] hover:bg-[#2458D8] text-white shadow-sm cursor-pointer"
                >
                  تطبيق النطاق
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
