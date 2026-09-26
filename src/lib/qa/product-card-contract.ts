export type ProductCardQAProps = {
  productId: string | number;
  name: string | null;
  price: number | null;
  category: string | null;
  brand: string | null;
  rating: number | null;
  stock: number | null;
  sectionSource:
    "hero_products" | "offers" | "flash_deals" | "new_products" | "catalog" | "category_page";
};

export type ProductGridInspectionRecord = ProductCardQAProps & {
  slug: string | null;
};

export type DuplicatePlacementReport = {
  duplicate: boolean;
  productId: string | number;
  locations: string[];
  severity: "EXPECTED" | "WARNING";
};

type CardData = {
  id: string | number;
  name?: string | null;
  price?: number | null;
  priceYER?: number | null;
  category?: string | null;
  categoryId?: string | null;
  brand?: string | null;
  rating?: number | null;
  stock?: number | null;
  stockCount?: number | null;
};

/** The placement is supplied by the rendering section, never inferred from a product. */
export function productCardQA(
  product: CardData,
  sectionSource: ProductCardQAProps["sectionSource"],
): ProductCardQAProps {
  return {
    productId: product.id,
    name: product.name ?? null,
    price: product.priceYER ?? product.price ?? null,
    category: product.category ?? product.categoryId ?? null,
    brand: product.brand ?? null,
    rating: product.rating ?? null,
    stock: product.stockCount ?? product.stock ?? null,
    sectionSource,
  };
}
