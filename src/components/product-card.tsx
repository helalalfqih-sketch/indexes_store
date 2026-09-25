import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { VStack } from "@astryxdesign/core/VStack";
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
  const add = useCart((state) => state.add);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(product.id);
  const available = Number(product.stock) > 0;
  const discount =
    product.oldPrice && product.oldPrice > product.price && product.price > 0
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0;
  return (
    <article
      className="sf-product-card"
      data-product-id={product.id}
      data-product-slug={product.slug}
      data-product-name={product.name}
      data-product-price={product.price}
    >
      <figure className="sf-product-image">
        <Link to="/product/$slug" params={{ slug: product.slug }} aria-label={product.name}>
          <OptimizedImage
            src={product.image}
            alt={product.name}
            size="card"
            eager={eager}
            className="h-full w-full object-contain"
          />
        </Link>
        <button
          type="button"
          className="sf-icon-button sf-favorite"
          aria-pressed={favorite}
          aria-label={`${favorite ? "إزالة" : "إضافة"} ${product.name} ${favorite ? "من" : "إلى"} المفضلة`}
          onClick={() => toggleFavorite(product.id)}
        >
          <Heart className={favorite ? "fill-current text-destructive" : ""} />
        </button>
        {discount > 0 && <span className="sf-discount">خصم {discount}%</span>}
      </figure>
      <VStack gap={2} className="sf-product-info">
        <Link to="/product/$slug" params={{ slug: product.slug }}>
          <h3>{product.name}</h3>
        </Link>
        {product.reviews > 0 && product.rating > 0 && (
          <p className="sf-rating">
            <Star aria-hidden="true" /> {product.rating} ({product.reviews})
          </p>
        )}
        <p className="sf-product-price">
          {formatPrice(product.price)} {discount > 0 && <del>{formatPrice(product.oldPrice!)}</del>}
        </p>
        <button
          type="button"
          className="sf-cart-button"
          disabled={!available}
          aria-label={`أضف ${product.name} إلى السلة`}
          onClick={() => {
            add(product as Product);
            toast.success("أُضيف إلى السلة", { description: product.name });
          }}
        >
          <ShoppingCart aria-hidden="true" />
          {available ? "أضف للسلة" : "غير متوفر"}
        </button>
      </VStack>
    </article>
  );
}
