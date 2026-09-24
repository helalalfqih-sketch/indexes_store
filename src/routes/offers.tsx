import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { VStack } from "@astryxdesign/core/VStack";
import { Grid } from "@astryxdesign/core/Grid";
import { Tag } from "lucide-react";
import { offersQueryOptions } from "@/lib/store.queries";
import { ProductCard } from "@/components/product-card";
export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "العروض — اندكس ستور" },
      { name: "description", content: "العروض والأسعار الحالية المنشورة في اندكس ستور." },
    ],
  }),
  component: OffersPage,
});
function OffersPage() {
  const query = useQuery(offersQueryOptions());
  return (
    <VStack as="section" className="sf-page" gap={5}>
      <header className="sf-page-heading">
        <h1>العروض</h1>
        <p>الأسعار المخفضة والعروض المنشورة في المتجر</p>
      </header>
      {query.isPending ? (
        <p role="status">جارٍ تحميل العروض…</p>
      ) : query.isError ? (
        <section className="sf-empty" role="alert">
          <p>تعذر تحميل العروض.</p>
          <button className="sf-secondary-button" onClick={() => query.refetch()}>
            إعادة المحاولة
          </button>
        </section>
      ) : query.data.length ? (
        <Grid columns={{ minWidth: 145, max: 6 }} gap={3} className="sf-product-grid">
          {query.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Grid>
      ) : (
        <section className="sf-empty">
          <Tag aria-hidden="true" />
          <h2>لا توجد عروض منشورة حاليًا</h2>
          <p>يمكنك متابعة التسوق بالأسعار الحالية.</p>
          <Link to="/search" className="sf-primary-button">
            تصفح جميع المنتجات
          </Link>
        </section>
      )}
    </VStack>
  );
}
