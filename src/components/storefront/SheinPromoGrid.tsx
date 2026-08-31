import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft, Zap, Sparkles, Flame, Tag, ShoppingCart } from 'lucide-react';
import { Product, Currency } from './types';
import { formatPrice } from './currency';
import { StoreLogo } from './StoreLogo';

interface SheinPromoGridProps {
  products?: Product[];
  currency?: Currency;
  onShopNow: (categoryId?: string) => void;
  onSelectCategory?: (categoryId: string) => void;
  onSelectProduct?: (product: Product) => void;
}

export const SheinPromoGrid: React.FC<SheinPromoGridProps> = ({
  products = [],
  currency = 'YER',
  onShopNow,
  onSelectCategory,
  onSelectProduct,
}) => {
  // Filter products with real images
  const validProducts = products.filter((p) => p.image && !p.image.includes('data:image/svg'));
  const featuredSlides = validProducts.length >= 3 ? validProducts.slice(0, 3) : products.slice(0, 3);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    if (featuredSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % featuredSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredSlides.length]);

  const activeProduct = featuredSlides[currentSlideIndex] || products[0];

  const handleNext = () => {
    if (featuredSlides.length <= 1) return;
    setCurrentSlideIndex((prev) => (prev + 1) % featuredSlides.length);
  };

  const handlePrev = () => {
    if (featuredSlides.length <= 1) return;
    setCurrentSlideIndex((prev) => (prev - 1 + featuredSlides.length) % featuredSlides.length);
  };

  return (
    <section className="py-2 px-3 sm:px-6 w-full max-w-[1700px] mx-auto" aria-label="العروض الترويجية الكبرى">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
        
        {/* Left Side Quick Brand Features */}
        <div className="hidden xl:flex xl:col-span-2 flex-col gap-3 justify-between">
          <div
            onClick={() => {
              onSelectCategory?.('smartwatches');
              onShopNow('smartwatches');
            }}
            className="group relative flex-1 cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-black to-neutral-950 text-white p-5 flex flex-col justify-between shadow-sm border border-neutral-800 hover:border-[#F93A00] transition-all"
          >
            <div>
              <span className="rounded bg-[#F93A00] px-2 py-0.5 text-[10px] font-black">ترند المتجر</span>
              <h4 className="mt-2 text-base font-black">أجهزة وساعات</h4>
              <p className="text-[11px] text-neutral-400 mt-1">تكنولوجيا أصلية بضمان حقيقي</p>
            </div>
            <div className="flex items-center text-xs font-bold text-[#F93A00] group-hover:gap-2 transition-all">
              <span>تصفح القسم</span>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            </div>
          </div>

          <div
            onClick={() => {
              onSelectCategory?.('audio');
              onShopNow('audio');
            }}
            className="group relative flex-1 cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 to-black text-white p-5 flex flex-col justify-between shadow-sm border border-neutral-800 hover:border-[#F93A00] transition-all"
          >
            <div>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-black border border-white/20">صوت فائق</span>
              <h4 className="mt-2 text-base font-black">سماعات وصوتيات</h4>
              <p className="text-[11px] text-neutral-400 mt-1">عزل ضوضاء ونقاء استثنائي</p>
            </div>
            <div className="flex items-center text-xs font-bold text-white group-hover:gap-2 transition-all">
              <span>عرض المنتجات</span>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            </div>
          </div>
        </div>

        {/* Center Main Promotional Hero */}
        <div className="lg:col-span-8 xl:col-span-7 relative min-h-[280px] sm:min-h-[360px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-[#FFF1EB] via-white to-[#FDEEE9] dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900">
          {activeProduct ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeProduct.id || currentSlideIndex}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0 flex flex-col md:flex-row items-center justify-between p-6 sm:p-10"
              >
                {/* Text Side */}
                <div className="relative z-10 max-w-md text-right">
                  <div className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 text-[11px] font-black text-white shadow">
                    <Flame className="h-3.5 w-3.5 text-[#F93A00]" />
                    <span>مختار من متجر إندكس</span>
                  </div>

                  <div className="mt-3 text-3xl sm:text-5xl font-black text-[#F93A00] tracking-tight">
                    {activeProduct.discountBadge || 'خصم خاص'}
                  </div>

                  <h3 className="mt-2 text-xl sm:text-2xl font-black text-neutral-900 dark:text-white leading-tight line-clamp-2">
                    {activeProduct.name}
                  </h3>

                  <p className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
                    {activeProduct.subtitle || activeProduct.description || 'تسوق الآن بالسعر والتوفر الحقيقي مع ضمان التوصيل'}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <span className="font-mono text-xl font-black text-neutral-900 dark:text-white">
                      {formatPrice(activeProduct.priceYER, currency)}
                    </span>
                    {activeProduct.originalPriceYER && activeProduct.originalPriceYER > activeProduct.priceYER && (
                      <span className="font-mono text-xs text-neutral-400 line-through">
                        {formatPrice(activeProduct.originalPriceYER, currency)}
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (onSelectProduct) onSelectProduct(activeProduct);
                        else onShopNow();
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-xs sm:text-sm font-black text-white shadow-lg hover:bg-neutral-800 active:scale-95 transition-all"
                    >
                      طلب المنتج الآن
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <span className="text-[11px] font-bold text-neutral-500">متوفر في المتجر</span>
                  </div>
                </div>

                {/* Product Image Side */}
                <div className="relative mt-4 md:mt-0 w-44 h-44 sm:w-60 sm:h-60 md:w-68 md:h-68 flex-shrink-0 flex items-center justify-center">
                  {activeProduct.image && !activeProduct.image.includes('data:image/svg') ? (
                    <img
                      src={activeProduct.image}
                      alt={activeProduct.name}
                      className="w-full h-full object-contain drop-shadow-xl transform md:rotate-1 hover:rotate-0 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex h-36 w-36 items-center justify-center rounded-3xl bg-neutral-900 p-4 text-white shadow-2xl border border-neutral-800">
                      <StoreLogo variant="icon" className="h-20 w-20" />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-white dark:bg-neutral-800 rounded-xl px-3 py-1 shadow border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#F93A00]" />
                    <span className="text-[11px] font-black text-neutral-900 dark:text-white">أصلي ومضمون</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full">
              <StoreLogo variant="full" className="mb-2" />
            </div>
          )}

          {/* Navigation Controls */}
          {featuredSlides.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-black/80 text-black dark:text-white shadow-md hover:bg-white transition-all"
                aria-label="السابق"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-black/80 text-black dark:text-white shadow-md hover:bg-white transition-all"
                aria-label="التالي"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
                {featuredSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentSlideIndex ? 'w-5 bg-black dark:bg-white' : 'w-2 bg-black/25 dark:bg-white/25'
                    }`}
                    aria-label={`شريحة ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Side Store Highlights */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-row lg:flex-col gap-3">
          <div
            onClick={() => onShopNow()}
            className="group flex-1 cursor-pointer overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 relative flex flex-col justify-between hover:border-black dark:hover:border-white transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black tracking-widest text-neutral-600 dark:text-neutral-400">INDEXES VIP</span>
              <span className="rounded bg-[#F93A00]/10 text-[#F93A00] text-[10px] font-black px-2 py-0.5">
                الأصلي
              </span>
            </div>
            <div className="my-2">
              <h4 className="text-base font-black text-neutral-900 dark:text-white">إلكترونيات مختارة</h4>
              <p className="text-xs text-neutral-500">فحص وضمان حقيقي قبل التسليم</p>
            </div>
            <div className="flex items-center text-xs font-bold text-[#F93A00] group-hover:gap-2 transition-all">
              <span>تسوق الكتالوج</span>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            </div>
          </div>

          <div className="hidden sm:flex flex-1 rounded-2xl bg-[#FFF1EB] dark:bg-neutral-800/80 border border-[#F93A00]/20 p-4 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F93A00] text-white flex-shrink-0 shadow">
              <Zap className="h-5 w-5" />
            </div>
            <div className="text-right leading-tight">
              <span className="text-xs font-black text-[#F93A00] block">توصيل سريع لجميع المحافظات</span>
              <span className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">خطوات طلب واضحة وآمنة</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
