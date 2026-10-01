import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { VStack } from "@astryxdesign/core/VStack";
import { Grid } from "@astryxdesign/core/Grid";
import { Minus, Plus, ShoppingCart, Heart, Share2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { productBySlugQueryOptions } from "@/lib/store.queries";
import { formatPrice, type Product } from "@/lib/store-data";
import { useCart } from "@/lib/cart-store";
import { useFavorites } from "@/lib/use-favorites";
import { ProductMediaGallery } from "@/components/product-media-gallery";
import { buildProductHead } from "@/lib/seo";
export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context: { queryClient }, params }) => {
    const product = await queryClient.ensureQueryData(productBySlugQueryOptions(params.slug));
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData?.product) return { meta: [{ title: "المنتج غير موجود — اندكس ستور" }] };
    return buildProductHead(
      { ...loaderData.product, currency: "YER" },
      process.env.SITE_URL || import.meta.env.VITE_PUBLIC_URL || "https://indexes-store.vercel.app",
    );
  },
  pendingComponent: () => (
    <section className="sf-page sf-empty" role="status">
      جارٍ تحميل المنتج…
    </section>
  ),
  errorComponent: () => (
    <section className="sf-page sf-empty" role="alert">
      <h1>تعذر تحميل المنتج</h1>
      <Link to="/search" className="sf-secondary-button">
        العودة للمنتجات
      </Link>
    </section>
  ),
  notFoundComponent: () => (
    <section className="sf-page sf-empty">
      <h1>المنتج غير متاح</h1>
      <Link to="/search" className="sf-primary-button">
        تصفح المنتجات
      </Link>
    </section>
  ),
  component: ProductPage,
});
function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productBySlugQueryOptions(slug));
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const add = useCart((state) => state.add);
  const { isFavorite, toggleFavorite } = useFavorites();
  if (!product) throw notFound();
  const available = Number(product.stock) > 0;
  const discounted = product.oldPrice != null && product.oldPrice > product.price;
  const favorite = isFavorite(product.id);
  const share = async () => {
    try {
      if (navigator.share)
        await navigator.share({ title: product.name, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("تم نسخ رابط المنتج");
      }
    } catch {
      /* Dismissing the native share dialog does not change the product. */
    }
  };
  return (
    <VStack as="section" className="sf-page sf-product-page" gap={5} data-product-page>
      <nav aria-label="مسار التنقل" className="sf-breadcrumb">
        <Link to="/">الرئيسية</Link>
        <ChevronLeft aria-hidden="true" />
        <Link to="/search">المنتجات</Link>
      </nav>
      <Grid columns={{ minWidth: 300, max: 2 }} gap={6} className="sf-product-detail-grid">
        <section className="sf-product-gallery" aria-label="صور ووسائط المنتج">
          <ProductMediaGallery product={product} />
        </section>
        <VStack as="section" gap={4} className="sf-product-details">
          <header className="sf-page-heading">
            <h1>{product.name}</h1>
          </header>
          <p className="sf-detail-price">
            {formatPrice(product.price)} {discounted && <del>{formatPrice(product.oldPrice!)}</del>}
          </p>
          <p className={available ? "sf-stock-available" : "sf-stock-unavailable"}>
            {available ? "متوفر في المخزون" : "غير متوفر حاليًا"}
          </p>
          <section className="sf-product-utilities">
            <button
              className="sf-secondary-button"
              aria-pressed={favorite}
              onClick={() => toggleFavorite(product.id)}
            >
              <Heart className={favorite ? "fill-current" : ""} />
              {favorite ? "محفوظ في المفضلة" : "حفظ في المفضلة"}
            </button>
            <button className="sf-icon-button" aria-label="مشاركة المنتج" onClick={share}>
              <Share2 />
            </button>
          </section>
          {product.description && (
            <section className="sf-product-description">
              <h2>تفاصيل المنتج</h2>
              <p>{product.description.replace(/#{1,6}\s+|\*\*|__|`/g, "")}</p>
            </section>
          )}
          <section className="sf-purchase-panel" aria-label="شراء المنتج">
            <label htmlFor="product-quantity">الكمية</label>
            <section className="sf-quantity">
              <button
                aria-label="تقليل الكمية"
                disabled={quantity <= 1}
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <Minus />
              </button>
              <input
                id="product-quantity"
                type="number"
                min={1}
                max={product.stock}
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    Math.max(1, Math.min(Number(product.stock), Number(event.target.value) || 1)),
                  )
                }
              />
              <button
                aria-label="زيادة الكمية"
                disabled={!available || quantity >= Number(product.stock)}
                onClick={() => setQuantity((value) => value + 1)}
              >
                <Plus />
              </button>
            </section>
            <button
              className="sf-primary-button"
              disabled={!available}
              onClick={() => {
                add(product as Product, quantity);
                setAdded(true);
                toast.success("أُضيف إلى السلة");
              }}
            >
              <ShoppingCart />
              {available ? (added ? "تمت الإضافة — أضف مرة أخرى" : "أضف إلى السلة") : "غير متوفر"}
            </button>
            {added && (
              <Link to="/cart" className="sf-secondary-button">
                عرض السلة وإتمام الطلب
              </Link>
            )}
            <p>راجع المنتجات وبيانات التسليم في السلة، ثم أكمل الطلب عبر واتساب.</p>
          </section>
        </VStack>
      </Grid>
    </VStack>
  );
}
