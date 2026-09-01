import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchCatalogPage } from "@/lib/actions/catalog-page.actions";
import { mapProductionProductToDesignProduct } from "@/components/storefront/adapters";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductGridSkeleton } from "@/components/storefront/SkeletonLoader";
import {
  STORE_BRANDS,
  RATING_OPTIONS,
  type PriceRangePreset,
} from "@/components/storefront/CategoryBar";
import type { Currency, Product, SortOption } from "@/components/storefront/types";

const PAGE_SIZE = 24;

type InfiniteStorefrontCatalogProps = {
  selectedCategoryId: string;
  searchQuery: string;
  sortBy: SortOption;
  priceRange: PriceRangePreset;
  customMinPrice?: number;
  customMaxPrice?: number;
  selectedBrands: string[];
  selectedRatings: string[];
  currency: Currency;
  favorites: string[];
  onToggleFavorite: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
};

export function InfiniteStorefrontCatalog({
  selectedCategoryId,
  searchQuery,
  sortBy,
  priceRange,
  customMinPrice,
  customMaxPrice,
  selectedBrands,
  selectedRatings,
  currency,
  favorites,
  onToggleFavorite,
  onAddToCart,
  onSelectProduct,
}: InfiniteStorefrontCatalogProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery({
    queryKey: ["storefront", "catalog", "infinite", selectedCategoryId, searchQuery],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchCatalogPage({
        search: searchQuery.trim() || undefined,
        categoryId: selectedCategoryId !== "all" ? selectedCategoryId : undefined,
        first: PAGE_SIZE,
        after: pageParam,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage && lastPage.endCursor ? lastPage.endCursor : undefined,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const products = useMemo(
    () =>
      (query.data?.pages.flatMap((page) => page.items) ?? []).map((product) =>
        mapProductionProductToDesignProduct(product),
      ),
    [query.data],
  );

  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
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
          const name = product.name.toLowerCase();
          return brand.keywords.some((keyword) => name.includes(keyword.toLowerCase()));
        });

      const matchRating =
        selectedRatings.length === 0 ||
        selectedRatings.some((ratingId) => {
          const option = RATING_OPTIONS.find((item) => item.id === ratingId);
          return option ? product.rating >= option.minRating : false;
        });

      return matchPrice && matchBrand && matchRating;
    });

    switch (sortBy) {
      case "price-high":
        return [...list].sort((a, b) => b.priceYER - a.priceYER);
      case "price-low":
        return [...list].sort((a, b) => a.priceYER - b.priceYER);
      case "best-selling":
        return [...list].sort((a, b) => b.reviewsCount - a.reviewsCount);
      case "newest":
        return [...list].sort((a, b) => Number(Boolean(b.isNewArrival)) - Number(Boolean(a.isNewArrival)));
      default:
        return list;
    }
  }, [
    products,
    sortBy,
    priceRange,
    customMinPrice,
    customMaxPrice,
    selectedBrands,
    selectedRatings,
  ]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !query.hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
          void query.fetchNextPage();
        }
      },
      { rootMargin: "900px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  if (query.isLoading) return <ProductGridSkeleton count={8} />;

  if (query.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm font-bold text-red-700">
        تعذر تحميل المنتجات. حاول مرة أخرى.
      </div>
    );
  }

  return (
    <>
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-1 gap-y-5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              isFavorite={favorites.includes(product.id)}
              onToggleFavorite={onToggleFavorite}
              onAddToCart={onAddToCart}
              onSelectProduct={onSelectProduct}
              variant="grid"
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="py-10 text-center text-sm text-neutral-500">
          لا توجد منتجات مطابقة في الصفحات المحمّلة حتى الآن.
        </div>
      )}

      <div ref={loadMoreRef} className="min-h-12 py-4" aria-hidden="true">
        {query.isFetchingNextPage ? <ProductGridSkeleton count={4} /> : null}
      </div>

      {!query.hasNextPage && products.length > 0 ? (
        <p className="pb-2 text-center text-[11px] text-neutral-400">تم عرض جميع المنتجات</p>
      ) : null}
    </>
  );
}
