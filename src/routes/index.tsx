import { createFileRoute, Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { formatPrice, type Product } from "@/lib/store-data";
import type { LegacyProductShape, LegacyCategoryShape } from "@/lib/data-adapter";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  categoriesQueryOptions,
  bestSellersQueryOptions,
  offersQueryOptions,
  allProductsQueryOptions,
} from "@/lib/store.queries";
import { ProductCard } from "@/components/product-card";
import { lazy, Suspense } from "react";
import { ProductCardSkeleton, Skeleton } from "@/components/ui/skeleton";

const ProductSphereHero = lazy(() => import("@/components/product-sphere-hero").then(m => ({ default: m.ProductSphereHero })));
const CinematicStory = lazy(() => import("@/components/cinematic-story").then(m => ({ default: m.CinematicStory })));
import { OptimizedImage } from "@/components/optimized-image";
import { quickOrderLink } from "@/lib/whatsapp";
import { useAppearance } from "@/components/appearance-provider";
import { type ProductsLayoutConfig } from "@/lib/domain/appearance";

export const Route = createFileRoute("/")({
  head: ({ loaderData }) => {
    const seo = (loaderData as any)?.settings?.seo;
    const baseUrl =
      process.env.SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : null) ||
      import.meta.env.VITE_PUBLIC_URL ||
      "";
    const title = seo?.metaTitle || "اندكس ستور — الرئيسية | تسوّق أونلاين في اليمن";
    const description =
      seo?.metaDescription ||
      "اكتشف أحدث المنتجات والعروض في اندكس ستور: إلكترونيات، أزياء، أدوات منزلية، والمزيد.";
    const ogImage = seo?.ogImage || "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/da426993-5f26-4733-b40c-c0f1f8e814c7/id-preview-7d22af97--80f7d5cf-5026-49dd-8137-91bdaa674a1a.lovable.app-1783204904911.png";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: baseUrl },
        { property: "og:image", content: ogImage },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
      ],
      links: [
        { rel: "canonical", href: baseUrl },
        { rel: "alternate", hrefLang: "ar", href: baseUrl },
        { rel: "alternate", hrefLang: "x-default", href: baseUrl },
      ],
    };
  },
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(categoriesQueryOptions());
    queryClient.ensureQueryData(bestSellersQueryOptions(4));
    queryClient.ensureQueryData(offersQueryOptions());
    queryClient.ensureQueryData(allProductsQueryOptions());
  },
  pendingComponent: () => (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-12 md:max-w-6xl md:px-6 lg:max-w-7xl">
      <Skeleton className="h-[50vh] w-full rounded-3xl" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">حدث خطأ: {error.message}</div>
  ),
  component: HomePage,
});

const DARK = "var(--showcase)";
const LIGHT = "var(--showcase-foreground)";
const LIGHT_MUTED = "var(--showcase-muted)";
const LIGHT_BORDER = "var(--showcase-border)";

const revealProps = {
  initial: { opacity: 0, y: 15 },
  whileInView: { opacity: 1, y: 0 },
  // once:true prevents sections from disappearing on scroll-back (fixes blank gaps on mobile)
  // amount:0.05 triggers reveal as soon as 5% of the element is visible
  viewport: { once: true, amount: 0.05 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

function HomePage() {
  const { data: categoriesRaw } = useSuspenseQuery(categoriesQueryOptions());
  const { data: bestSellersRaw } = useSuspenseQuery(bestSellersQueryOptions(4));
  const { data: dailyDealsRaw } = useSuspenseQuery(offersQueryOptions());
  const { data: allProductsRaw } = useSuspenseQuery(allProductsQueryOptions());

  const categories = categoriesRaw as LegacyCategoryShape[];
  const bestSellers = bestSellersRaw as LegacyProductShape[];
  const dailyDeals = (dailyDealsRaw as LegacyProductShape[]).slice(0, 4);
  const allProducts = allProductsRaw as LegacyProductShape[];

  const pageRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const smoothY = useSpring(scrollY, { stiffness: 60, damping: 20, mass: 0.4 });

  // Parallax: background layers scroll slower (0.2x) than foreground (1x)
  const bgYSlow = useTransform(smoothY, (v) => v * 0.15);
  const bgYMid = useTransform(smoothY, (v) => v * 0.35);
  const bgRotate = useTransform(smoothY, (v) => v * 0.02);

  // Sticky WA — track most-centered product card
  const [focusedProduct, setFocusedProduct] = useState<Product | null>(null);
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>("[data-product-id]");
    if (!cards.length) return;
    const viewportCenter = () => window.innerHeight / 2;
    const pick = () => {
      let best: { el: HTMLElement; dist: number } | null = null;
      const c = viewportCenter();
      cards.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const mid = r.top + r.height / 2;
        const dist = Math.abs(mid - c);
        if (!best || dist < best.dist) best = { el, dist };
      });
      if (best) {
        const id = (best as { el: HTMLElement }).el.dataset.productId;
        const found = (allProducts.find((p) => p.id === id) as Product | undefined) ?? null;
        setFocusedProduct((prev) => (prev?.id === found?.id ? prev : found));
      }
    };
    pick();
    const onScroll = () => requestAnimationFrame(pick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [allProducts]);

  const { settings } = useAppearance();

  const sphereProducts = useMemo(() => {
    let list = [...allProducts];
    const source = settings.hero.sphereProductSource || "all";
    if (source === "bestsellers") {
      list = [...bestSellers];
    } else if (source === "offers") {
      list = [...dailyDeals];
    } else if (source === "custom" && settings.hero.sphereCustomProductIds?.length) {
      const idMap = new Map(settings.hero.sphereCustomProductIds.map((id, idx) => [id, idx]));
      list = allProducts
        .filter((p) => idMap.has(p.id))
        .sort((a, b) => idMap.get(a.id)! - idMap.get(b.id)!);
    }
    return list;
  }, [allProducts, bestSellers, dailyDeals, settings.hero.sphereProductSource, settings.hero.sphereCustomProductIds]);

  const getGridClass = (layout: ProductsLayoutConfig) => {
    const m = layout.columnsMobile === 1 ? "grid-cols-1" : "grid-cols-2";
    const t =
      layout.columnsTablet === 1
        ? "sm:grid-cols-1"
        : layout.columnsTablet === 2
        ? "sm:grid-cols-2"
        : layout.columnsTablet === 4
        ? "sm:grid-cols-4"
        : "sm:grid-cols-3";
    const d =
      layout.columnsDesktop === 2
        ? "md:grid-cols-2"
        : layout.columnsDesktop === 3
        ? "md:grid-cols-3"
        : layout.columnsDesktop === 5
        ? "md:grid-cols-5"
        : layout.columnsDesktop === 6
        ? "md:grid-cols-6"
        : "md:grid-cols-4";
    return `grid ${m} ${t} ${d} gap-4`;
  };

  return (
    <div
      ref={pageRef}
      data-home-root="true"
      className="relative flex flex-col gap-6 md:gap-10 overflow-hidden pt-2 pb-6"
      style={{ background: DARK, color: LIGHT, fontFamily: "Tajawal, system-ui, sans-serif" }}
    >
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
        <motion.div style={{ y: bgYSlow }} className="absolute inset-0 opacity-[0.12]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(color-mix(in oklab, var(--showcase-foreground) 40%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--showcase-foreground) 40%, transparent) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
              maskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)",
            }}
          />
        </motion.div>
        <motion.div
          style={{ y: bgYMid, rotate: bgRotate }}
          className="absolute -start-24 top-[20vh] h-[60vh] w-[60vh] rounded-full opacity-40 blur-3xl"
        >
          <div
            className="h-full w-full"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--primary) 55%, transparent) 0%, transparent 65%)",
            }}
          />
        </motion.div>
        <motion.div
          style={{ y: bgYSlow }}
          className="absolute -end-32 top-[80vh] h-[70vh] w-[70vh] rounded-full opacity-40 blur-3xl"
        >
          <div
            className="h-full w-full"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--primary-light) 45%, transparent) 0%, transparent 65%)",
            }}
          />
        </motion.div>
      </div>

      {/* 1. CINEMATIC HERO (3D + Video + AI) */}
      {settings.hero.enabled && (
        <div className="relative z-10 px-4">
          <Suspense fallback={<Skeleton className="h-[50vh] w-full rounded-3xl" />}>
            {settings.hero.type === "cinematic" ? (
              <CinematicStory />
            ) : (
              <ProductSphereHero
                products={sphereProducts}
                badgeText={settings.hero.badgeText}
                title={settings.hero.title}
                subtitle={settings.hero.subtitle}
                maxProducts={settings.hero.sphereMaxProducts}
                radius={settings.hero.sphereRadius}
                tileScale={settings.hero.sphereTileScale}
                cardShape={settings.hero.sphereCardShape}
                showName={settings.hero.sphereShowName}
                showPrice={settings.hero.sphereShowPrice}
              />
            )}
          </Suspense>
        </div>
      )}

      {/* 2. FEATURED PRODUCT */}
      {(bestSellers[0] || allProducts[0]) && (() => {
        const featuredProduct = bestSellers[0] || allProducts[0];
        return (
          <motion.section {...revealProps} className="relative z-10 px-4 mt-2">
            <div className="group relative overflow-hidden rounded-2xl border border-showcase-border p-4 shadow-xl min-h-[140px] flex items-center">
              {/* Optimized Background Image with zoom transition */}
              <OptimizedImage
                src={featuredProduct.image}
                alt={featuredProduct.name}
                size="large"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
              />
              {/* Dark/Blur Gradients Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/30 sm:from-black/90 sm:via-black/70 sm:to-black/20 z-0 pointer-events-none" />
              <div className="absolute inset-0 bg-radial-gradient(circle at 10% 10%, var(--primary) 15%, transparent 60%) opacity-30 z-0 pointer-events-none" />

              {/* Content on top */}
              <div className="relative flex-1 flex flex-col gap-1.5 text-start w-full min-w-0 z-10">
                <span className="self-start rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-black text-primary border border-primary/25">المنتج المميز ⭐</span>
                <h3 className="text-sm font-black text-white line-clamp-1">{featuredProduct.name}</h3>
                <p className="text-[11px] text-white/80 line-clamp-1 leading-relaxed max-w-xl">{featuredProduct.description}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
                  <Icons.Star className="h-3 w-3 fill-amber-400" />
                  <span className="font-bold">{featuredProduct.rating}</span>
                  <span className="text-white/50">({featuredProduct.reviews} تقييم)</span>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-base font-black text-primary">{formatPrice(featuredProduct.price)}</span>
                  {featuredProduct.oldPrice && (
                    <span className="text-[10px] line-through text-white/40">{formatPrice(featuredProduct.oldPrice)}</span>
                  )}
                </div>
                <div className="flex gap-2 mt-1">
                  <Link to="/product/$slug" params={{ slug: featuredProduct.slug }} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-[10px] font-bold text-white transition backdrop-blur-sm border border-white/5">
                    تفاصيل
                  </Link>
                  <a href={quickOrderLink(featuredProduct)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-[10px] font-black text-success-foreground hover:bg-success/90 transition shadow-md">
                    <Icons.MessageCircle className="h-3.5 w-3.5" />
                    اطلب الآن
                  </a>
                </div>
              </div>
            </div>
          </motion.section>
        );
      })()}

      {/* 3. AI SEARCH */}
      <motion.section {...revealProps} className="relative z-10 px-4 mt-2">
        <div className="rounded-2xl border border-showcase-border bg-surface/40 p-4 backdrop-blur-md shadow-lg text-center space-y-3">
          <div className="text-center">
            <h3 className="text-xs font-black text-showcase-foreground flex items-center justify-center gap-1">
              <Icons.Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              البحث الذكي بالذكاء الاصطناعي
            </h3>
            <p className="text-[10px] text-showcase-foreground/60 mt-0.5">اكتب مواصفات ما تبحث عنه، وسيقوم محرك البحث بإيجاده لك</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = (e.currentTarget.elements.namedItem("search") as HTMLInputElement).value;
              if (input.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(input)}`;
              }
            }}
            className="relative flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                name="search"
                type="text"
                placeholder={settings.navigation.searchPlaceholder || "ابحث بالاسم، اللون، المواصفات..."}
                className="w-full rounded-xl border border-showcase-border bg-black/40 py-2.5 pr-9 pl-4 text-xs text-showcase-foreground placeholder-showcase-muted focus:border-primary focus:outline-none transition-all"
              />
              <Icons.Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-showcase-muted" />
            </div>
            <button type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/95 transition shadow-brand">
              ابحث
            </button>
          </form>
          <div className="flex flex-wrap items-center justify-center gap-1 pt-0.5">
            <span className="text-[9px] text-showcase-foreground/50">شائع:</span>
            {["إلكترونيات", "أحدث الهواتف", "عروض اليوم"].map((tag) => (
              <Link
                key={tag}
                to="/search"
                search={{ q: tag }}
                className="rounded-full bg-showcase-foreground/5 border border-showcase-border/40 px-2 py-0.5 text-[9px] text-showcase-foreground/75 hover:bg-showcase-foreground/10 transition"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 4. SMART CATEGORIES */}
      {settings.sections.categories.enabled && (
        <motion.section key="categories" {...revealProps} className="relative z-10 px-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-black" style={{ color: LIGHT }}>
              {settings.sections.categories.title || "التصنيفات الذكية"}
            </h3>
            <Link
              to="/search"
              className="text-xs font-bold"
              style={{ color: "color-mix(in oklab, var(--showcase-foreground) 65%, transparent)" }}
            >
              الكل
            </Link>
          </div>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.05 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-4 gap-3"
          >
            {categories.slice(0, settings.sections.categories.limit ?? 8).map((c) => {
              const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[c.icon] ?? Icons.Package;
              return (
                <motion.div
                  key={c.id}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                  }}
                >
                  <Link to="/category/$id" params={{ id: c.id }} className="flex flex-col items-center gap-1.5">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20 shadow-card transition overflow-hidden">
                      {c.imageUrl ? (
                        <OptimizedImage src={c.imageUrl} alt={c.name} size="thumbnail" className="h-full w-full object-cover" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <span className="text-center text-[10px] font-semibold leading-tight" style={{ color: "color-mix(in oklab, var(--showcase-foreground) 85%, transparent)" }}>
                      {c.name}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>
      )}

      {/* 5. TRENDING NOW */}
      {settings.sections.latest.enabled && (
        <motion.section key="latest" {...revealProps} className="relative z-10 px-4 pt-4 sm:pt-6">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <span
                className="mb-1 inline-block text-[10px] font-bold tracking-[0.3em]"
                style={{ color: "color-mix(in oklab, var(--showcase-foreground) 55%, transparent)" }}
              >
                TRENDING NOW
              </span>
              <h2 className="text-xl font-black leading-tight sm:text-2xl" style={{ color: LIGHT }}>
                {settings.sections.latest.title || "المنتجات الأكثر رواجاً"}
              </h2>
            </div>
            <Link
              to="/search"
              className="text-xs font-bold"
              style={{ color: "color-mix(in oklab, var(--showcase-foreground) 65%, transparent)" }}
            >
              استكشف الكل
            </Link>
          </div>
          <div className={getGridClass(settings.products_layout)}>
            {allProducts.slice(0, settings.products_layout.latestProductsLimit ?? settings.sections.latest.limit).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </motion.section>
      )}

      {/* 6. AI RECOMMENDED */}
      {settings.sections.recommended.enabled && (
        <motion.section key="recommended" {...revealProps} className="relative z-10 px-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-black" style={{ color: LIGHT }}>
              {settings.sections.recommended.title || "مقترحات الذكاء الاصطناعي"}
            </h3>
            <Link to="/search" className="text-xs font-bold" style={{ color: "color-mix(in oklab, var(--showcase-foreground) 65%, transparent)" }}>الكل</Link>
          </div>
          <div className={getGridClass(settings.products_layout)}>
            {bestSellers.slice(0, settings.products_layout.bestSellersLimit ?? settings.sections.recommended.limit).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </motion.section>
      )}

      {/* 7. OFFERS */}
      {settings.sections.deals.enabled && (
        <motion.section key="deals" {...revealProps} className="relative z-10 px-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-black" style={{ color: LIGHT }}>
              {settings.sections.deals.title || "أقوى العروض والخصومات 🔥"}
            </h3>
            <Link to="/offers" className="text-xs font-bold" style={{ color: "color-mix(in oklab, var(--showcase-foreground) 65%, transparent)" }}>الكل</Link>
          </div>
          <div className={getGridClass(settings.products_layout)}>
            {dailyDeals.slice(0, settings.products_layout.dailyDealsLimit ?? settings.sections.deals.limit).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </motion.section>
      )}

      {/* 8. VIRTUAL SHOWROOM */}
      {settings.sections.showroom.enabled && (
        <motion.section key="showroom" {...revealProps} className="relative z-10 px-4">
          <Link
            to="/immersive-store"
            className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-3xl border p-4 shadow-2xl"
            style={{
              borderColor: LIGHT_BORDER,
              background:
                "linear-gradient(120deg, color-mix(in oklab, var(--showcase) 90%, transparent) 0%, color-mix(in oklab, var(--primary) 55%, transparent) 55%, color-mix(in oklab, var(--primary-light) 40%, transparent) 100%)",
              color: LIGHT,
            }}
          >
            <div
              className="absolute inset-0 opacity-40 mix-blend-overlay"
              style={{
                background:
                  "radial-gradient(circle at 20% 20%, color-mix(in oklab, var(--showcase-foreground) 60%, transparent), transparent 40%), radial-gradient(circle at 80% 80%, color-mix(in oklab, var(--primary-light) 70%, transparent), transparent 45%)",
              }}
            />
            <div className="relative">
              <span className="inline-block rounded-full bg-showcase-foreground/20 px-2.5 py-0.5 text-[10px] font-bold">
                {settings.sections.showroom.badge || "جديد · تجربة ثلاثية الأبعاد"}
              </span>
              <h3 className="mt-1.5 text-lg font-black leading-tight">{settings.sections.showroom.title || "المعرض الافتراضي"}</h3>
              <p className="text-[11px] text-showcase-foreground/85">{settings.sections.showroom.subtitle || "تجوّل داخل اندكس ستور الفاخر"}</p>
            </div>
            <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-showcase-foreground/15 ring-1 ring-showcase-foreground/30 backdrop-blur-md transition group-hover:scale-110">
              <Icons.Sparkles className="h-5 w-5" />
            </div>
          </Link>
        </motion.section>
      )}

      {/* 9. SOCIAL PROOF */}
      <motion.section {...revealProps} className="relative z-10 px-4 mt-4 pb-4 border-t border-showcase-border/40 pt-6">
        <div className="mb-4 text-center">
          <span className="mb-1 inline-block text-[10px] font-bold tracking-[0.3em] text-primary">REVIEWS & TESTIMONIALS</span>
          <h3 className="text-base font-black text-showcase-foreground">ماذا يقول عملاؤنا؟ ❤️</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "أحمد الحميري", role: "صنعاء", text: "تجربة شراء رائعة جداً، المنتج وصل مغلف تماماً والمعاينة ثلاثية الأبعاد ساعدتني أقرر بسرعة.", rating: 5 },
            { name: "جميل الشرعبي", role: "تعز", text: "أفضل خدمة توصيل وتعامل محترم من الدعم الفني، الجودة ممتازة والأسعار منافسة.", rating: 5 },
            { name: "سامي الذبحاني", role: "عدن", text: "الطلب عبر الواتساب سهل وسريع، والكرة ثلاثية الأبعاد فكرة مبتكرة جداً في متجر يمني.", rating: 5 }
          ].map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-showcase-border bg-surface/50 p-4 space-y-2 text-start">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-showcase-foreground">{item.name}</h4>
                  <p className="text-[9px] text-showcase-foreground/50">{item.role}</p>
                </div>
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Icons.Star key={i} className="h-3 w-3 fill-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-showcase-foreground/80 leading-relaxed italic">"{item.text}"</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ============= STICKY MOBILE CHECKOUT ============= */}
      {settings.cart_config.floatingBarEnabled && (
        <motion.div
          initial={false}
          animate={{ y: focusedProduct ? 0 : 120, opacity: focusedProduct ? 1 : 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 bottom-16 z-30 mx-auto w-full max-w-md px-3"
        >
          {focusedProduct && (
            <a
              href={quickOrderLink(focusedProduct)}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border p-2.5 shadow-2xl"
              style={{
                borderColor: LIGHT_BORDER,
                background: "color-mix(in oklab, var(--showcase) 72%, transparent)",
                backdropFilter: "blur(24px) saturate(160%)",
                color: LIGHT,
              }}
            >
              <div className="min-w-0 flex-1 ps-2 text-start">
                <p className="truncate text-xs font-bold">{focusedProduct.name}</p>
                <p className="text-[11px] font-black" style={{ color: "color-mix(in oklab, var(--showcase-foreground) 70%, transparent)" }}>
                  {formatPrice(focusedProduct.price)}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black" style={{ background: LIGHT, color: DARK }}>
                <Icons.MessageCircle className="h-3.5 w-3.5" />
                اطلب عبر واتساب
              </span>
            </a>
          )}
        </motion.div>
      )}
    </div>
  );
}
