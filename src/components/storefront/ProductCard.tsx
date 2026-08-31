import { useState } from "react";
import { Check, Heart, Plus, Star } from "lucide-react";
import type { Currency, Product } from "./types";
import { formatPrice } from "./currency";

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="400" height="500" fill="%23f5f5f5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2371717a" font-family="sans-serif" font-size="16">لا تتوفر صورة</text></svg>';

interface ProductCardProps {
  product: Product;
  currency: Currency;
  isFavorite: boolean;
  onToggleFavorite: (product: Product) => void;
  onAddToCart: (product: Product, selectedColor?: string) => void;
  onSelectProduct: (product: Product) => void;
  variant?: "horizontal" | "grid";
  index?: number;
}

export function ProductCard({
  product,
  currency,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
  onSelectProduct,
  variant = "grid",
  index = 0,
}: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const hasRealDiscount =
    Number.isFinite(product.originalPriceYER) && product.originalPriceYER > product.priceYER;
  const discountPercent = hasRealDiscount
    ? Math.round((1 - product.priceYER / product.originalPriceYER) * 100)
    : null;
  const isAvailable = product.inStock !== false && product.stockCount !== 0;
  const widthClass =
    variant === "horizontal" ? "w-[148px] shrink-0 snap-start sm:w-[180px]" : "w-full";

  return (
    <article
      className={`${widthClass} group min-w-0 cursor-pointer bg-white text-black`}
      onClick={() => onSelectProduct(product)}
      dir="rtl"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f7f7f7]">
        <img
          src={product.image || FALLBACK_IMAGE}
          alt={product.name}
          loading={index < 4 ? "eager" : "lazy"}
          fetchPriority={index < 2 ? "high" : "auto"}
          decoding="async"
          width={480}
          height={640}
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        {discountPercent ? (
          <span className="absolute right-1.5 top-1.5 bg-[#ff2442] px-1.5 py-0.5 text-[9px] font-black text-white">
            -{discountPercent}%
          </span>
        ) : null}
        <button
          type="button"
          aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(product);
          }}
          className="absolute left-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-black shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          <Heart
            className={`h-4 w-4 ${isFavorite ? "fill-[#ff2442] text-[#ff2442]" : "text-black"}`}
          />
        </button>
      </div>

      <div className="px-1.5 pb-2 pt-1.5">
        <h2 className="line-clamp-2 min-h-8 text-[11px] font-medium leading-4 text-black">
          {product.name}
        </h2>
        <div className="mt-1 flex items-center justify-between gap-1">
          <div className="min-w-0">
            <strong className="block truncate text-[13px] font-black text-black">
              {formatPrice(product.priceYER, currency)}
            </strong>
            {hasRealDiscount && (
              <span className="block truncate text-[10px] text-neutral-400 line-through">
                {formatPrice(product.originalPriceYER, currency)}
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={!isAvailable || added}
            onClick={(event) => {
              event.stopPropagation();
              if (!isAvailable || added) return;
              onAddToCart(product);
              setAdded(true);
              window.setTimeout(() => setAdded(false), 1400);
            }}
            aria-label={added ? "تمت الإضافة إلى السلة" : "إضافة إلى السلة"}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black text-black transition-colors hover:bg-black hover:text-white disabled:border-neutral-200 disabled:text-neutral-300"
          >
            {added ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </button>
        </div>
        {product.rating > 0 && product.reviewsCount > 0 ? (
          <span className="mt-1 flex items-center gap-0.5 text-[9px] text-neutral-500">
            <Star className="h-3 w-3 fill-black text-black" />
            {product.rating.toFixed(1)} ({product.reviewsCount})
          </span>
        ) : null}
      </div>
    </article>
  );
}
