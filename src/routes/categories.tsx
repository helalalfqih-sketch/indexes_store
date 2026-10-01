import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { VStack } from "@astryxdesign/core/VStack";
import { Grid } from "@astryxdesign/core/Grid";
import { categoriesQueryOptions } from "@/lib/store.queries";
import { Layers3 } from "lucide-react";
export const Route = createFileRoute("/categories")({
  head: () => ({ meta: [{ title: "الأقسام — اندكس ستور" }] }),
  component: CategoriesPage,
});
function CategoriesPage() {
  const query = useQuery(categoriesQueryOptions());
  return (
    <VStack as="section" className="sf-page" gap={5}>
      <header className="sf-page-heading">
        <h1>تصفح الأقسام</h1>
        <p>اختر القسم الذي يناسبك</p>
      </header>
      {query.isPending ? (
        <p role="status">جارٍ تحميل الأقسام…</p>
      ) : query.isError ? (
        <section className="sf-empty" role="alert">
          <p>تعذر تحميل الأقسام</p>
          <button className="sf-secondary-button" onClick={() => query.refetch()}>
            إعادة المحاولة
          </button>
        </section>
      ) : query.data.length ? (
        <Grid columns={{ minWidth: 140, max: 4 }} gap={3} className="sf-category-grid">
          {query.data.map((category) => (
            <Link
              className="sf-category-tile"
              key={category.id}
              to="/category/$id"
              params={{ id: category.id }}
            >
              {category.imageUrl ? (
                <img src={category.imageUrl} alt="" loading="lazy" />
              ) : (
                <Layers3 aria-hidden="true" />
              )}
              <h2>{category.name}</h2>
            </Link>
          ))}
        </Grid>
      ) : (
        <p className="sf-empty">لا توجد أقسام منشورة حاليًا.</p>
      )}
      <Link to="/search" className="sf-secondary-button">
        تصفح جميع المنتجات
      </Link>
    </VStack>
  );
}
