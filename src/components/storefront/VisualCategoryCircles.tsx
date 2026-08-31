import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Grid, Watch, Headphones, Smartphone, Home, Sparkles, Dumbbell, Car, Wrench, Baby } from 'lucide-react';
import { Product } from './types';

export interface CategoryMeta {
  id: string;
  name: string;
  icon: React.ElementType<{ className?: string }>;
  badge?: string;
  gradient: string;
}

export const CATEGORIES_META: CategoryMeta[] = [
  {
    id: 'all',
    name: 'الكل',
    icon: Grid,
    badge: 'الكل',
    gradient: 'from-black to-neutral-800 text-white',
  },
  {
    id: 'smartwatches',
    name: 'ساعات ذكية',
    icon: Watch,
    badge: 'خصم 40%',
    gradient: 'from-blue-600 to-indigo-700 text-white',
  },
  {
    id: 'audio',
    name: 'سماعات وصوتيات',
    icon: Headphones,
    badge: 'الأكثر طلباً',
    gradient: 'from-purple-600 to-violet-800 text-white',
  },
  {
    id: 'accessories',
    name: 'شواحن وإكسسوارات',
    icon: Smartphone,
    gradient: 'from-emerald-600 to-teal-700 text-white',
  },
  {
    id: 'home_appliances',
    name: 'أجهزة ومنزل',
    icon: Home,
    badge: 'جديد',
    gradient: 'from-amber-600 to-orange-700 text-white',
  },
  {
    id: 'perfumes',
    name: 'عطور وبخور',
    icon: Sparkles,
    badge: 'فاخر',
    gradient: 'from-rose-600 to-pink-700 text-white',
  },
  {
    id: 'health_fitness',
    name: 'الصحة واللياقة',
    icon: Dumbbell,
    gradient: 'from-cyan-600 to-blue-700 text-white',
  },
  {
    id: 'automotive',
    name: 'مستلزمات سيارات',
    icon: Car,
    gradient: 'from-red-600 to-rose-700 text-white',
  },
  {
    id: 'tools',
    name: 'أدوات ومعدات',
    icon: Wrench,
    gradient: 'from-slate-700 to-zinc-900 text-white',
  },
  {
    id: 'baby_kids',
    name: 'مستلزمات الأطفال',
    icon: Baby,
    gradient: 'from-yellow-500 to-amber-600 text-white',
  },
];

interface VisualCategoryCirclesProps {
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  products?: Product[];
}

export const VisualCategoryCircles: React.FC<VisualCategoryCirclesProps> = ({
  selectedCategoryId,
  onSelectCategory,
  products = [],
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // Find real product images from store catalog for each category
  const getCategoryImage = (categoryId: string): string | null => {
    if (categoryId === 'all') {
      const featured = products.find((p) => p.image && !p.image.includes('data:image/svg'));
      return featured?.image || null;
    }
    const match = products.find(
      (p) =>
        (p.category === categoryId || p.category.toLowerCase().includes(categoryId.toLowerCase())) &&
        p.image &&
        !p.image.includes('data:image/svg')
    );
    return match?.image || null;
  };

  return (
    <section className="relative bg-[var(--color-surface-1)] py-4 px-2 sm:bg-transparent sm:px-6 w-full max-w-[1700px] mx-auto select-none" aria-label="أقسام المتجر">
      {/* Section Sub-header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-[#F93A00]" />
          <h2 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white tracking-wide">
            تصفح الأقسام
          </h2>
          <span className="rounded-full bg-[#FFF1EB] dark:bg-neutral-800 text-[#F93A00] text-[10px] font-black px-2 py-0.5">
            منتجات المتجر المعتمدة
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
        className="grid grid-cols-5 items-start gap-x-1 gap-y-5 overflow-visible px-1 pb-1 sm:flex sm:gap-6 sm:overflow-x-auto sm:px-2 sm:pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {CATEGORIES_META.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const realImage = getCategoryImage(cat.id);
          const IconComponent = cat.icon;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group flex w-full flex-col items-center transition-transform active:scale-95 focus-visible:outline-none sm:w-auto sm:flex-shrink-0"
            >
              {/* Circular Thumbnail Container */}
              <div className="relative">
                <div
                  className={`relative flex h-[68px] w-[68px] sm:h-20 sm:w-20 md:h-24 md:w-24 items-center justify-center rounded-full overflow-hidden transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-[#F93A00] ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 scale-105 shadow-md shadow-[#F93A00]/20'
                      : 'border-2 border-neutral-200 dark:border-neutral-800 group-hover:border-neutral-400 dark:group-hover:border-neutral-600 shadow-sm'
                  }`}
                >
                  {realImage ? (
                    <img
                      src={realImage}
                      alt={cat.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110 bg-white dark:bg-neutral-900"
                    />
                  ) : (
                    <div className={`h-full w-full bg-gradient-to-br ${cat.gradient} flex items-center justify-center p-3 shadow-inner`}>
                      <IconComponent className="h-7 w-7 sm:h-8 sm:w-8 transition-transform group-hover:scale-110 drop-shadow" />
                    </div>
                  )}

                  {/* Dark subtle overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>

                {/* Badge if any */}
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
                className={`mt-2.5 max-w-[68px] text-center text-[11px] font-bold leading-tight transition-colors line-clamp-2 sm:max-w-[95px] sm:text-xs ${
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
