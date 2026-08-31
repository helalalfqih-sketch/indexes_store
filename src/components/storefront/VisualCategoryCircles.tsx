import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export interface VisualCategory {
  id: string;
  name: string;
  image: string;
  badge?: string;
  isPopular?: boolean;
}

export const VISUAL_CATEGORIES: VisualCategory[] = [
  {
    id: 'all',
    name: 'الكل',
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=160&auto=format&fit=crop&q=80',
    badge: 'الكل',
  },
  {
    id: 'smartwatches',
    name: 'ساعات ذكية',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&auto=format&fit=crop&q=80',
    badge: 'خصم 40%',
    isPopular: true,
  },
  {
    id: 'audio',
    name: 'سماعات وصوتيات',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=160&auto=format&fit=crop&q=80',
    badge: 'الأكثر طلباً',
    isPopular: true,
  },
  {
    id: 'accessories',
    name: 'شواحن وإكسسوارات',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=160&auto=format&fit=crop&q=80',
  },
  {
    id: 'home_appliances',
    name: 'أجهزة ومنزل',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=160&auto=format&fit=crop&q=80',
    badge: 'جديد',
  },
  {
    id: 'perfumes',
    name: 'عطور وبخور',
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=160&auto=format&fit=crop&q=80',
    badge: 'فاخر',
  },
  {
    id: 'health_fitness',
    name: 'الصحة واللياقة',
    image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=160&auto=format&fit=crop&q=80',
  },
  {
    id: 'automotive',
    name: 'مستلزمات سيارات',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=160&auto=format&fit=crop&q=80',
  },
  {
    id: 'tools',
    name: 'أدوات ومعدات',
    image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=160&auto=format&fit=crop&q=80',
  },
  {
    id: 'baby_kids',
    name: 'مستلزمات الأطفال',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=160&auto=format&fit=crop&q=80',
  },
];

interface VisualCategoryCirclesProps {
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

export const VisualCategoryCircles: React.FC<VisualCategoryCirclesProps> = ({
  selectedCategoryId,
  onSelectCategory,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <section className="relative py-4 px-2 sm:px-6 w-full max-w-[1700px] mx-auto select-none" aria-label="أقسام المتجر المصورة">
      {/* Section Sub-header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-[#F93A00]" />
          <h2 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white tracking-wide">
            تصفح الأقسام بالصور
          </h2>
          <span className="rounded-full bg-[#FFF1EB] dark:bg-neutral-800 text-[#F93A00] text-[10px] font-black px-2 py-0.5">
            توصيات اليوم
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scroll('right')}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 shadow-sm transition-all"
            aria-label="السابق"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('left')}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 shadow-sm transition-all"
            aria-label="التالي"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollRef}
        className="flex items-start gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth px-2 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {VISUAL_CATEGORIES.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group flex flex-col items-center flex-shrink-0 transition-transform active:scale-95 focus-visible:outline-none"
            >
              {/* Circular Thumbnail Container */}
              <div className="relative">
                <div
                  className={`relative flex h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 items-center justify-center rounded-full overflow-hidden transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-[#F93A00] ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 scale-105 shadow-md shadow-[#F93A00]/20'
                      : 'border-2 border-neutral-100 dark:border-neutral-800 group-hover:border-neutral-300 dark:group-hover:border-neutral-700 shadow-sm'
                  }`}
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110 bg-neutral-100 dark:bg-neutral-800"
                  />

                  {/* Dark subtle overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>

                {/* Badge if any (e.g. خصم 40%, جديد, الأكثر طلباً) */}
                {cat.badge && (
                  <span
                    className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none text-white shadow-sm ${
                      cat.badge.includes('خصم')
                        ? 'bg-[#F93A00]'
                        : cat.badge === 'جديد'
                        ? 'bg-emerald-600'
                        : 'bg-black'
                    }`}
                  >
                    {cat.badge}
                  </span>
                )}
              </div>

              {/* Title underneath */}
              <span
                className={`mt-2.5 text-center text-xs font-bold transition-colors line-clamp-1 max-w-[80px] sm:max-w-[95px] ${
                  isSelected
                    ? 'text-[#F93A00] font-black'
                    : 'text-neutral-800 dark:text-neutral-200 group-hover:text-black dark:group-hover:text-white'
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
