import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ShoppingCart, Sparkles } from "lucide-react";
import { Product, Currency } from "./types";
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

  if (!isOpen || !product) return null;

  const slides = [
    {
      title: "استكشف الفخامة والأداء",
      subtitle: product.name,
      badge: "تفاصيل المنتج",
      image: product.image,
    },
    {
      title: "المواصفات العالية",
      subtitle:
        product.description || "تصميم عصري متين ومواصفات ممتازة تلبي جميع احتياجاتك اليومية.",
      badge: "المواصفات",
      image: product.image,
    },
    {
      title: "راجع السعر الحالي",
      subtitle: `السعر: ${formatPrice(product.priceYER, currency)}`,
      badge: "السعر المعروض",
      image: product.image,
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-0 sm:p-4 dir-rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm h-full sm:h-[650px] bg-gradient-to-b from-gray-900 via-black to-gray-950 text-white sm:rounded-3xl overflow-hidden flex flex-col justify-between p-5"
        >
          {/* Header & Story Bars */}
          <div>
            <div className="flex items-center gap-1.5 mb-4">
              {slides.map((_, idx) => (
                <div key={idx} className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className={`h-full bg-[#2F6BFF] transition-all duration-300 ${
                      idx <= currentSlide ? "w-full" : "w-0"
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-[#2F6BFF] text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>قصة المنتج</span>
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Media Content Area */}
          <div className="relative flex-1 flex flex-col items-center justify-center my-4">
            <img
              src={slides[currentSlide].image}
              alt={slides[currentSlide].title}
              className="max-h-[260px] object-contain drop-shadow-2xl my-auto animate-pulse-subtle"
            />

            <div className="text-center space-y-2 mt-4 px-2">
              <span className="inline-block bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-blue-300">
                {slides[currentSlide].badge}
              </span>
              <h3 className="text-lg font-black text-white">{slides[currentSlide].title}</h3>
              <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                {slides[currentSlide].subtitle}
              </p>
            </div>

            {/* Navigation Tap Overlay */}
            <div className="absolute inset-0 flex justify-between pointer-events-auto">
              <button
                onClick={handlePrev}
                className="w-1/3 h-full opacity-0 cursor-pointer"
                aria-label="السابق"
              />
              <button
                onClick={handleNext}
                className="w-1/3 h-full opacity-0 cursor-pointer"
                aria-label="التالي"
              />
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <button
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="w-full min-h-[46px] bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 text-sm cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>إضافة إلى السلة ({formatPrice(product.priceYER, currency)})</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
