import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productBySlugQueryOptions } from "@/lib/store.queries";
import { ProductDetailSkeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  MessageCircle,
  CheckCircle2,
  Home,
  ChevronLeft,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/store-data";
import { buildShareUrls } from "@/lib/share-urls";
import { fetchProductBySlug } from "@/lib/actions/product.actions";
import { useCart } from "@/lib/cart-store";
import { quickOrderLink } from "@/lib/whatsapp";
import { useModelViewer } from "@/lib/model-viewer";
import { useAppearance } from "@/components/appearance-provider";
import { buildProductHead } from "@/lib/seo";
import { ProductMediaGallery } from "@/components/product-media-gallery";
import { ProductRecommendations } from "@/components/product-recommendations";
import { trackEvent } from "@/lib/analytics";

const DARK = "var(--showcase)";
const LIGHT = "var(--showcase-foreground)";
const TAJAWAL = "Tajawal, system-ui, sans-serif";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context: { queryClient }, params }) => {
    const product = await queryClient.ensureQueryData(productBySlugQueryOptions(params.slug));
    if (!product) throw notFound();
    return { product };
  },
  pendingComponent: () => (
    <div className="min-h-screen bg-showcase pt-12">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <ProductDetailSkeleton />
      </div>
    </div>
  ),
  head: (ctx) => {
    const data = ctx.loaderData as any;
    if (!data?.product) {
      return {
        meta: [
          { title: "المنتج غير موجود — اندكس ستور" },
          { name: "robots", content: "noindex, nofollow" },
        ],
      };
    }
    const p = data.product;
    // Resolve base URL from environment dynamically
    const baseUrl =
      process.env.SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : null) ||
      import.meta.env.VITE_PUBLIC_URL ||
      "";

    const { meta, links, scripts } = buildProductHead(
      {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        price: p.price,
        oldPrice: p.oldPrice,
        currency: "YER",
        stock: p.stock,
        image: p.image,
        images: p.images,
        brand: p.brand,
        categoryId: p.categoryId,
        rating: p.rating,
        reviews: p.reviews,
        sku: p.sku,
        barcode: p.barcode,
        mpn: p.mpn,
        condition: p.condition,
        availability: p.availability,
        videoPlaybackId: p.videoPlaybackId,
      },
      baseUrl,
      p.categoryName,
    );
    return { meta, links, scripts };
  },
  notFoundComponent: () => (
    <div className="p-8 text-center" dir="rtl">
      <p className="text-lg font-bold">المنتج غير موجود</p>
      <Link to="/" className="mt-4 inline-block text-primary underline">
        العودة للرئيسية
      </Link>
    </div>
  ),
  errorComponent: () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center" dir="rtl">
      <p className="text-lg font-bold text-destructive">تعذر تحميل المنتج مؤقتًا</p>
      <p className="text-sm text-muted-foreground">حاول تحديث الصفحة أو العودة لاحقًا.</p>
      <Link to="/" className="mt-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
        العودة للمتجر
      </Link>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: productRaw } = useSuspenseQuery(productBySlugQueryOptions(slug));
  const product = productRaw as any;

  if (!product) {
    throw notFound();
  }

  const { settings } = useAppearance();
  const pageCfg = settings.product_page;
  const shareUrls = buildShareUrls(product);
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const availableStock = Number(product.stock);
  const isAvailable = Number.isFinite(availableStock) ? availableStock > 0 : product.stock !== 0;
  const description = String(product.description || "")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/^[-*+]\s+/gm, "")
    .trim();

  useModelViewer();

  useEffect(() => {
    if (product?.id) {
      trackEvent("view_product", {
        productId: product.id,
        name: product.name,
        price: product.price,
      });
    }
  }, [product?.id]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), {
      rootMargin: "-20% 0px 0px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleAdd = () => {
    if (!isAvailable) return;
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const orderHref = quickOrderLink(product);

  return (
    <div
      dir="rtl"
      className="min-h-screen pb-28"
      style={{ background: DARK, color: LIGHT, fontFamily: TAJAWAL }}
    >
      {/* Top Header / Navigation Bar */}
      <nav
        aria-label="التنقل الرئيسي"
        className="sticky top-0 z-30 flex items-center justify-between border-b border-showcase-border bg-showcase/80 px-4 py-3 backdrop-blur-xl"
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-bold text-showcase-foreground/80 hover:text-showcase-foreground transition"
          aria-label="العودة للمتجر الرئيسي"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          <span>العودة للمتجر</span>
        </Link>
        <span className="rounded-full border border-showcase-border bg-showcase-foreground/5 px-3 py-1 text-[10px] font-bold tracking-[0.2em]">
          INDEXES · {product.categoryName || product.category_name || "PREMIUM"}
        </span>
      </nav>

      {/* Visible Breadcrumbs (SEO + UX) */}
      <nav
        aria-label="مسار التنقل"
        className="flex items-center gap-1.5 px-4 py-2 text-[11px] text-showcase-foreground/50 border-b border-showcase-border/30"
      >
        <Link
          to="/"
          className="flex items-center gap-1 hover:text-showcase-foreground transition"
          aria-label="الرئيسية"
        >
          <Home className="h-3 w-3" aria-hidden="true" />
          <span>الرئيسية</span>
        </Link>
        <ChevronLeft className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
        {(product.categoryName || product.category_name || product.categoryId) && (
          <>
            <Link
              to="/search"
              search={{ category: product.categoryId }}
              className="hover:text-showcase-foreground transition truncate max-w-[120px]"
            >
              {product.categoryName || product.category_name || "تصفح التصنيف"}
            </Link>
            <ChevronLeft className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
          </>
        )}
        <span
          className="text-showcase-foreground/80 font-semibold truncate max-w-[180px]"
          aria-current="page"
        >
          {product.name}
        </span>
      </nav>

      <div ref={heroRef} className="mx-auto max-w-7xl px-4 pt-8 lg:px-8 lg:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Right/Top Column: Interactive Gallery (7 columns on Desktop) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <ProductMediaGallery
              product={{
                id: product.id,
                name: product.name,
                image: product.image,
                images: product.images,
                videos: product.videos,
                media: product.media,
                videoPlaybackId: product.videoPlaybackId,
              }}
            />
          </div>

          {/* Left/Bottom Column: Product Details & Buy Box (5 columns on Desktop) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Title & Category */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-md bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
                  {product.categoryName ||
                    product.category_name ||
                    (product.categoryId ? undefined : null) ||
                    "عام"}
                </span>
                <span
                  className={`flex items-center gap-1 text-xs font-bold ${isAvailable ? "text-success" : "text-destructive"}`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isAvailable ? "متوفر في المتجر" : "نفد المخزون"}
                </span>
              </div>

              <h1 className="text-2xl font-black leading-tight sm:text-3xl lg:text-4xl text-showcase-foreground">
                {product.name}
              </h1>

              {product.brand && product.brand !== "UNKNOWN" && (
                <span className="mt-2 block text-sm text-muted-foreground">{product.brand}</span>
              )}

              {/* Rating */}
              {Number(product.reviews) > 0 ? (
                <div
                  className="mt-3 flex items-center gap-3 text-xs"
                  aria-label={`تقييم ${product.rating} من 5`}
                >
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="h-4 w-4 fill-amber-400" />
                    <span className="font-bold">{product.rating}</span>
                  </div>
                  <span className="text-showcase-foreground/50">•</span>
                  <span className="text-showcase-foreground/70">
                    {product.reviews} تقييم للمنتج
                  </span>
                </div>
              ) : (
                <p className="mt-3 text-xs text-showcase-foreground/40">لا توجد تقييمات بعد</p>
              )}
            </div>

            {/* Price Box */}
            <div className="rounded-2xl border border-showcase-border bg-showcase-foreground/5 p-4 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-bold text-showcase-foreground/60 block mb-1">
                  السعر الحالي
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-showcase-foreground">
                    {formatPrice(product.price)}
                  </span>
                  {product.oldPrice && (
                    <span className="text-sm line-through text-showcase-foreground/40">
                      {formatPrice(product.oldPrice)}
                    </span>
                  )}
                </div>
              </div>
              {product.oldPrice && product.oldPrice > product.price && (
                <span className="rounded-full bg-destructive/15 px-3 py-1 text-xs font-bold text-destructive border border-destructive/20">
                  خصم {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                </span>
              )}
            </div>

            {/* Description Summary */}
            {pageCfg.showDescription !== false && description && (
              <div className="text-sm leading-relaxed text-showcase-foreground/80 border-t border-b border-showcase-border/60 py-4">
                {description}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center justify-between rounded-xl border border-showcase-border bg-showcase-foreground/5 p-3">
              <span className="text-xs font-bold text-showcase-foreground">
                الكمية المطلوب طلبها
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label={`تقليل كمية ${product.name}`}
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="grid h-11 w-11 place-items-center rounded-md border border-input bg-showcase-foreground/10 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring transition"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-black">{qty}</span>
                <button
                  type="button"
                  aria-label={`زيادة كمية ${product.name}`}
                  onClick={() =>
                    setQty(
                      Number.isFinite(availableStock) ? Math.min(availableStock, qty + 1) : qty + 1,
                    )
                  }
                  disabled={
                    !isAvailable || (Number.isFinite(availableStock) && qty >= availableStock)
                  }
                  className="grid h-11 w-11 place-items-center rounded-md border border-input bg-primary text-primary-foreground font-bold hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* CTA Action Buttons — Cart is primary */}
            <div className="flex flex-col gap-2.5">
              {pageCfg.showCartBtn !== false && (
                <button
                  onClick={handleAdd}
                  disabled={!isAvailable || added}
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black transition ${isAvailable && !added ? "bg-[#2F6BFF] text-white hover:bg-[#2458D8]" : added ? "bg-emerald-600 text-white" : "cursor-not-allowed bg-showcase-foreground/10 text-showcase-foreground/40"}`}
                >
                  {added ? <CheckCircle2 className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
                  <span>{added ? "تمت الإضافة للسلة ✓" : isAvailable ? "أضف للسلة" : "غير متوفر حالياً"}</span>
                </button>
              )}

              {pageCfg.showWaBtn !== false && (
                <a
                  href={orderHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={!isAvailable}
                  onClick={(event) => {
                    if (!isAvailable) {
                      event.preventDefault();
                      return;
                    }
                    trackEvent("click_whatsapp", {
                      source: "product_page",
                      productId: product.id,
                    });
                  }}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-black transition ${isAvailable ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15" : "pointer-events-none border-showcase-border bg-showcase-foreground/5 text-showcase-foreground/40"}`}
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>اطلب عبر واتساب</span>
                </a>
              )}
            </div>

            <div className="space-y-3 pt-2">
              {/* Social Share Buttons */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-showcase-border/40">
                <span className="text-showcase-foreground/60 font-bold">مشاركة المنتج:</span>
                <div className="flex items-center gap-2">
                  <a
                    href={shareUrls.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-success/20 text-success border border-success/30 px-2.5 py-1 font-bold hover:bg-success/30 transition"
                  >
                    واتساب
                  </a>
                  <a
                    href={shareUrls.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 font-bold hover:bg-blue-600/30 transition"
                  >
                    فيسبوك
                  </a>
                  <a
                    href={shareUrls.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-white/10 text-white border border-white/20 px-2.5 py-1 font-bold hover:bg-white/20 transition"
                  >
                    إكس
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Recommendations ("قد يعجبك أيضاً") */}
        <ProductRecommendations
          currentProductId={product.id}
          categoryId={product.categoryId}
          productName={product.name}
        />
      </div>

      {/* Sticky Conversion Bar when scrolling — includes both Cart and WhatsApp */}
      {isAvailable && (
        <motion.div
          initial={false}
          animate={{
            y: showStickyBar ? 0 : 120,
            opacity: showStickyBar ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="fixed inset-x-0 bottom-16 z-40 mx-auto w-full max-w-md px-3"
          style={{ pointerEvents: showStickyBar ? "auto" : "none" }}
        >
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-showcase-border bg-showcase/90 p-2.5 shadow-2xl backdrop-blur-2xl">
            <div className="min-w-0 flex-1 ps-2">
              <p className="truncate text-xs font-bold text-showcase-foreground">{product.name}</p>
              <p className="text-xs font-black text-primary">{formatPrice(product.price)}</p>
            </div>
            <button
              onClick={handleAdd}
              disabled={added}
              className="flex items-center gap-1.5 rounded-xl bg-[#2F6BFF] px-3 py-2 text-xs font-black text-white transition hover:bg-[#2458D8] disabled:bg-emerald-600"
            >
              {added ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
              {added ? "تمت ✓" : "أضف للسلة"}
            </button>
            {pageCfg.showWaBtn !== false && (
              <a
                href={orderHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-500 transition hover:bg-emerald-500/15"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                واتساب
              </a>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
