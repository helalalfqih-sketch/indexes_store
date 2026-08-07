import type { LegacyProductShape, LegacyCategoryShape } from "@/lib/data-adapter";
import type { Product as DesignProduct, Category as DesignCategory } from "./types";

export function mapProductionProductToDesignProduct(p: LegacyProductShape): DesignProduct {
  const priceYER = p.price;
  const originalPriceYER = p.oldPrice && p.oldPrice > p.price ? p.oldPrice : p.price;
  const discountBadge =
    p.oldPrice && p.oldPrice > p.price
      ? `خصم ${Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)}%`
      : p.badge || undefined;

  return {
    id: p.id,
    name: p.name,
    subtitle: p.description
      ? p.description.length > 60
        ? p.description.slice(0, 60) + "..."
        : p.description
      : p.name,
    description: p.description || p.name,
    priceYER,
    originalPriceYER,
    discountBadge,
    rating: p.rating || 4.8,
    reviewsCount: p.reviews || 12,
    image: p.image || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80",
    gallery: p.images && p.images.length > 0 ? p.images : [p.image],
    category: p.categoryId || "all",
    inStock: p.stock > 0,
    isBestOffer: p.isDeal || Boolean(p.oldPrice && p.oldPrice > p.price),
    isNewArrival: p.featured || false,
    isFeatured: p.featured || false,
  };
}

export function mapProductionCategoryToDesignCategory(c: LegacyCategoryShape): DesignCategory {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon || "category",
  };
}
