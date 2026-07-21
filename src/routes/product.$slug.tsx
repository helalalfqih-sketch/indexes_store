import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  MessageCircle,
  Shield,
  Truck,
  RefreshCcw,
  Package,
  Sparkles,
  Zap,
  Play,
  Box,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/store-data";
import { fetchProductBySlug } from "@/lib/actions/product.actions";
import { useCart } from "@/lib/cart-store";
import { quickOrderLink } from "@/lib/whatsapp";
import { Product3DTile, modelFor, useModelViewer, useMounted } from "@/lib/model-viewer";
import { OptimizedImage } from "@/components/optimized-image";

import { useAppearance } from "@/components/appearance-provider";

const DARK = "var(--showcase)";
const LIGHT = "var(--showcase-foreground)";
const TAJAWAL = "Tajawal, system-ui, sans-serif";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const product = await fetchProductBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — اندكس ستور` },
          { name: "description", content: loaderData.product.description },
          { property: "og:title", content: loaderData.product.name },
          { property: "og:description", content: loaderData.product.description },
          { property: "og:image", content: loaderData.product.image },
        ]
      : [{ title: "المنتج غير موجود — اندكس ستور" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <div className="p-8 text-center" dir="rtl">
      <p className="text-lg font-bold">المنتج غير موجود</p>
      <Link to="/" className="mt-4 inline-block text-primary underline">
        العودة للرئيسية
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive" dir="rtl">
      حدث خطأ: {error.message}
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { settings } = useAppearance();
  const pageCfg = settings.product_page;
  const { product } = Route.useLoaderData();
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();
  useModelViewer();

  // Multi-media gallery state
  const rawImages: string[] = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image];
  
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [activeMode, setActiveMode] = useState<"image" | "video" | "3d">("image");

  const hasVideo = !!product.videoPlaybackId && pageCfg.showVideo !== false;
  const has3D = mounted && !!modelFor(product.id) && pageCfg.show3DModel !== false;

  const [showStickyBar, setShowStickyBar] = useState(false);
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
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-showcase-border bg-showcase/80 px-4 py-3 backdrop-blur-xl">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-bold text-showcase-foreground/80 hover:text-showcase-foreground transition"
        >
          <ArrowRight className="h-4 w-4" />
          <span>العودة للمتجر</span>
        </Link>
        <span className="rounded-full border border-showcase-border bg-showcase-foreground/5 px-3 py-1 text-[10px] font-bold tracking-[0.2em]">
          INDEXES · {product.categoryId || "PREMIUM"}
        </span>
      </div>

      {/* Main Content Area: 2-Column Responsive Layout */}
      <div ref={heroRef} className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Right/Top Column: Interactive Gallery (6 columns on Desktop) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Active Media Viewer */}
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-showcase-border bg-black/40 shadow-2xl">
              <AnimatePresence mode="wait">
                {activeMode === "3d" && has3D ? (
                  <motion.div
                    key="3d-mode"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full w-full"
                  >
                    <Product3DTile
                      modelSrc={modelFor(product.id)}
                      poster={product.image}
                      alt={product.name}
                    />
                  </motion.div>
                ) : activeMode === "video" && hasVideo ? (
                  <motion.div
                    key="video-mode"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full w-full"
                  >
                    <iframe
                      src={`https://stream.mux.com/${product.videoPlaybackId}.m3u8`}
                      title={product.name}
                      className="h-full w-full object-cover"
                      allow="autoplay; encrypted-media"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={rawImages[activeMediaIndex] || product.image}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full"
                  >
                    <OptimizedImage
                      src={rawImages[activeMediaIndex] || product.image}
                      alt={product.name}
                      size="large"
                      className="h-full w-full object-contain p-4"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mode Badges */}
              <div className="absolute start-4 bottom-4 z-20 flex items-center gap-2">
                {has3D && (
                  <button
                    onClick={() => setActiveMode("3d")}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold backdrop-blur-md transition ${
                      activeMode === "3d"
                        ? "border-primary bg-primary text-white shadow-lg"
                        : "border-showcase-border bg-black/60 text-showcase-foreground hover:bg-black/80"
                    }`}
                  >
                    <Box className="h-3.5 w-3.5" />
                    <span>عرض 3D</span>
                  </button>
                )}
                {hasVideo && (
                  <button
                    onClick={() => setActiveMode("video")}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold backdrop-blur-md transition ${
                      activeMode === "video"
                        ? "border-primary bg-primary text-white shadow-lg"
                        : "border-showcase-border bg-black/60 text-showcase-foreground hover:bg-black/80"
                    }`}
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>فيديو</span>
                  </button>
                )}
              </div>
            </div>

            {/* Thumbnails Carousel Bar */}
            {rawImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {rawImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveMediaIndex(idx);
                      setActiveMode("image");
                    }}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border transition-all ${
                      activeMode === "image" && activeMediaIndex === idx
                        ? "border-primary ring-2 ring-primary/40 scale-105"
                        : "border-showcase-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    <OptimizedImage src={imgUrl} alt={`${product.name} ${idx + 1}`} size="thumbnail" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Left/Bottom Column: Product Details & Buy Box (5 columns on Desktop) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Title & Category */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-md bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
                  {product.categoryId || "عام"}
                </span>
                {product.stock > 0 ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    متوفر في المخزون
                  </span>
                ) : (
                  <span className="text-xs font-bold text-destructive">نفذت الكمية</span>
                )}
              </div>

              <h1 className="text-2xl font-black leading-tight sm:text-3xl lg:text-4xl text-showcase-foreground">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="mt-3 flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span className="font-bold">{product.rating}</span>
                </div>
                <span className="text-showcase-foreground/50">•</span>
                <span className="text-showcase-foreground/70">{product.reviews} تقييم للمنتج</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="rounded-2xl border border-showcase-border bg-showcase-foreground/5 p-4 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-bold text-showcase-foreground/60 block mb-1">السعر الحالي</span>
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
            {pageCfg.showDescription !== false && (
              <div className="text-sm leading-relaxed text-showcase-foreground/80 border-t border-b border-showcase-border/60 py-4">
                {product.description}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center justify-between rounded-xl border border-showcase-border bg-showcase-foreground/5 p-3">
              <span className="text-xs font-bold text-showcase-foreground">الكمية المطلوب طلبها</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-showcase-border bg-showcase-foreground/10 hover:bg-showcase-foreground/20 transition"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-black">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* CTA Action Buttons */}
            <div className="flex flex-col gap-2.5">
              {pageCfg.showWaBtn !== false && (
                <a
                  href={orderHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-success py-3.5 text-sm font-black text-success-foreground shadow-brand hover:bg-success/90 transition"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>اطلب فوراً عبر واتساب</span>
                </a>
              )}

              {pageCfg.showCartBtn !== false && (
                <button
                  onClick={handleAdd}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-showcase-border bg-showcase-foreground/10 py-3 text-xs font-bold text-showcase-foreground hover:bg-showcase-foreground/20 transition"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>{added ? "تمت الإضافة للسلة ✓" : "إضافة إلى سلة المشتريات"}</span>
                </button>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="flex flex-col items-center gap-1.5 rounded-xl border border-showcase-border/60 p-3 text-center">
                <Truck className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-bold">شحن سريع</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-xl border border-showcase-border/60 p-3 text-center">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-bold">ضمان الجودة</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-xl border border-showcase-border/60 p-3 text-center">
                <RefreshCcw className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-bold">إرجاع سهل</span>
              </div>
            </div>

          </div>
        </div>

        {/* Feature Highlights Grid (Compact Spacing) */}
        <div className="mt-16 border-t border-showcase-border/60 pt-12">
          <h3 className="text-xl font-black mb-6 text-showcase-foreground">مميزات ومواصفات المنتج</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                tag: "الأداء",
                title: "أداء يفوق التوقعات",
                body: "تقنية متطورة وتصميم دقيق يضمن لك سرعة، سلاسة، وموثوقية عالية في كل استخدام.",
                icon: Zap,
              },
              {
                tag: "التصميم",
                title: "جماليات فاخرة",
                body: "خطوط أنيقة وخامات متينة مختارة بعناية لمنحك تجربة استخدام راقية تستحق الاقتناء.",
                icon: Sparkles,
              },
              {
                tag: "الجودة والضمان",
                title: "مضمون مع خدمة ممتازة",
                body: "فحوصات دقيقة وضمان شامل مع دعم متواصل لراحة بالك الكاملة.",
                icon: Shield,
              },
            ].map((f) => (
              <div
                key={f.tag}
                className="flex flex-col gap-3 rounded-2xl border border-showcase-border bg-showcase-foreground/5 p-5 shadow-card"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary border border-primary/20">
                  <f.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold tracking-[0.3em] text-primary">{f.tag}</span>
                <h4 className="text-lg font-bold text-showcase-foreground">{f.title}</h4>
                <p className="text-xs leading-relaxed text-showcase-foreground/75">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Conversion Bar when scrolling */}
      {pageCfg.showWaBtn !== false && (
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
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-showcase-border bg-showcase/90 p-3 shadow-2xl backdrop-blur-2xl">
            <div className="min-w-0 flex-1 ps-2">
              <p className="truncate text-xs font-bold text-showcase-foreground">{product.name}</p>
              <p className="text-xs font-black text-primary">{formatPrice(product.price)}</p>
            </div>
            <a
              href={orderHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-success px-4 py-2 text-xs font-black text-success-foreground transition hover:bg-success/90"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              اطلب عبر واتساب
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}
