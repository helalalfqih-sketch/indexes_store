import React, { useState, useEffect } from 'react';
import { Zap, ChevronLeft, ChevronRight, ShoppingCart, Flame } from 'lucide-react';
import { Product, Currency } from './types';
import { formatPrice } from './currency';

interface FlashDealsSectionProps {
  products: Product[];
  currency: Currency;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
}

export const FlashDealsSection: React.FC<FlashDealsSectionProps> = ({
  products,
  currency,
  onSelectProduct,
  onAddToCart,
}) => {
  const dealProducts = products.length > 0 ? products.slice(0, 6) : [];
  const dealEnd = dealProducts.find((product) => product.dealEnd)?.dealEnd ?? null;
  const dealEndTime = dealEnd ? new Date(dealEnd).getTime() : NaN;
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!Number.isFinite(dealEndTime)) return;

    const update = () => {
      const remaining = Math.max(0, dealEndTime - Date.now());
      const totalSeconds = Math.floor(remaining / 1000);
      setTimeLeft({
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [dealEndTime]);

  if (dealProducts.length === 0) return null;

  return (
    <section className="py-4 px-3 sm:px-6 w-full max-w-[1700px] mx-auto" aria-label="عروض فلاش الترويجية">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-black via-neutral-900 to-black p-4 sm:p-5 text-white mb-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F93A00] text-white shadow-md shadow-[#F93A00]/30 animate-pulse">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black">عروض فلاش اليومية</h3>
              <span className="rounded bg-[#F93A00] px-2 py-0.5 text-[10px] font-black uppercase text-white">
                FLASH SALE
              </span>
            </div>
            <p className="text-xs text-neutral-400">تخفيضات محدودة على المنتجات الأكثر طلباً</p>
          </div>
        </div>

        {/* Countdown Box — shown only when the catalog provides a real end time */}
        {Number.isFinite(dealEndTime) ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-300 hidden sm:inline">ينتهي العرض خلال:</span>
            <div className="flex items-center gap-1.5 font-mono font-black text-sm" dir="ltr" aria-label="الوقت المتبقي للعرض">
              <div className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-neutral-800 border border-neutral-700 px-1 text-white shadow">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <span>:</span>
              <div className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-neutral-800 border border-neutral-700 px-1 text-white shadow">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <span>:</span>
              <div className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#F93A00] px-1 text-white shadow">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
            </div>
          </div>
        ) : (
          <span className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-neutral-200">عروض محدودة</span>
        )}
      </div>

      {/* Products Row / Grid */}
      <div className="grid grid-cols-2 min-[640px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {dealProducts.map((product) => {
          const originalPrice = product.originalPriceYER;
          const stockLabel = product.stockCount
            ? `متبقي ${product.stockCount}`
            : product.inStock
              ? 'متوفر الآن'
              : 'نفد المخزون';

          return (
            <div
              key={product.id}
              onClick={() => onSelectProduct(product)}
              className="group cursor-pointer rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-md hover:border-black dark:hover:border-white transition-all flex flex-col justify-between"
            >
              {/* Product Image Box */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Discount Tag */}
                <div className="absolute top-2 right-2 rounded-lg bg-[#F93A00] px-2 py-0.5 text-[11px] font-black text-white shadow">
                  {product.discountBadge || '-35%'}
                </div>

                {/* Quick Add Button on Hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product, e);
                  }}
                  className="absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow-md opacity-90 hover:opacity-100 hover:scale-110 active:scale-95 transition-all"
                  aria-label="إضافة سريعة للسلة"
                >
                  <ShoppingCart className="h-4 w-4" />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-[#F93A00] transition-colors">
                    {product.name}
                  </h4>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="font-mono text-sm font-black text-[#F93A00]">
                      {formatPrice(product.priceYER, currency)}
                    </span>
                    {originalPrice && originalPrice > product.priceYER && (
                      <span className="font-mono text-[10px] text-neutral-400 line-through">
                        {formatPrice(originalPrice, currency)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[10px] font-bold text-neutral-500">
                  <span className={product.inStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                    {stockLabel}
                  </span>
                  <Flame className="h-3 w-3 text-[#F93A00]" aria-hidden="true" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
