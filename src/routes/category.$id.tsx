import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ProductCard } from "@/components/product-card";
import { useInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { categoryBySlugQueryOptions } from "@/lib/store.queries";
import { fetchCatalogPage } from "@/lib/actions/catalog-page.actions";
import type { Product } from "@/lib/store-data";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { Home, ChevronLeft, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAppearance } from "@/components/appearance-provider";

export const Route = createFileRoute("/category/$id")({
  loader: async ({ context: { queryClient }, params }) => {
    const cat = await queryClient.ensureQueryData(categoryBySlugQueryOptions(params.id));
    if (!cat) throw notFound();
    return { id: params.id };
  },
  pendingComponent: () => (
    <div className="flex min-h-screen flex-col gap-4 px-4 pt-4">
      <div className="h-8 w-48 animate-pulse rounded-md bg-showcase-foreground/10" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    </div>
  ),
  head: () => ({ meta: [{ title: "تصنيف — اندكس ستور" }] }),
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">حدث خطأ: {error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <p>التصنيف غير موجود</p>
      <Link to="/" className="text-primary">الرئيسية</Link>
    </div>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { id } = Route.useLoaderData();
  const { data: catRaw } = useSuspenseQuery(categoryBySlugQueryOptions(id));
  const cat = catRaw as { name: string };
  const { settings } = useAppearance();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const catalog = useInfiniteQuery({
    queryKey: ["catalog", "category", id, "cursor-v1"],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchCatalogPage({ categoryId: id, first: 24, after: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage && lastPage.endCursor ? lastPage.endCursor : undefined,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !catalog.hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !catalog.isFetchingNextPage) {
          void catalog.fetchNextPage();
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [catalog.hasNextPage, catalog.isFetchingNextPage, catalog.fetchNextPage]);

  const items = catalog.data?.pages.flatMap((page) => page.items) ?? [];
  const lay = settings.products_layout;
  const m = lay.columnsMobile === 1 ? "grid-cols-1" : "grid-cols-2";
  const t =
    lay.columnsTablet === 1
      ? "sm:grid-cols-1"
      : lay.columnsTablet === 2
        ? "sm:grid-cols-2"
        : lay.columnsTablet === 4
          ? "sm:grid-cols-4"
          : "sm:grid-cols-3";
  const d =
    lay.columnsDesktop === 2
      ? "md:grid-cols-2"
      : lay.columnsDesktop === 3
        ? "md:grid-cols-3"
        : lay.columnsDesktop === 5
          ? "md:grid-cols-5"
          : lay.columnsDesktop === 6
            ? "md:grid-cols-6"
            : "md:grid-cols-4";
  const gridClass = `grid ${m} ${t} ${d} gap-4`;

  return (
    <div className="flex flex-col gap-4 px-4 pt-2">
      <nav aria-label="مسار التنقل" className="flex items-center gap-1.5 py-2 text-[11px] text-showcase-foreground/50">
        <Link to="/" className="flex items-center gap-1 transition hover:text-showcase-foreground" aria-label="الرئيسية">
          <Home className="h-3 w-3" aria-hidden="true" />
          <span>الرئيسية</span>
        </Link>
        <ChevronLeft className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
        <span className="font-semibold text-showcase-foreground/80" aria-current="page">{cat.name}</span>
      </nav>

      <h1 className="text-lg font-black text-showcase-foreground">{cat.name}</h1>

      {catalog.isLoading ? (
        <div className={gridClass}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={`initial-${i}`} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-showcase-muted">لا توجد منتجات في هذا التصنيف بعد.</p>
      ) : (
        <>
          <div className={gridClass} role="list" aria-label={`منتجات ${cat.name}`}>
            {items.map((p, index) => (
              <div key={p.id} role="listitem">
                <ProductCard product={p as unknown as Product} eager={index < 4} />
              </div>
            ))}
          </div>
          <div ref={loadMoreRef} className="flex min-h-24 items-center justify-center py-4" aria-live="polite">
            {catalog.isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                تحميل المزيد من المنتجات...
              </div>
            ) : catalog.hasNextPage ? (
              <span className="text-xs text-muted-foreground">مرر لعرض المزيد</span>
            ) : (
              <span className="text-xs text-muted-foreground">تم عرض جميع المنتجات</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
