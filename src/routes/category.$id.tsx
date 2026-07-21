import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ProductCard } from "@/components/product-card";
import { fetchCategoryBySlug } from "@/lib/actions/category.actions";
import { fetchProductsByCategory } from "@/lib/actions/product.actions";
import type { Product } from "@/lib/store-data";

export const Route = createFileRoute("/category/$id")({
  loader: async ({ params }) => {
    const cat = await fetchCategoryBySlug(params.id);
    if (!cat) throw notFound();
    const items = await fetchProductsByCategory(params.id);
    return { cat, items };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.cat.name} — اندكس ستور` : "تصنيف — اندكس ستور" }],
  }),
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
  const { cat, items } = Route.useLoaderData();
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
      <h1 className="text-lg font-black">{cat.name}</h1>
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">لا توجد منتجات في هذا التصنيف بعد.</p>
      ) : (
        <div className={gridClass}>
          {items.map((p: (typeof items)[number]) => (
            <ProductCard key={p.id} product={p as unknown as Product} />
          ))}
        </div>
      )}
    </div>
  );
}
