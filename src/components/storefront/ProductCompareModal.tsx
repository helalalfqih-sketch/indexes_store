import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeftRight, ShoppingCart, Trash2, Star } from "lucide-react";
import { Product, Currency } from "./types";
import { formatPrice } from "./currency";

interface ProductCompareModalProps {
  products: Product[];
  compareList: Product[];
  currency: Currency;
  isOpen: boolean;
  onClose: () => void;
  onRemoveFromCompare: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductCompareModal: React.FC<ProductCompareModalProps> = ({
  compareList,
  currency,
  isOpen,
  onClose,
  onRemoveFromCompare,
  onAddToCart,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#100B1A] border border-gray-800 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl dir-rtl text-right"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-800 flex items-center justify-between bg-[#18112B]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  مقارنة المنتجات والمواصفات
                </h2>
                <p className="text-xs text-gray-400">
                  قارن بين المنتجات المحددة لاختيار الأنسب لمتطلباتك
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comparison Body */}
          <div className="p-4 sm:p-6 overflow-x-auto flex-1 no-scrollbar">
            {compareList.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-white/5 border border-gray-800 flex items-center justify-center text-gray-500">
                  <ArrowLeftRight className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">لا توجد منتجات بالمقارنة حالياً</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  يمكنك إضافة أي منتج إلى قائمة المقارنة بالنقر على زر المقارنة من تفاصيل المنتج.
                </p>
              </div>
            ) : (
              <div className="min-w-[600px] grid grid-cols-1 md:grid-cols-3 gap-4">
                {compareList.map((product) => (
                  <div
                    key={product.id}
                    className="bg-[#18112B] border border-gray-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 relative group hover:border-[#7B3FFF]/40 transition-colors"
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => onRemoveFromCompare(product.id)}
                      className="absolute top-3 left-3 p-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors z-10"
                      title="إزالة من المقارنة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Image & Title */}
                    <div className="text-center space-y-2 pt-2">
                      <div className="w-full h-36 bg-[#100B1A] rounded-xl p-2 flex items-center justify-center border border-gray-800">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <h3 className="font-bold text-sm text-white line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-gray-400 line-clamp-1">{product.subtitle}</p>
                    </div>

                    {/* Specifications List */}
                    <div className="space-y-3 text-xs divide-y divide-gray-800/60 pt-2">
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-gray-400">السعر الحالي:</span>
                        <span className="font-extrabold text-[#7B3FFF] text-sm">
                          {formatPrice(product.priceYER, currency)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-gray-400">التقييم:</span>
                        <span className="font-bold text-amber-400 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {product.rating} ({product.reviewsCount})
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-gray-400">حالة التوفر:</span>
                        <span
                          className={`font-bold ${
                            product.inStock !== false ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {product.inStock !== false ? "متوفر بالمخزن ✅" : "غير متوفر ❌"}
                        </span>
                      </div>

                      <div className="pt-2">
                        <span className="text-gray-400 block mb-1">الوصف المختصر:</span>
                        <p className="text-gray-300 text-[11px] leading-relaxed line-clamp-3">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => {
                        onAddToCart(product, 1);
                      }}
                      className="w-full bg-[#7B3FFF] hover:bg-[#682BDD] text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>إضافة للسلة</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
