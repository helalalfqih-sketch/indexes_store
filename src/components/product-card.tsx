import { Link } from "@tanstack/react-router";
import { Check, Heart, Plus, Star, Video } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/store-data";
import type { LegacyProductShape } from "@/lib/data-adapter";
import { formatPrice } from "@/lib/store-data";
import { OptimizedImage } from "@/components/optimized-image";
import { useCart } from "@/lib/cart-store";
import { useFavorites } from "@/lib/use-favorites";
import { toast } from "sonner";

export interface ProductCardProps {
  product: Product | LegacyProductShape;
  eager?: boolean;
}

export function ProductCard({ product, eager = false }: ProductCardProps) {
  const cart = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [added, setAdded] = useState(false);
  const metadata = product as LegacyProductShape & Record<string, unknown>;
  const hasValidPrice = Number.isFinite(product.price) && product.price > 0;
  const hasRealDiscount =
    hasValidPrice &&
    typeof product.oldPrice === "number" &&
    Number.isFinite(product.oldPrice) &&
    product.oldPrice > product.price;
  const discount = hasRealDiscount
    ? Math.round(((Number(product.oldPrice) - product.price) / Number(product.oldPrice)) * 100)
    : null;
  const available = hasValidPrice && product.stock > 0;
  const favorite = isFavorite(product.id);
  const reviews = Number(metadata.reviews ?? metadata.reviews_count ?? 0);
  const hasRating = Number(product.rating) > 0 && reviews > 0;
  const hasVideo = Boolean(
    metadata.videoPlaybackId ||
    metadata.video_playback_id ||
    metadata.videoUrl ||
    metadata.video_url ||
    (Array.isArray(metadata.videos) && metadata.videos.length > 0),
  );

  const addToCart = () => {
    if (!available || added) return;
    cart.add(product as Product);
    setAdded(true);
    toast.success(`تمت إضافة "${product.name}" إلى السلة`);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article
      className="ix-template-product-card group flex h-full min-w-0 flex-col"
      data-storefront-product-id={product.id}
      data-product-slug={product.slug}
      data-product-name={product.name}
      data-price-yer={hasValidPrice ? product.price : undefined}
      dir="rtl"
    >
      <div className="ix-template-product-card__media">
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          aria-label={`عرض ${product.name}`}
          className="block h-full w-full"
        >
          <OptimizedImage
            src={product.image}
            alt={product.name}
            size="card"
            eager={eager}
            draggable={false}
            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>

        <button
          type="button"
          onClick={() => toggleFavorite(product.id)}
          aria-pressed={favorite}
          aria-label={favorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
          className="absolute left-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white/95 text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ix-primary)]"
        >
          <Heart
            className={`h-4 w-4 ${favorite ? "fill-[var(--ix-danger)] text-[var(--ix-danger)]" : ""}`}
            aria-hidden="true"
          />
        </button>

        {discount ? <span className="ix-template-product-card__badge">خصم {discount}%</span> : null}

        {hasVideo ? (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-1 text-[9px] font-bold text-white">
            <Video className="h-3 w-3" aria-hidden="true" />
            فيديو
          </span>
        ) : null}
      </div>

      <div className="ix-template-product-card__body flex flex-1 flex-col">
        <h2 className="line-clamp-2 min-h-[38px] text-xs font-bold leading-[1.55] text-[var(--ix-text)]">
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="focus-visible:underline"
          >
            {product.name}
          </Link>
        </h2>

        {hasRating ? (
          <span className="mt-1 flex items-center gap-1 text-[10px] text-[var(--ix-muted)]">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
            {Number(product.rating).toFixed(1)} ({reviews})
          </span>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <strong className="block truncate text-base font-black text-[var(--ix-danger)]">
              {hasValidPrice ? formatPrice(product.price) : "السعر غير متاح"}
            </strong>
            {hasRealDiscount ? (
              <span className="block truncate text-[10px] text-slate-400 line-through">
                {formatPrice(Number(product.oldPrice))}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={addToCart}
            disabled={!available || added}
            aria-label={
              !hasValidPrice
                ? "لا يمكن إضافة منتج بلا سعر"
                : added
                  ? "تمت الإضافة إلى السلة"
                  : `إضافة ${product.name} إلى السلة`
            }
            className="ix-template-product-card__add"
          >
            {added ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
