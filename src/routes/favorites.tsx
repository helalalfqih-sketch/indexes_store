import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { VStack } from "@astryxdesign/core/VStack";
import { Grid } from "@astryxdesign/core/Grid";
import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/use-favorites";
import { fetchProductsByIds } from "@/lib/actions/product.actions";
import { ProductCard } from "@/components/product-card";
export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [{ title: "المفضلة — اندكس ستور" }, { name: "robots", content: "noindex" }],
  }),
  component: FavoritesPage,
});
function FavoritesPage() {
  const { favorites } = useFavorites();
  const query = useQuery({
    queryKey: ["favorite-products", favorites],
    queryFn: () => fetchProductsByIds(favorites),
    enabled: favorites.length > 0,
  });
  return (
    <VStack as="section" className="sf-page" gap={5}>
      <header className="sf-page-heading">
        <h1>المفضلة</h1>
        <p>المنتجات التي حفظتها للرجوع إليها</p>
      </header>
      {!favorites.length ? (
        <section className="sf-empty">
          <Heart aria-hidden="true" />
          <h2>لم تحفظ منتجات بعد</h2>
          <p>اضغط على القلب بجانب أي منتج لإضافته هنا.</p>
          <Link to="/search" className="sf-primary-button">
            تصفح المنتجات
          </Link>
        </section>
      ) : query.isPending ? (
        <p role="status">جارٍ تحميل المفضلة…</p>
      ) : query.isError ? (
        <section className="sf-empty" role="alert">
          <p>تعذر تحميل المفضلة.</p>
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
          <p>المنتجات المحفوظة غير متاحة حاليًا.</p>
          <Link to="/search" className="sf-secondary-button">
            تصفح المنتجات
          </Link>
        </section>
      )}
    </VStack>
  );
}
