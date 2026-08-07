import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "./types";
import { HolographicGlobe } from "./HolographicGlobe";
import { Sparkles, ChevronLeft, Maximize2, Minimize2, Orbit } from "lucide-react";

interface HeroCarouselProps {
  onSelectCategory: (categoryId: string) => void;
  onSelectProduct: (product: Product) => void;
  products?: Product[];
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  onSelectCategory,
  onSelectProduct,
  products = [],
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const floatingProducts = products.slice(0, 8);

  return (
    <div className="px-3 sm:px-6 py-2">
      <motion.div
        ref={containerRef}
        layout
        transition={{ type: "spring", stiffness: 220, damping: 25 }}
        className="relative w-full rounded-[28px] sm:rounded-[36px] overflow-hidden bg-[#100B1A]/90 backdrop-blur-md border border-gray-800 shadow-md p-4 sm:p-7 flex flex-col justify-between relative group"
      >
        {/* Subtle Rim Lighting Highlights */}
        <div className="absolute -top-12 -right-12 w-56 sm:w-80 h-56 sm:h-80 bg-[#7B3FFF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-56 sm:w-80 h-56 sm:h-80 bg-[#38bdf8]/08 rounded-full blur-3xl pointer-events-none" />

        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* ================= COMPACT HERO BANNER MODE ================= */
            <motion.div
              key="compact-banner"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 flex flex-col justify-between min-h-[220px] sm:min-h-[260px]"
            >
              {/* Top Badges Row: Left "تصفح 3D", Right "عروض حصرية 50%" */}
              <div className="flex items-center justify-between w-full mb-2">
                <button
                  onClick={() => setIsExpanded(true)}
                  className="bg-[#18112B] hover:bg-[#201838] border border-gray-800 text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 transition-all cursor-pointer group/btn"
                >
                  <Orbit className="w-3.5 h-3.5 text-[#7B3FFF]" />
                  <span>تصفح 3D</span>
                </button>

                <div className="inline-flex items-center gap-1.5 bg-[#18112B] border border-gray-800 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold text-[#7B3FFF]">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>عروض حصرية 50%</span>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex items-center justify-between gap-2 my-auto">
                {/* Left Side in RTL: Holographic Globe */}
                <div
                  onClick={() => setIsExpanded(true)}
                  className="relative flex items-center justify-center shrink-0 my-auto cursor-pointer group/globe transition-transform hover:scale-105"
                  title="اضغط لتوسيع المعرض 3D"
                >
                  <div className="hidden sm:block">
                    <HolographicGlobe
                      products={floatingProducts}
                      onSelectProduct={onSelectProduct}
                      size={240}
                      showTitleBadge={false}
                    />
                  </div>
                  <div className="block sm:hidden">
                    <HolographicGlobe
                      products={floatingProducts}
                      onSelectProduct={onSelectProduct}
                      size={170}
                      showTitleBadge={false}
                    />
                  </div>
                </div>

                {/* Right Side in RTL: Text & CTAs */}
                <div className="flex flex-col items-start text-right gap-1.5 max-w-[190px] sm:max-w-md shrink-0">
                  <div className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                    خصومات
                  </div>

                  <div className="text-4xl sm:text-7xl font-black text-white leading-none my-0.5">
                    %50
                  </div>

                  <p className="text-gray-300 text-[10px] sm:text-xs font-medium leading-relaxed max-w-[160px] sm:max-w-xs">
                    خصومات تصل إلى النصف على أحدث المنتجات
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => onSelectCategory("offers")}
                      className="relative overflow-hidden bg-[#7B3FFF] hover:bg-[#682BDD] text-white font-black px-4 sm:px-6 py-2.5 rounded-full shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all active:scale-95 text-xs sm:text-sm cursor-pointer group/cta"
                    >
                      <span>تسوق الآن</span>
                      <ChevronLeft className="w-4 h-4 group-hover/cta:-translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => setIsExpanded(true)}
                      aria-label="توسيع المعرض"
                      className="w-8 h-8 sm:w-9 sm:h-9 bg-[#18112B] hover:bg-[#201838] text-gray-300 hover:text-white rounded-full border border-gray-800 shadow-sm flex items-center justify-center transition-all cursor-pointer shrink-0"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ================= FULL EXPANDED 3D GLOBE EXHIBITION MODE ================= */
            <motion.div
              key="expanded-globe"
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="relative z-10 flex flex-col items-center justify-between text-center space-y-4 py-2"
            >
              <div className="w-full flex items-center justify-between border-b border-gray-800/60 pb-3">
                <div className="inline-flex items-center gap-2 bg-[#18112B] border border-gray-800 px-3.5 py-1 rounded-full text-xs font-black text-white shadow-sm">
                  <Orbit className="w-4 h-4 text-[#7B3FFF] animate-spin" />
                  <span>متجر إندكس — INDEXES STORE</span>
                </div>

                <button
                  onClick={() => setIsExpanded(false)}
                  className="bg-[#18112B] hover:bg-[#201838] text-white text-xs font-black px-3.5 py-1.5 rounded-full border border-gray-800 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>إغلاق المعرض</span>
                </button>
              </div>

              <div className="space-y-1 max-w-md mx-auto pt-1">
                <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                  معرض المنتجات التفاعلي
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 font-medium">
                  اسحب الكرة — كل وجه منتج، اضغط لفتحه واستعراض تفاصيل العرض
                </p>
              </div>

              <div className="my-2 flex items-center justify-center">
                <div className="hidden sm:block">
                  <HolographicGlobe
                    products={floatingProducts}
                    onSelectProduct={onSelectProduct}
                    size={330}
                    showTitleBadge={false}
                  />
                </div>
                <div className="block sm:hidden">
                  <HolographicGlobe
                    products={floatingProducts}
                    onSelectProduct={onSelectProduct}
                    size={265}
                    showTitleBadge={false}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onSelectCategory("offers")}
                  className="bg-[#7B3FFF] hover:bg-[#682BDD] text-white font-extrabold px-5 py-2 rounded-full shadow-md flex items-center gap-2 transition-all active:scale-95 text-xs sm:text-sm cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>تصفح العروض الحصرية</span>
                </button>

                <button
                  onClick={() => setIsExpanded(false)}
                  className="bg-[#18112B] hover:bg-[#201838] text-gray-300 hover:text-white font-bold px-4 py-2 rounded-full border border-gray-800 text-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>تصغير</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Carousel Indicators at Bottom */}
        <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`الشريحة ${idx + 1}`}
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentSlide
                  ? "w-5 sm:w-6 bg-[#7B3FFF]"
                  : "w-1.5 sm:w-2 bg-gray-800 hover:bg-gray-700"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
