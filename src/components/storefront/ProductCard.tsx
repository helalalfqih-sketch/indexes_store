import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Heart, Plus, Star } from "lucide-react";
import type { Currency, Product } from "./types";
import { formatPrice } from "./currency";
import { OptimizedImage } from "@/components/optimized-image";

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
  sectionSource?: string;
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
  sectionSource = variant,
}: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const hasRealDiscount =
    Number.isFinite(product.originalPriceYER) && product.originalPriceYER > product.priceYER;
  const discountPercent = hasRealDiscount
    ? Math.round((1 - product.priceYER / product.originalPriceYER) * 100)
    : null;
  const isAvailable = product.priceYER > 0 && product.inStock !== false && product.stockCount !== 0;
  const widthClass =
    variant === "horizontal" ? "w-[148px] shrink-0 snap-start sm:w-[180px]" : "w-full";

  return (
    <article
      data-storefront-product-id={product.id}
      data-element-key={`${sectionSource}:${product.id}:card`}
      data-product-name={product.name}
      data-price-yer={product.priceYER}
      data-previous-price-yer={hasRealDiscount ? product.originalPriceYER : undefined}
      data-product-brand={product.brand}
      data-product-rating={product.rating}
      data-product-stock={product.stockCount}
      data-product-category={product.category}
      className={`${widthClass} ix-template-product-card group min-w-0 bg-surface text-foreground`}
      dir="rtl"
    >
      <div className="ix-template-product-card__media">
        <Link
          to="/product/$slug"
          params={{ slug: product.slug || product.id }}
          aria-label={product.name}
          onClick={(event) => {
            event.preventDefault();
            onSelectProduct(product);
          }}
        >
          <OptimizedImage
            src={product.image || FALLBACK_IMAGE}
            alt={product.name}
            size="card"
            eager={index < 4}
            draggable={false}
            className="h-full w-full bg-[#f7f7f7] object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>
        {discountPercent ? (
          <span className="ix-template-product-card__badge">-{discountPercent}%</span>
        ) : null}
        <button
          type="button"
          data-element-key={`${sectionSource}:${product.id}:favorite`}
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

      <div className="ix-template-product-card__body">
        <h2 className="line-clamp-2 min-h-[38px] text-xs font-bold leading-[1.55] text-foreground">
          <Link
            to="/product/$slug"
            params={{ slug: product.slug || product.id }}
            className="focus-visible:underline"
            onClick={(event) => {
              event.preventDefault();
              onSelectProduct(product);
            }}
          >
            {product.name}
          </Link>
        </h2>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <strong className="block truncate text-base font-black text-[var(--ix-danger)]">
              {product.priceYER > 0 ? formatPrice(product.priceYER, currency) : "السعر غير متاح"}
            </strong>
            {hasRealDiscount && (
              <span className="block truncate text-[10px] text-neutral-400 line-through">
                {formatPrice(product.originalPriceYER, currency)}
              </span>
            )}
          </div>
          <button
            type="button"
            data-element-key={`${sectionSource}:${product.id}:add-to-cart`}
            disabled={!isAvailable || added}
            onClick={(event) => {
              event.stopPropagation();
              if (!isAvailable || added) return;
              onAddToCart(product);
              setAdded(true);
              window.setTimeout(() => setAdded(false), 1400);
            }}
            aria-label={added ? "تمت الإضافة إلى السلة" : "إضافة إلى السلة"}
            className="ix-template-product-card__add"
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
