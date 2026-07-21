import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ProductCard } from "@/components/product-card";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  categoryBySlugQueryOptions,
  productsByCategoryQueryOptions,
} from "@/lib/store.queries";
import type { Product } from "@/lib/store-data";
import { ProductCardSkeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/category/$id")({
  loader: async ({ context: { queryClient }, params }) => {
    const cat = await queryClient.ensureQueryData(categoryBySlugQueryOptions(params.id));
    if (!cat) throw notFound();
    await queryClient.ensureQueryData(productsByCategoryQueryOptions(params.id));
    return { id: params.id };
  },
  pendingComponent: () => (
    <div className="flex flex-col gap-4 px-4 pt-4 min-h-screen">
      <div className="h-8 w-48 rounded-md bg-showcase-foreground/10 animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    </div>
  ),
  head: (ctx) => {
    const data = ctx.loaderData as any;
    return {
      meta: [{ title: data?.cat ? `${data.cat.name} — اندكس ستور` : "تصنيف — اندكس ستور" }],
    };
  },
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

import { useAppearance } from "@/components/appearance-provider";

function CategoryPage() {
  const { id } = Route.useLoaderData();
  const { data: catRaw } = useSuspenseQuery(categoryBySlugQueryOptions(id));
  const { data: itemsRaw } = useSuspenseQuery(productsByCategoryQueryOptions(id));

  const cat = catRaw as any;
  const items = itemsRaw as any[];
  const { settings } = useAppearance();
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
    <div className="flex flex-col gap-4 px-4 pt-4">
      <h1 className="text-lg font-black text-showcase-foreground">{cat.name}</h1>
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-showcase-muted">لا توجد منتجات في هذا التصنيف بعد.</p>
      ) : (
        <div className={gridClass}>
          {items.map((p: any) => (
            <ProductCard key={p.id} product={p as unknown as Product} />
          ))}
        </div>
      )}
    </div>
  );
}
