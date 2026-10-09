import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Product } from "./types";
import { HolographicGlobe } from "./HolographicGlobe";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Orbit,
  ArrowUpRight,
  Play,
  Pause,
  Image as ImageIcon,
} from "lucide-react";
import type { MappedStorefrontSettings } from "@/lib/adapters/storefront-settings.adapter";

interface HeroCarouselProps {
  products: Product[];
  heroConfig?: MappedStorefrontSettings["hero"];
  onSelectCategory: (categoryId: string) => void;
  onSelectProduct: (product: Product) => void;
  onOpenDeconstruction?: () => void;
  onOpenUniverse?: () => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  products,
  heroConfig,
  onSelectCategory,
  onSelectProduct,
  onOpenDeconstruction,
  onOpenUniverse,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const heroType = heroConfig?.type || "sphere_3d";
  const slides = heroConfig?.slides || [];
  const totalSlides = heroType === "slideshow" && slides.length > 0 ? slides.length : 4;

  useEffect(() => {
    if (totalSlides <= 1 || prefersReducedMotion || isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, [totalSlides, prefersReducedMotion, isPaused]);

  const floatingproducts = products.slice(0, 8);

  // Active slide for slideshow mode
  const activeSlide =
    heroType === "slideshow" && slides.length > 0 ? slides[currentSlide % slides.length] : null;

  return (
    <div className="px-3 sm:px-6 py-2">
      <motion.div
        ref={containerRef}
        layout
        transition={{ type: "spring", stiffness: 220, damping: 25 }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
        className="relative w-full rounded-[28px] sm:rounded-[36px] overflow-hidden bg-[var(--color-surface-1)]/90 backdrop-blur-md border border-[var(--color-border-default)] shadow-[var(--shadow-md)] p-4 sm:p-7 flex flex-col justify-between relative group min-h-[220px]"
      >
        {/* Subtle Rim Lighting Highlights */}
        <div className="absolute -top-12 -right-12 w-56 sm:w-80 h-56 sm:h-80 bg-[#2F6BFF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-56 sm:w-80 h-56 sm:h-80 bg-[#38bdf8]/08 rounded-full blur-3xl pointer-events-none" />

        {/* ── 1. BANNER IMAGE MODE ── */}
        {heroType === "banner_image" && heroConfig?.bannerImageUrl ? (
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 min-h-[180px]">
            <div className="flex flex-col items-start text-right gap-1 w-full md:max-w-lg z-10">
              <div className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#2F6BFF] bg-[#2F6BFF]/10 px-2.5 py-0.5 rounded-full border border-[#2F6BFF]/20">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span>{heroConfig?.badgeText || "عروض سبتمبر الحصرية"}</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-[var(--color-text-primary)] tracking-tight mt-1">
                {heroConfig?.title || "خصومات حصرية في متجر إندكس"}
              </h2>
              <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm font-medium leading-normal max-w-md">
                {heroConfig?.subtitle || "تصفح تشكيلة إندكس المتميزة بأفضل الأسعار"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => onSelectCategory("all")}
                  className="bg-gradient-to-r from-[#2F6BFF] to-purple-600 text-white font-black px-4 py-2 rounded-full text-xs shadow-md"
                >
                  {heroConfig?.ctaText || "تسوق الآن"}
                </button>
              </div>
            </div>
            <div className="w-full md:w-1/2 h-44 sm:h-56 rounded-2xl overflow-hidden border border-white/10 relative">
              <img
                src={heroConfig.bannerImageUrl}
                alt={heroConfig.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : heroType === "video" && heroConfig?.bannerVideoUrl ? (
          /* ── 2. VIDEO BANNER MODE ── */
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 min-h-[180px]">
            <div className="flex flex-col items-start text-right gap-1 w-full md:max-w-lg z-10">
              <div className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#2F6BFF] bg-[#2F6BFF]/10 px-2.5 py-0.5 rounded-full border border-[#2F6BFF]/20">
                <Play className="w-3 h-3 text-blue-400" />
                <span>{heroConfig?.badgeText || "فيديو حصري"}</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-[var(--color-text-primary)] tracking-tight mt-1">
                {heroConfig?.title || "عرض فيديو المنتجات"}
              </h2>
              <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm font-medium leading-normal max-w-md">
                {heroConfig?.subtitle || "شاهد تفاصيل وأداء منتجاتنا بجودة فائقة"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => onSelectCategory("all")}
                  className="bg-gradient-to-r from-[#2F6BFF] to-purple-600 text-white font-black px-4 py-2 rounded-full text-xs shadow-md"
                >
                  {heroConfig?.ctaText || "استكشف المنتجات"}
                </button>
              </div>
            </div>
            <div className="w-full md:w-1/2 h-44 sm:h-56 rounded-2xl overflow-hidden border border-white/10 relative bg-black/60">
              <video
                src={heroConfig.bannerVideoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : heroType === "slideshow" && activeSlide ? (
          /* ── 3. REAL SLIDESHOW MODE ── */
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 min-h-[180px]">
            <div className="flex flex-col items-start text-right gap-1 w-full md:max-w-lg z-10">
              {activeSlide.badgeText && (
                <div className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#2F6BFF] bg-[#2F6BFF]/10 px-2.5 py-0.5 rounded-full border border-[#2F6BFF]/20">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span>{activeSlide.badgeText}</span>
                </div>
              )}
              <h2 className="text-xl sm:text-3xl font-black text-[var(--color-text-primary)] tracking-tight mt-1">
                {activeSlide.title || heroConfig?.title}
              </h2>
              <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm font-medium leading-normal max-w-md">
                {activeSlide.subtitle || heroConfig?.subtitle}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => onSelectCategory("all")}
                  className="bg-gradient-to-r from-[#2F6BFF] to-purple-600 text-white font-black px-4 py-2 rounded-full text-xs shadow-md"
                >
                  {activeSlide.ctaText || heroConfig?.ctaText || "تصفح الآن"}
                </button>
              </div>
            </div>
            {activeSlide.mediaUrl && (
              <div className="w-full md:w-1/2 h-44 sm:h-56 rounded-2xl overflow-hidden border border-white/10 relative">
                {activeSlide.mediaType === "video" ? (
                  <video
                    src={activeSlide.mediaUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={activeSlide.mediaUrl}
                    alt={activeSlide.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── 4. APPROVED 3D GLOBE MODE (sphere_3d & default fallback) ── */
          <AnimatePresence mode="wait">
            {!isExpanded ? (
              /* ================= COMPACT HERO BANNER MODE ================= */
              <motion.div
                key="compact-banner"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="relative z-10 flex flex-col justify-between min-h-[160px] sm:min-h-[220px]"
              >
                {/* Top Badges Row: Left "تصفح 3D" & "تفكيك سينمائي 3D", Right "عروض حصرية 50%" */}
                <div className="flex items-center justify-between w-full mb-1 sm:mb-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {onOpenUniverse && (
                      <button
                        onClick={onOpenUniverse}
                        className="bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 hover:from-blue-600/40 hover:to-purple-600/40 border border-blue-400/40 text-blue-200 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-md flex items-center gap-1 transition-all cursor-pointer group/btn"
                        title="استكشاف سينمائي تفاعلي ثلاثي الأبعاد للمنتجات"
                      >
                        <Orbit className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
                        <span>عالم 3D الفضائي 🪐</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsExpanded(true)}
                      className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm flex items-center gap-1 transition-all cursor-pointer group/btn"
                    >
                      <Orbit className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#2F6BFF]" />
                      <span>معرض 3D</span>
                    </button>

                    {onOpenDeconstruction && (
                      <button
                        onClick={onOpenDeconstruction}
                        className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-500/30 text-purple-300 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm flex items-center gap-1 transition-all cursor-pointer animate-pulse"
                      >
                        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
                        <span>تفكيك 3D</span>
                      </button>
                    )}
                  </div>

                  <div className="inline-flex items-center gap-1 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-[#2F6BFF]">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    <span>{heroConfig?.badgeText || "عروض 50%"}</span>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-5 my-auto w-full">
                  {/* Text & CTAs (Top on mobile) */}
                  <div className="flex flex-col items-start text-right gap-1 w-full md:max-w-md shrink-0">
                    <div className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#2F6BFF] bg-[#2F6BFF]/10 px-2 py-0.5 rounded-full border border-[#2F6BFF]/20">
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      <span>{heroConfig?.badgeText || "عروض سبتمبر الحصرية"}</span>
                    </div>

                    <div className="text-lg sm:text-2xl md:text-3xl font-black text-[var(--color-text-primary)] tracking-tight mt-0.5">
                      {heroConfig?.title || (
                        <>
                          خصومات تصل إلى{" "}
                          <span className="text-[#2F6BFF] font-black text-xl sm:text-3xl">50%</span>
                        </>
                      )}
                    </div>

                    <p className="text-[var(--color-text-secondary)] text-[11px] sm:text-sm font-medium leading-normal max-w-xs line-clamp-1 sm:line-clamp-2">
                      {heroConfig?.subtitle ||
                        "تصفح تشكيلة إندكس المتميزة من الساعات والإلكترونيات"}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <button
                        onClick={onOpenUniverse || (() => setIsExpanded(true))}
                        className="relative overflow-hidden bg-gradient-to-r from-[#2F6BFF] to-purple-600 hover:from-[#2458D8] hover:to-purple-700 text-white font-black px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-full shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all active:scale-95 text-[11px] sm:text-xs cursor-pointer group/cta border border-blue-400/30"
                      >
                        <Orbit className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
                        <span>{heroConfig?.ctaText || "عالم المنتجات 🌎"}</span>
                      </button>

                      <button
                        onClick={() => onSelectCategory("all")}
                        aria-label="عرض المنتجات"
                        className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-[11px] sm:text-xs font-bold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border border-[var(--color-border-default)] shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span>{heroConfig?.secondaryCtaText || "عرض الكل"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Holographic Globe (Compact mobile container) */}
                  <div
                    onClick={() => setIsExpanded(true)}
                    className="relative w-full h-[130px] sm:h-[180px] md:h-[220px] md:w-[220px] lg:h-[260px] lg:w-[260px] flex items-center justify-center shrink-0 my-auto cursor-pointer group/globe transition-transform hover:scale-105"
                    title="اضغط لتوسيع المعرض 3D"
                  >
                    <HolographicGlobe
                      products={floatingproducts}
                      onSelectProduct={onSelectProduct}
                      className="w-full h-full"
                      showTitleBadge={false}
                      maxProducts={heroConfig?.globe?.maxProducts}
                      radius={heroConfig?.globe?.radius}
                      cardShape={heroConfig?.globe?.cardShape}
                      showName={heroConfig?.globe?.showName}
                      showPrice={heroConfig?.globe?.showPrice}
                      showParticles={heroConfig?.showParticles}
                      rotationSpeed={heroConfig?.globe?.rotationSpeed}
                    />
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
                <div className="w-full flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
                  <div className="inline-flex items-center gap-2 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] px-3.5 py-1 rounded-full text-xs font-black text-[var(--color-text-primary)] shadow-sm">
                    <Orbit className="w-4 h-4 text-[#2F6BFF] animate-spin" />
                    <span>متجر إندكس — INDEXES STORE</span>
                  </div>

                  <button
                    onClick={() => setIsExpanded(false)}
                    className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-primary)] text-xs font-black px-3.5 py-1.5 rounded-full border border-[var(--color-border-default)] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>إغلاق المعرض</span>
                  </button>
                </div>

                <div className="space-y-1 max-w-md mx-auto pt-1">
                  <h2 className="text-xl sm:text-3xl font-black text-[var(--color-text-primary)] tracking-tight">
                    {heroConfig?.globe?.titleText || "معرض المنتجات التفاعلي"}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-medium">
                    {heroConfig?.globe?.subtitleText ||
                      "اسحب الكرة — كل وجه منتج، اضغط لفتحه واستعراض تفاصيل العرض"}
                  </p>
                </div>

                <div className="my-2 w-full h-[380px] sm:h-[420px] max-w-[480px] mx-auto flex items-center justify-center">
                  <HolographicGlobe
                    products={floatingproducts}
                    onSelectProduct={onSelectProduct}
                    className="w-full h-full"
                    showTitleBadge={false}
                    maxProducts={heroConfig?.globe?.maxProducts}
                    radius={heroConfig?.globe?.radius}
                    cardShape={heroConfig?.globe?.cardShape}
                    showName={heroConfig?.globe?.showName}
                    showPrice={heroConfig?.globe?.showPrice}
                    showParticles={heroConfig?.showParticles}
                    rotationSpeed={heroConfig?.globe?.rotationSpeed}
                    overlayBadge={heroConfig?.globe?.badgeText}
                    overlayTitle={heroConfig?.globe?.titleText}
                    overlaySubtitle={heroConfig?.globe?.subtitleText}
                    overlayTitleFontSize={heroConfig?.globe?.titleFontSize}
                    overlaySubtitleFontSize={heroConfig?.globe?.subtitleFontSize}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => onSelectCategory("offers")}
                    className="bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-extrabold px-5 py-2 rounded-full shadow-md flex items-center gap-2 transition-all active:scale-95 text-xs sm:text-sm cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{heroConfig?.ctaText || "تصفح العروض الحصرية"}</span>
                  </button>

                  <button
                    onClick={() => setIsExpanded(false)}
                    className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-bold px-4 py-2 rounded-full border border-[var(--color-border-default)] text-xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>تصغير</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Carousel Indicators at Bottom */}
        <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`الشريحة ${idx + 1}`}
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentSlide
                  ? "w-5 sm:w-6 bg-[#2F6BFF]"
                  : "w-1.5 sm:w-2 bg-[var(--color-border-default)] hover:bg-[var(--color-border-strong)]"
              }`}
            />
          ))}
          {totalSlides > 1 && !prefersReducedMotion && (
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              aria-label={isPaused ? "تشغيل التمرير التلقائي" : "إيقاف التمرير التلقائي مؤقتاً"}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-0.5 ml-1 transition-colors cursor-pointer"
            >
              {isPaused ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
