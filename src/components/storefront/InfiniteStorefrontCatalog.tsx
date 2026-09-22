import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchCatalogPage } from "@/lib/actions/catalog-page.actions";
import { mapProductionProductToDesignProduct } from "@/components/storefront/adapters";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductGridSkeleton } from "@/components/storefront/SkeletonLoader";
import type { PriceRangePreset } from "@/components/storefront/CategoryBar";
import { matchesProductFilters, sortProducts } from "@/components/storefront/product-filters";
import type { Currency, Product, SortOption } from "@/components/storefront/types";

const PAGE_SIZE = 24;
type InfiniteSort = SortOption | "rating";

type InfiniteStorefrontCatalogProps = {
  selectedCategoryId: string;
  searchQuery: string;
  sortBy: InfiniteSort;
  priceRange: PriceRangePreset;
  customMinPrice?: number;
  customMaxPrice?: number;
  selectedBrands: string[];
  selectedRatings: string[];
  dealsOnly?: boolean;
  inStockOnly?: boolean;
  currency: Currency;
  favorites: string[];
  excludeIds?: string[];
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
  dealsOnly = false,
  inStockOnly = false,
  currency,
  favorites,
  excludeIds = [],
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

  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);

  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
      if (excluded.has(product.id)) return false;

      const matchesFilters = matchesProductFilters(product, {
        priceRange,
        customMinPrice,
        customMaxPrice,
        selectedBrands,
        selectedRatings,
      });

      const matchDeals =
        !dealsOnly ||
        product.isBestOffer ||
        Boolean(product.discountBadge) ||
        product.originalPriceYER > product.priceYER;

      const matchStock = !inStockOnly || product.inStock !== false;

      return matchesFilters && matchDeals && matchStock;
    });

    return sortProducts(list, sortBy);
  }, [
    products,
    excluded,
    sortBy,
    priceRange,
    customMinPrice,
    customMaxPrice,
    selectedBrands,
    selectedRatings,
    dealsOnly,
    inStockOnly,
  ]);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "900px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
