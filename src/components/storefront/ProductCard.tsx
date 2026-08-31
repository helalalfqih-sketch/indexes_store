import { useState } from "react";
import { Check, Heart, ShoppingCart, Star } from "lucide-react";
import type { Currency, Product } from "./types";
import { formatPrice } from "./currency";

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23181825"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2371717a" font-family="sans-serif" font-size="16">&#1604;&#1575; &#1578;&#1578;&#1608;&#1601;&#1585; &#1589;&#1608;&#1585;&#1577;</text></svg>';

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
}: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const hasRealDiscount =
    Number.isFinite(product.originalPriceYER) && product.originalPriceYER > product.priceYER;
  const discountPercent = hasRealDiscount
    ? Math.round((1 - product.priceYER / product.originalPriceYER) * 100)
    : null;
  const isAvailable = product.inStock !== false && product.stockCount !== 0;
  const widthClass =
    variant === "horizontal" ? "w-[170px] shrink-0 snap-start sm:w-[200px]" : "w-full";

  return (
    <article
      className={`${widthClass} group flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-1)] shadow-sm transition-colors hover:border-[#2F6BFF]/45`}
      onClick={() => onSelectProduct(product)}
    >
      <div className="relative aspect-square overflow-hidden bg-[var(--color-surface-2)] p-2.5">
        <img
          src={product.image || FALLBACK_IMAGE}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width={420}
          height={420}
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
          className="h-full w-full object-contain"
        />
        {discountPercent ? (
          <span className="absolute right-2 top-2 rounded-full bg-rose-600 px-2 py-1 text-[10px] font-black text-white">
            خصم {discountPercent}%
          </span>
        ) : null}
        <button
          type="button"
          aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(product);
          }}
          className="absolute left-2 top-2 flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-1)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF]"
        >
          <Heart
            className={`h-4 w-4 ${isFavorite ? "fill-rose-500 text-rose-500" : "text-[var(--color-text-secondary)]"}`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3 text-right" dir="rtl">
        <h2 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-[var(--color-text-primary)]">
          {product.name}
        </h2>
        <div className="mt-2 flex min-h-5 items-center justify-between gap-2 text-[11px]">
          {product.rating > 0 && product.reviewsCount > 0 ? (
            <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {product.rating.toFixed(1)} ({product.reviewsCount})
            </span>
          ) : (
            <span className="text-[var(--color-text-muted)]">لا توجد تقييمات</span>
          )}
          <span className={isAvailable ? "font-bold text-emerald-500" : "font-bold text-rose-500"}>
            {isAvailable ? "متوفر" : "نفد المخزون"}
          </span>
        </div>

        <div className="mt-auto pt-3">
          <div className="flex min-h-11 items-baseline justify-between gap-2 border-t border-[var(--color-border-subtle)] pt-3">
            <strong className="text-sm text-[#2F6BFF] sm:text-base">
              {formatPrice(product.priceYER, currency)}
            </strong>
            {hasRealDiscount ? (
              <span className="text-[11px] text-[var(--color-text-muted)] line-through">
                {formatPrice(product.originalPriceYER, currency)}
              </span>
            ) : null}
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
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2F6BFF] px-3 text-xs font-black text-white transition-colors hover:bg-[#2458D8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-3)] disabled:text-[var(--color-text-muted)]"
          >
            {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            {added ? "تمت الإضافة ✓" : isAvailable ? "أضف للسلة" : "غير متوفر"}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelectProduct(product);
            }}
            className="mt-1 min-h-11 w-full rounded-xl text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF]"
          >
            التفاصيل
          </button>
        </div>
      </div>
    </article>
  );
}
