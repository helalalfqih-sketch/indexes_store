import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchCatalogPage } from "@/lib/actions/catalog-page.actions";
import { normalizeCategorySlug } from "@/lib/actions/category.actions";
import { INFINITE_CATALOG_QUERY_POLICY, catalogKeys } from "@/lib/queries/catalog";
import { mapProductionProductToDesignProduct } from "@/components/storefront/adapters";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductGridSkeleton } from "@/components/storefront/SkeletonLoader";
import type { PriceRangePreset } from "@/components/storefront/CategoryBar";
import { resolveBrandVendorValues } from "@/components/storefront/filter-options";
import { matchesProductFilters } from "@/components/storefront/product-filters";
import type { Currency, Product, SortOption } from "@/components/storefront/types";

const PAGE_SIZE = 24;
type InfiniteSort = SortOption;

function priceBounds(
  priceRange: PriceRangePreset,
  customMinPrice?: number,
  customMaxPrice?: number,
): { minPrice?: number; maxPrice?: number } {
  switch (priceRange) {
    case "under-20k":
      return { maxPrice: 19_999.999 };
    case "20k-50k":
      return { minPrice: 20_000, maxPrice: 50_000 };
    case "over-50k":
      return { minPrice: 50_000.001 };
    case "custom":
      return { minPrice: customMinPrice, maxPrice: customMaxPrice };
    default:
      return {};
  }
}

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
  const clientQueriesEnabled = typeof window !== "undefined";
  const normalizedSearch = searchQuery.trim();
  const normalizedCategoryId =
    selectedCategoryId !== "all" ? normalizeCategorySlug(selectedCategoryId) : undefined;
  const bounds = priceBounds(priceRange, customMinPrice, customMaxPrice);
  const normalizedBrands = [...selectedBrands].sort();
  const serverBrandValues = resolveBrandVendorValues(normalizedBrands);
  const normalizedRatings = [...selectedRatings].sort();

  const query = useInfiniteQuery({
    queryKey: [
      ...catalogKeys.infiniteProducts({
        categoryId: normalizedCategoryId,
        search: normalizedSearch,
        limit: PAGE_SIZE,
      }),
      sortBy,
      priceRange,
      bounds.minPrice ?? null,
      bounds.maxPrice ?? null,
      normalizedBrands,
      normalizedRatings,
      dealsOnly,
      inStockOnly,
    ],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchCatalogPage({
        search: normalizedSearch || undefined,
        categoryId: normalizedCategoryId,
        first: PAGE_SIZE,
        after: pageParam,
        sortBy,
        minPrice: bounds.minPrice,
        maxPrice: bounds.maxPrice,
        brands: serverBrandValues,
        inStockOnly,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage && lastPage.endCursor ? lastPage.endCursor : undefined,
    // Keep retained cursor pages across remounts; explicit catalog invalidation
    // still refreshes them when the underlying catalog actually changes.
    ...INFINITE_CATALOG_QUERY_POLICY,
    enabled: clientQueriesEnabled,
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

    // Shopify applies the selected sort before cursor pagination, so retaining
    // the server order keeps every loaded page in one globally stable order.
    return list;
  }, [
    products,
    excluded,
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

  // `enabled: false` is not considered loading by React Query. Render the same
  // skeleton on SSR and the browser's first pass to avoid a hydration mismatch.
  if (!clientQueriesEnabled || query.isLoading) return <ProductGridSkeleton count={8} />;

  if (query.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm font-bold text-red-700">
        <p>تعذر تحميل المنتجات.</p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <>
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-1 gap-y-5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {filteredProducts.map((product, index) => (
            <ProductCard
              sectionSource="catalog-continuation"
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
