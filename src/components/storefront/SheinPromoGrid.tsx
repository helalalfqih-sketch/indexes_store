import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft, Zap, Sparkles, Tag, Flame } from 'lucide-react';

interface PromoSlide {
  id: string;
  title: string;
  subtitle: string;
  discountText: string;
  tagText: string;
  bgGradient: string;
  image: string;
  categoryTarget: string;
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: 'maybelline-tech',
    title: 'مهرجان التخفيضات الكبرى',
    subtitle: 'إلكترونيات أصلية، ساعات ذكية، وسماعات عازلة للضوضاء',
    discountText: 'خصم حتى 50%',
    tagText: 'INDEXES SUPER SALE',
    bgGradient: 'from-[#FFF1EB] via-[#FDEEE9] to-[#FCE2D8]',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
    categoryTarget: 'smartwatches',
  },
  {
    id: 'audio-boom',
    title: 'عالم الصوتيات الفاخرة',
    subtitle: 'سماعات رأس وسبيكرات لاسلكية بأعلى دقة صوتية',
    discountText: 'وفر حتى 40%',
    tagText: 'AUDIO EXCLUSIVE',
    bgGradient: 'from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE]',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    categoryTarget: 'audio',
  },
  {
    id: 'home-appliances',
    title: 'تجهيزات المنزل والراحة',
    subtitle: 'أجهزة ذكية وعملية تجعل يومك أسهل وأكثر راحة',
    discountText: 'خصم حتى 35%',
    tagText: 'HOME COMFORT',
    bgGradient: 'from-[#F0FDF4] via-[#DCFCE7] to-[#BBF7D0]',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
    categoryTarget: 'home_appliances',
  },
];

interface SheinPromoGridProps {
  onShopNow: (categoryId?: string) => void;
  onSelectCategory?: (categoryId: string) => void;
}

export const SheinPromoGrid: React.FC<SheinPromoGridProps> = ({ onShopNow, onSelectCategory }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const slide = PROMO_SLIDES[currentSlideIndex];

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length);
  };

  return (
    <section className="py-2 px-3 sm:px-6 w-full max-w-[1700px] mx-auto" aria-label="العروض الترويجية الكبرى">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
        
        {/* Left Side Lifestyle Cards (Desktop only) */}
        <div className="hidden xl:flex xl:col-span-2 flex-col gap-3 justify-between">
          <div
            onClick={() => onSelectCategory?.('smartwatches')}
            className="group relative flex-1 cursor-pointer overflow-hidden rounded-2xl bg-neutral-900 text-white p-4 flex flex-col justify-end shadow-sm hover:shadow-md transition-shadow"
          >
            <img
              src="https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=400&auto=format&fit=crop&q=80"
              alt="رمز الشباب"
              className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="relative z-10">
              <span className="rounded bg-[#F93A00] px-2 py-0.5 text-[10px] font-black">ترند الأسبوع</span>
              <h4 className="mt-1 text-base font-black">رمز الشباب</h4>
              <p className="text-[11px] text-neutral-300">أحدث صيحات التقنية</p>
            </div>
          </div>

          <div
            onClick={() => onSelectCategory?.('audio')}
            className="group relative flex-1 cursor-pointer overflow-hidden rounded-2xl bg-neutral-900 text-white p-4 flex flex-col justify-end shadow-sm hover:shadow-md transition-shadow"
          >
            <img
              src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80"
              alt="إطلالة كاجوال"
              className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="relative z-10">
              <span className="rounded bg-black/80 px-2 py-0.5 text-[10px] font-black border border-white/20">صوت فائق</span>
              <h4 className="mt-1 text-base font-black">إيقاع الموسيقى</h4>
              <p className="text-[11px] text-neutral-300">عزل ضوضاء احترافي</p>
            </div>
          </div>
        </div>

        {/* Center Main Carousel */}
        <div className="lg:col-span-8 xl:col-span-7 relative min-h-[300px] sm:min-h-[380px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-neutral-200/80 dark:border-neutral-800">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 flex flex-col md:flex-row items-center justify-between p-6 sm:p-10`}
            >
              {/* Text Side */}
              <div className="relative z-10 max-w-md text-right">
                <div className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 text-[11px] font-black text-white shadow">
                  <Flame className="h-3.5 w-3.5 text-[#F93A00] animate-pulse" />
                  {slide.tagText}
                </div>

                <div className="mt-3 text-3xl sm:text-5xl font-black text-[#F93A00] tracking-tight drop-shadow-sm">
                  {slide.discountText}
                </div>

                <h3 className="mt-2 text-xl sm:text-3xl font-black text-neutral-900 dark:text-white leading-tight">
                  {slide.title}
                </h3>

                <p className="mt-1.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-sm">
                  {slide.subtitle}
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={() => {
                      onSelectCategory?.(slide.categoryTarget);
                      onShopNow(slide.categoryTarget);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-xs sm:text-sm font-black text-white shadow-lg hover:bg-neutral-800 active:scale-95 transition-all"
                  >
                    وفّر الآن
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                    ضمان جودة وتوصيل سريع
                  </span>
                </div>
              </div>

              {/* Image Side */}
              <div className="relative mt-4 md:mt-0 w-44 h-44 sm:w-64 sm:h-64 md:w-72 md:h-72 flex-shrink-0">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover rounded-2xl shadow-xl transform md:rotate-2 hover:rotate-0 transition-transform duration-300"
                />
                <div className="absolute -bottom-3 -right-3 bg-white dark:bg-neutral-800 rounded-xl px-3 py-1.5 shadow-md border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#F93A00]" />
                  <span className="text-xs font-black text-neutral-900 dark:text-white">أصلي 100%</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 dark:bg-black/80 text-black dark:text-white shadow-md hover:bg-white transition-all"
            aria-label="السابق"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 dark:bg-black/80 text-black dark:text-white shadow-md hover:bg-white transition-all"
            aria-label="التالي"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {PROMO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlideIndex ? 'w-6 bg-black dark:bg-white' : 'w-2 bg-black/30 dark:bg-white/30'
                }`}
                aria-label={`شريحة ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right Side Brand Cards (SHEIN Style Brands) */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-row lg:flex-col gap-3">
          {/* Brand Tile 1: Apple & Premium */}
          <div
            onClick={() => {
              onSelectCategory?.('accessories');
              onShopNow('accessories');
            }}
            className="group flex-1 cursor-pointer overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 relative flex flex-col justify-between hover:border-black dark:hover:border-white transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black tracking-widest text-neutral-500">APPLE & VIP</span>
              <span className="rounded bg-[#F93A00]/10 text-[#F93A00] text-[10px] font-black px-2 py-0.5">
                موصى به
              </span>
            </div>
            <div className="my-2">
              <h4 className="text-base font-black text-neutral-900 dark:text-white">إكسسوارات النخبة</h4>
              <p className="text-xs text-neutral-500">كابلات وشواحن سريعة معتمدة</p>
            </div>
            <div className="flex items-center text-xs font-bold text-[#F93A00] group-hover:gap-2 transition-all">
              <span>تسوق المجموعة</span>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            </div>
          </div>

          {/* Brand Tile 2: Anker / Audio */}
          <div
            onClick={() => {
              onSelectCategory?.('audio');
              onShopNow('audio');
            }}
            className="group flex-1 cursor-pointer overflow-hidden rounded-2xl bg-neutral-900 text-white p-4 relative flex flex-col justify-between hover:ring-2 hover:ring-[#F93A00] transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black tracking-widest text-neutral-400">ANKER SOUND</span>
              <span className="rounded bg-[#F93A00] text-white text-[10px] font-black px-2 py-0.5">
                خصم 25%
              </span>
            </div>
            <div className="my-2">
              <h4 className="text-base font-black text-white">بطاريات وسماعات</h4>
              <p className="text-xs text-neutral-400">طاقة تدوم طوال اليوم</p>
            </div>
            <div className="flex items-center text-xs font-bold text-white group-hover:gap-2 transition-all">
              <span>اكتشف المزيد</span>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            </div>
          </div>

          {/* Brand Tile 3: Fast Shipping */}
          <div className="hidden sm:flex flex-1 rounded-2xl bg-[#FFF1EB] dark:bg-neutral-800/80 border border-[#F93A00]/20 p-4 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F93A00] text-white flex-shrink-0 shadow">
              <Zap className="h-5 w-5" />
            </div>
            <div className="text-right leading-tight">
              <span className="text-xs font-black text-[#F93A00] block">شحن فوري خلال 24 ساعة</span>
              <span className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">لكافة المحافظات مع المعاينة قبل الاستلام</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
