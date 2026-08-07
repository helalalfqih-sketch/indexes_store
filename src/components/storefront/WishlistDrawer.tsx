import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { Product, Currency } from "./types";
import { formatPrice } from "./currency";

interface WishlistDrawerProps {
  isOpen: boolean;
  favorites: string[];
  products: Product[];
  currency: Currency;
  onClose: () => void;
  onToggleFavorite: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onSelectProduct: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  favorites,
  products,
  currency,
  onClose,
  onToggleFavorite,
  onAddToCart,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute inset-y-0 right-0 max-w-full flex pl-10 dir-rtl text-right"
        >
          <div className="w-screen max-w-md bg-[#100B1A] border-r border-gray-800 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between bg-[#18112B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Heart className="w-5 h-5 fill-rose-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    قائمة المفضلة ({favoriteProducts.length})
                  </h2>
                  <p className="text-xs text-gray-400">
                    المنتجات التي قمت بحفظها للرجوع إليها لاحقاً
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="إغلاق"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {favoriteProducts.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-white/5 border border-gray-800 flex items-center justify-center text-gray-500">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white">قائمة المفضلة فارغة حالياً</h3>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    تصفح منتجاتنا واضغط على أيقونة القلب على أي منتج لإضافته إلى المفضلة.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-[#7B3FFF] hover:bg-[#682BDD] text-white text-xs font-bold inline-flex items-center gap-2"
                  >
                    <span>تصفح المنتجات</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              ) : (
                favoriteProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => onSelectProduct(product)}
                    className="bg-[#18112B] border border-gray-800 hover:border-purple-500/40 rounded-2xl p-3 flex items-center gap-3 cursor-pointer group transition-all"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 object-contain rounded-xl bg-[#100B1A] p-1 border border-gray-800"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#7B3FFF] transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-gray-400 line-clamp-1">{product.subtitle}</p>
                      <div className="text-[#7B3FFF] font-extrabold text-xs mt-1">
                        {formatPrice(product.priceYER, currency)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onAddToCart(product, 1)}
                        className="p-2 rounded-xl bg-[#7B3FFF] hover:bg-[#682BDD] text-white shadow-md"
                        title="أضف إلى السلة"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggleFavorite(product)}
                        className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/30"
                        title="إزالة من المفضلة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
