import React, { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Product, Currency } from "./types";
import { formatPrice } from "./currency";
import { Heart, ShoppingCart, Star } from "lucide-react";

interface ProductCardProps {
  product: Product;
  currency: Currency;
  isFavorite: boolean;
  onToggleFavorite: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  variant?: "horizontal" | "grid";
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
  onSelectProduct,
  variant = "horizontal",
}) => {
  const shouldReduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });
  const yParallax = useTransform(scrollYProgress, [0, 1], [4, -4]);
  const y = shouldReduceMotion ? 0 : yParallax;

  const discountPercent =
    product.originalPriceYER > product.priceYER
      ? Math.round((1 - product.priceYER / product.originalPriceYER) * 100)
      : null;

  const badgeText = product.discountBadge || (discountPercent ? `خصم ${discountPercent}%` : null);

  const containerClasses =
    variant === "horizontal"
      ? "snap-start flex-shrink-0 w-[165px] sm:w-[190px] bg-[#100B1A]/90 backdrop-blur-md border border-gray-800 hover:border-[#7B3FFF] hover:bg-[#161026] rounded-2xl flex flex-col justify-between relative group transition-all duration-300 ease-out shadow-sm hover:shadow-md cursor-pointer h-full overflow-hidden"
      : "bg-[#100B1A]/90 backdrop-blur-md border border-gray-800 hover:border-[#7B3FFF] hover:bg-[#161026] rounded-2xl flex flex-col justify-between relative group transition-all duration-300 ease-out shadow-sm hover:shadow-md w-full cursor-pointer h-full overflow-hidden";

  return (
    <motion.div
      ref={cardRef}
      style={{ y }}
      initial={{ opacity: 0, scale: 0.97 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-20px" }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelectProduct(product)}
      className={containerClasses}
    >
      {/* 1. PRODUCT IMAGE AREA WITH BOTTOM BADGE & HEART */}
      <div className="relative w-full h-[110px] sm:h-[130px] bg-[#140E24]/80 p-2 flex items-center justify-center overflow-hidden">
        {/* Product Image */}
        <img
          src={product.image}
          alt={product.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80";
          }}
          className="max-h-full max-w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)] group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Bottom Bar inside Image Frame (Discount Badge on Right, Heart on Left in RTL) */}
        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between z-10 dir-rtl pointer-events-none">
          {badgeText ? (
            <div className="bg-gradient-to-r from-rose-600 to-amber-500 text-white text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-lg shadow-md whitespace-nowrap pointer-events-auto">
              {badgeText}
            </div>
          ) : (
            <div />
          )}

          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(product);
            }}
            aria-label="إضافة للمفضلة"
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-all cursor-pointer pointer-events-auto backdrop-blur-md border ${
              isFavorite
                ? "text-rose-500 bg-rose-500/20 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                : "text-gray-400 hover:text-white bg-[#08060F]/80 border-gray-800"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
          </motion.button>
        </div>
      </div>

      {/* Divider line separating Image section and Content section */}
      <div className="w-full h-[1px] bg-gray-800/60" />

      {/* 2. CONTENT AREA */}
      <div className="p-2.5 flex flex-col flex-1 justify-between space-y-2 text-right dir-rtl">
        {/* Product Name */}
        <div>
          <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-[#7B3FFF] transition-colors leading-tight">
            {product.name}
          </h4>

          {/* Rating & Reviews Row */}
          <div className="flex items-center gap-1.5 text-[11px] mt-1 text-gray-400">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
            <span className="text-white font-bold">{product.rating || "4.8"}</span>
            <span className="text-gray-500 font-medium">({product.reviewsCount || 120} تقييم)</span>
          </div>
        </div>

        {/* Pricing Area */}
        <div className="space-y-0.5">
          <div className="text-white font-black text-xs sm:text-sm tracking-tight">
            {formatPrice(product.priceYER, currency)}
          </div>
          {product.originalPriceYER > product.priceYER && (
            <div className="text-gray-500 line-through text-[11px] font-medium">
              {formatPrice(product.originalPriceYER, currency)}
            </div>
          )}
        </div>

        {/* Action Button: Add to Cart */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="w-full mt-1 bg-[#7B3FFF] hover:bg-[#682BDD] text-white text-xs font-bold py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 shadow-md shadow-purple-600/20 cursor-pointer active:scale-95 group/btn whitespace-nowrap"
        >
          <ShoppingCart className="w-3.5 h-3.5 text-white group-hover/btn:scale-110 transition-transform" />
          <span>أضف إلى السلة</span>
        </motion.button>
      </div>
    </motion.div>
  );
};
