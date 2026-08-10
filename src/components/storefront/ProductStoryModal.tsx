import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ShoppingCart, Sparkles, X } from "lucide-react";
import type { Currency, Product } from "./types";
import { formatPrice } from "./currency";

interface ProductStoryModalProps {
  product: Product | null;
  currency: Currency;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export const ProductStoryModal: React.FC<ProductStoryModalProps> = ({
  product,
  currency,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (isOpen) setCurrentSlide(0);
  }, [isOpen, product?.id]);

  if (!isOpen || !product) return null;

  const slides = [
    {
      title: "استكشف الفخامة والأداء",
      subtitle: product.name,
      badge: "منتج أصلي 100%",
      image: product.image,
    },
    {
      title: "المواصفات العالية",
      subtitle:
        product.description ||
        "تصميم عصري متين ومواصفات ممتازة تلبي جميع احتياجاتك اليومية.",
      badge: "ضمان الجودة",
      image: product.image,
    },
    {
      title: "جاهز للتوصيل السريع",
      subtitle: `سعر خاص: ${formatPrice(product.priceYER, currency)}`,
      badge: "توصيل لجميع المحافظات",
      image: product.image,
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide((value) => value + 1);
    else onClose();
  };

  const handlePrev = () => {
    if (currentSlide > 0) setCurrentSlide((value) => value - 1);
  };

  return (
    <AnimatePresence>
      <div className="dir-rtl fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-0 backdrop-blur-md sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative flex h-full w-full max-w-sm flex-col justify-between overflow-hidden bg-gradient-to-b from-gray-900 via-black to-gray-950 p-5 text-white sm:h-[650px] sm:rounded-3xl"
        >
          <div>
            <div className="mb-4 flex items-center gap-1.5">
              {slides.map((_, index) => (
                <div key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div
                    className={`h-full bg-[#2F6BFF] transition-all duration-300 ${index <= currentSlide ? "w-full" : "w-0"}`}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 rounded-full bg-[#2F6BFF] px-2 py-0.5 text-[10px] font-black text-white">
                <Sparkles className="h-3 w-3" />
                قصة المنتج
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق قصة المنتج"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative my-4 flex flex-1 flex-col items-center justify-center">
            <img
              src={slides[currentSlide].image}
              alt={slides[currentSlide].title}
              className="my-auto max-h-[260px] object-contain drop-shadow-2xl"
            />
            <div className="mt-4 space-y-2 px-2 text-center">
              <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-blue-300">
                {slides[currentSlide].badge}
              </span>
              <h3 className="text-lg font-black text-white">{slides[currentSlide].title}</h3>
              <p className="line-clamp-3 text-xs leading-relaxed text-gray-300">
                {slides[currentSlide].subtitle}
              </p>
            </div>

            <div className="pointer-events-auto absolute inset-0 flex justify-between">
              <button
                type="button"
                onClick={handlePrev}
                className="h-full w-1/3 cursor-pointer opacity-0"
                aria-label="السابق"
              />
              <button
                type="button"
                onClick={handleNext}
                className="h-full w-1/3 cursor-pointer opacity-0"
                aria-label="التالي"
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#2F6BFF] py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 hover:bg-[#2458D8]"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>إضافة إلى السلة ({formatPrice(product.priceYER, currency)})</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
