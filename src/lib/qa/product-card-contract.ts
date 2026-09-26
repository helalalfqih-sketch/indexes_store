export type ProductCardQAProps = {
  productId: string | number;
  name: string | null;
  price: number | null;
  category: string | null;
  brand: string | null;
  rating: number | null;
  stock: number | null;
  sectionSource:
    | "hero_products"
    | "offers"
    | "flash_deals"
    | "new_products"
    | "catalog"
    | "category_page";
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
