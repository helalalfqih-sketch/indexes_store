import type { Product, SortOption } from "./types";
import type { PriceRangePreset } from "./CategoryBar";
import { STORE_BRANDS, RATING_OPTIONS } from "./filter-options";

export interface ProductFilters {
  priceRange: PriceRangePreset;
  customMinPrice?: number;
  customMaxPrice?: number;
  selectedBrands: string[];
  selectedRatings: string[];
}

export function matchesProductFilters(product: Product, filters: ProductFilters): boolean {
  const { priceRange, customMinPrice, customMaxPrice, selectedBrands, selectedRatings } = filters;
  const matchPrice =
    priceRange === "all" ||
    (priceRange === "under-20k" && product.priceYER < 20_000) ||
    (priceRange === "20k-50k" && product.priceYER >= 20_000 && product.priceYER <= 50_000) ||
    (priceRange === "over-50k" && product.priceYER > 50_000) ||
    (priceRange === "custom" &&
      (customMinPrice === undefined || product.priceYER >= customMinPrice) &&
      (customMaxPrice === undefined || product.priceYER <= customMaxPrice));
  const matchBrand =
    selectedBrands.length === 0 ||
    selectedBrands.some((brandId) => {
      const brand = STORE_BRANDS.find((item) => item.id === brandId);
      if (!brand) return false;
      if (product.brand?.trim()) {
        const value = product.brand.trim().toLowerCase();
        return (
          value === brand.id.toLowerCase() ||
          value === brand.name.toLowerCase() ||
          brand.keywords.some((keyword) => value.includes(keyword.toLowerCase()))
        );
      }
      return brand.keywords.some((keyword) =>
        product.name.toLowerCase().includes(keyword.toLowerCase()),
      );
    });
  const matchRating =
    selectedRatings.length === 0 ||
    selectedRatings.some((ratingId) => {
      const option = RATING_OPTIONS.find((item) => item.id === ratingId);
      return option ? product.rating >= option.minRating : false;
    });
  return matchPrice && matchBrand && matchRating;
}

export function sortProducts(products: Product[], sort: SortOption | "rating"): Product[] {
  switch (sort) {
    case "price-high":
      return [...products].sort((a, b) => b.priceYER - a.priceYER);
    case "price-low":
      return [...products].sort((a, b) => a.priceYER - b.priceYER);
    case "best-selling":
      return [...products].sort((a, b) => b.reviewsCount - a.reviewsCount);
    case "newest":
      return [...products].sort(
        (a, b) => Number(Boolean(b.isNewArrival)) - Number(Boolean(a.isNewArrival)),
      );
    case "rating":
      return [...products].sort((a, b) => b.rating - a.rating);
    default:
      return products;
  }
}
