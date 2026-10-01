import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ProductCard } from "@/components/product-card";
import { useInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { categoryBySlugQueryOptions } from "@/lib/store.queries";
import { fetchCatalogPage } from "@/lib/actions/catalog-page.actions";

import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { VStack } from "@astryxdesign/core/VStack";
import { Grid } from "@astryxdesign/core/Grid";

export const Route = createFileRoute("/category/$id")({
  loader: async ({ context: { queryClient }, params }) => {
    const cat = await queryClient.ensureQueryData(categoryBySlugQueryOptions(params.id));
    if (!cat) throw notFound();
    return {
      id: params.id,
      category: {
        name: cat.name,
        imageUrl: cat.imageUrl ?? null,
      },
    };
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
  head: (ctx) => {
    const data = ctx.loaderData as
      { id: string; category: { name: string; imageUrl?: string | null } } | undefined;

    if (!data?.category?.name) {
      return {
        meta: [
          { title: "التصنيف غير موجود — اندكس ستور" },
          { name: "robots", content: "noindex, nofollow" },
        ],
      };
    }

    const categoryName = data.category.name.trim();
    const title = `${categoryName} — اندكس ستور`;
    const description = `تسوق منتجات ${categoryName} في اندكس ستور. اكتشف تشكيلة مختارة مع خدمة التوصيل إلى جميع محافظات اليمن.`;
    const baseUrl = (
      process.env.SITE_URL ||
      import.meta.env.VITE_PUBLIC_URL ||
      "https://indexes-store.vercel.app"
    ).replace(/\/$/, "");
    const canonicalUrl = `${baseUrl}/category/${encodeURIComponent(data.id)}`;

    const meta: Record<string, string>[] = [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ar_YE" },
      { property: "og:site_name", content: "اندكس ستور" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonicalUrl },
      { name: "twitter:card", content: data.category.imageUrl ? "summary_large_image" : "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ];

    if (data.category.imageUrl) {
      meta.push(
        { property: "og:image", content: data.category.imageUrl },
        { property: "og:image:alt", content: categoryName },
        { name: "twitter:image", content: data.category.imageUrl },
      );
    }

    return {
      meta,
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">حدث خطأ: {error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <p>التصنيف غير موجود</p>
      <Link to="/" className="text-primary">
        الرئيسية
      </Link>
    </div>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { id } = Route.useLoaderData();
  const { data: category } = useSuspenseQuery(categoryBySlugQueryOptions(id));
  const catalog = useInfiniteQuery({
    queryKey: ["catalog", "category", id, "cursor-v2"],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => fetchCatalogPage({ categoryId: id, first: 24, after: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage && lastPage.endCursor ? lastPage.endCursor : undefined,
    staleTime: 60_000,
  });
  const items = catalog.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <VStack as="section" className="sf-page" gap={4}>
      <nav aria-label="مسار التنقل" className="sf-breadcrumb">
        <Link to="/">الرئيسية</Link>
        <ChevronLeft aria-hidden="true" />
        <Link to="/categories">الأقسام</Link>
        <ChevronLeft aria-hidden="true" />
        <span aria-current="page">{category?.name}</span>
      </nav>
      <header className="sf-page-heading">
        <h1>{category?.name}</h1>
      </header>
      {catalog.isPending ? (
        <p role="status">جارٍ تحميل المنتجات…</p>
      ) : catalog.isError ? (
        <section className="sf-empty" role="alert">
          <p>تعذر تحميل منتجات القسم.</p>
          <button className="sf-secondary-button" onClick={() => catalog.refetch()}>
            إعادة المحاولة
          </button>
        </section>
      ) : !items.length ? (
        <section className="sf-empty">
          <h2>لا توجد منتجات مرتبطة بهذا القسم حاليًا</h2>
          <p>تصفح كتالوج المتجر الكامل للعثور على المنتجات المتاحة.</p>
          <Link to="/search" className="sf-primary-button">
            عرض جميع المنتجات
          </Link>
        </section>
      ) : (
        <Grid columns={{ minWidth: 145, max: 6 }} gap={3} className="sf-product-grid">
          {items.map((product, index) => (
            <ProductCard key={product.id} product={product} eager={index < 4} />
          ))}
        </Grid>
      )}
      {catalog.hasNextPage && (
        <button
          className="sf-secondary-button"
          onClick={() => catalog.fetchNextPage()}
          disabled={catalog.isFetchingNextPage}
        >
          {catalog.isFetchingNextPage ? "جارٍ التحميل…" : "عرض المزيد"}
        </button>
      )}
    </VStack>
  );
}
