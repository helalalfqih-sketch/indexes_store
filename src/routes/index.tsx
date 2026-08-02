import { createFileRoute, Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { formatPrice, type Product } from "@/lib/store-data";
import type {
  LegacyProductShape,
  LegacyCategoryShape,
} from "@/lib/data-adapter";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  categoriesQueryOptions,
  bestSellersQueryOptions,
  offersQueryOptions,
  allProductsQueryOptions,
} from "@/lib/store.queries";
import { StorefrontProductRail } from "@/components/storefront-product-rail";
import {
  StorefrontBenefits,
  StorefrontCategoryShortcuts,
  StorefrontRewards,
} from "@/components/storefront-premium-sections";
import { CategoryCard } from "@/components/category-card";
import { lazy, Suspense } from "react";
import { ProductCardSkeleton, Skeleton } from "@/components/ui/skeleton";

// Chunk reload guard: after a Vercel redeploy the browser may still have
// old HTML referencing old chunk hashes. On a dynamic import failure we do ONE
// hard reload (guarded by sessionStorage to avoid infinite loops).
// The helper preserves each lazy component's exact prop type; `any` is required
// here because React.ComponentType is intentionally generic over arbitrary props.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((err) => {
      const reloadKey = "chunk_reload_attempted";
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "1");
        window.location.reload();
        // Return a never-resolving promise so React stays on the reload path
        return new Promise(() => {}) as never;
      }
      throw err;
    }),
  );
}

const ImmersiveProductExperience = lazyWithRetry(() =>
  import("@/components/immersive/ImmersiveProductExperience").then(
    (module) => ({
      default: module.ImmersiveProductExperience,
    }),
  ),
);
import { quickOrderLink } from "@/lib/whatsapp";
import { useAppearance } from "@/components/appearance-provider";
import type { HeroConfig, HeroSlide } from "@/lib/domain/appearance";

const ProductSphereHero = lazyWithRetry(() =>
  import("@/components/product-sphere-hero").then((module) => ({
    default: module.ProductSphereHero,
  })),
);

function HeroSkeleton() {
  return (
    <Skeleton className="mx-2 h-[68vh] min-h-[520px] rounded-[32px] sm:mx-4 sm:h-[74vh] sm:min-h-[620px]" />
  );
}

function BannerHero({ hero }: { hero: HeroConfig }) {
  return (
    <div
      data-testid="hero-banner"
      className="relative mx-2 my-2 min-h-[350px] overflow-hidden rounded-[32px] border border-white/10 bg-surface shadow-2xl sm:mx-4"
    >
      {hero.bannerImageUrl ? (
        <img
          src={hero.bannerImageUrl}
          alt={hero.title || "البنر الرئيسي"}
          className="h-[50vh] min-h-[350px] w-full object-cover"
        />
      ) : (
        <div className="h-[50vh] min-h-[350px] w-full bg-gradient-to-r from-primary/30 to-secondary/30" />
      )}
      <HeroContent hero={hero} />
    </div>
  );
}

function HeroContent({
  hero,
}: {
  hero: Pick<
    HeroConfig,
    "badgeText" | "title" | "subtitle" | "ctaText" | "ctaLink"
  >;
}) {
  return (
    <div className="absolute inset-0 flex flex-col justify-end space-y-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 text-start sm:p-10">
      {hero.badgeText && (
        <span className="inline-block self-start rounded-full border border-primary/40 bg-primary/30 px-3.5 py-1 text-xs font-bold text-primary">
          {hero.badgeText}
        </span>
      )}
      <h1 className="text-2xl font-black leading-tight text-white sm:text-4xl">
        {hero.title}
      </h1>
      <p className="max-w-xl text-xs text-gray-200 sm:text-sm">
        {hero.subtitle}
      </p>
      {hero.ctaText && (
        <a
          href={hero.ctaLink || "/offers"}
          className="inline-flex self-start items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-bold text-white shadow-brand transition hover:bg-primary/90"
        >
          {hero.ctaText}
        </a>
      )}
    </div>
  );
}

function VideoHero({ hero }: { hero: HeroConfig }) {
  return (
    <div
      data-testid="hero-video"
      className="relative mx-2 my-2 min-h-[400px] overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-2xl sm:mx-4"
    >
      {hero.bannerVideoUrl ? (
        <video
          src={hero.bannerVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/40 to-blue-900/40" />
      )}
      <div className="relative z-10 flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8 text-center sm:p-14">
        {hero.badgeText && (
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/20 px-4 py-1 text-xs font-bold text-violet-400">
            {hero.badgeText}
          </span>
        )}
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
          {hero.title}
        </h1>
        <p className="max-w-lg text-sm text-gray-300 sm:text-base">
          {hero.subtitle}
        </p>
        {hero.ctaText && (
          <a
            href={hero.ctaLink || "/offers"}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-7 py-3 text-xs font-black text-black shadow-lg transition hover:bg-cyan-300"
          >
            {hero.ctaText}
          </a>
        )}
      </div>
    </div>
  );
}

function SlideshowHero({ hero }: { hero: HeroConfig }) {
  const slides = useMemo(
    () =>
      [...hero.slides]
        .filter((slide) => slide.mediaUrl)
        .sort((a, b) => a.order - b.order),
    [hero.slides],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
    if (slides.length < 2) return;
    const timer = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % slides.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [slides]);

  if (slides.length === 0) {
    return (
      <div data-testid="hero-slideshow">
        <BannerHero hero={hero} />
      </div>
    );
  }

  const slide: HeroSlide = slides[activeIndex] ?? slides[0];
  const content = {
    badgeText: slide.badgeText || hero.badgeText,
    title: slide.title || hero.title,
    subtitle: slide.subtitle || hero.subtitle,
    ctaText: slide.ctaText || hero.ctaText,
    ctaLink: slide.ctaLink || hero.ctaLink,
  };

  return (
    <div
      data-testid="hero-slideshow"
      className="relative mx-2 my-2 min-h-[350px] overflow-hidden rounded-[32px] border border-white/10 bg-surface shadow-2xl sm:mx-4"
    >
      {slide.mediaType === "video" ? (
        <video
          key={slide.id}
          src={slide.mediaUrl}
          autoPlay
          loop
          muted
          playsInline
          className="h-[50vh] min-h-[350px] w-full object-cover"
        />
      ) : (
        <img
          key={slide.id}
          src={slide.mediaUrl}
          alt={content.title || "الشريحة الرئيسية"}
          className="h-[50vh] min-h-[350px] w-full object-cover"
        />
      )}
      <HeroContent hero={content} />
    </div>
  );
}

export function StorefrontHero({
  hero,
  products,
}: {
  hero: HeroConfig;
  products: LegacyProductShape[];
}) {
  if (hero.enabled === false) return null;

  switch (hero.type) {
    case "sphere_3d":
      return (
        <div data-testid="hero-sphere-3d">
          <Suspense fallback={<HeroSkeleton />}>
            <ProductSphereHero
              products={products}
              badgeText={hero.badgeText}
              title={hero.title}
              subtitle={hero.subtitle}
              maxProducts={hero.sphereMaxProducts}
              radius={hero.sphereRadius}
              tileScale={hero.sphereTileScale}
              cardShape={hero.sphereCardShape}
              showName={hero.sphereShowName}
              showPrice={hero.sphereShowPrice}
              showParticles={hero.showParticles}
            />
          </Suspense>
        </div>
      );
    case "cinematic":
      return (
        <div data-testid="hero-cinematic">
          <Suspense fallback={<HeroSkeleton />}>
            <ImmersiveProductExperience products={products} />
          </Suspense>
        </div>
      );
    case "banner_image":
      return <BannerHero hero={hero} />;
    case "video":
      return <VideoHero hero={hero} />;
    case "slideshow":
      return <SlideshowHero hero={hero} />;
    default:
      return (
        <div data-testid="hero-cinematic">
          <Suspense fallback={<HeroSkeleton />}>
            <ImmersiveProductExperience products={products} />
          </Suspense>
        </div>
      );
  }
}

export const Route = createFileRoute("/")({
  head: ({ loaderData }) => {
    const seo = (
      loaderData as
        | {
            settings?: {
              seo?: {
                metaTitle?: string;
                metaDescription?: string;
                ogImage?: string;
              };
            };
          }
        | undefined
    )?.settings?.seo;
    const baseUrl =
      process.env.SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : null) ||
      import.meta.env.VITE_PUBLIC_URL ||
      "";
    const title =
      seo?.metaTitle || "اندكس ستور — الرئيسية | تسوّق أونلاين في اليمن";
    const description =
      seo?.metaDescription ||
      "اكتشف أحدث المنتجات والعروض في اندكس ستور: إلكترونيات، أزياء، أدوات منزلية، والمزيد.";
    const ogImage =
      seo?.ogImage ||
      "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/da426993-5f26-4733-b40c-c0f1f8e814c7/id-preview-7d22af97--80f7d5cf-5026-49dd-8137-91bdaa674a1a.lovable.app-1783204904911.png";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        {
          name: "robots",
          content:
            "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },
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
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(categoriesQueryOptions()),
      queryClient.ensureQueryData(bestSellersQueryOptions(4)),
      queryClient.ensureQueryData(offersQueryOptions()),
      queryClient.ensureQueryData(allProductsQueryOptions()),
    ]);
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
    <div className="p-8 text-center text-destructive">
      حدث خطأ: {error.message}
    </div>
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

const STOREFRONT_ROTATION_MS = 5 * 60 * 1000;

function rotateProducts(products: LegacyProductShape[], offset: number) {
  if (products.length < 2) return products;
  const start =
    ((offset % products.length) + products.length) % products.length;
  return [...products.slice(start), ...products.slice(0, start)];
}

function takeUnusedProducts(
  preferred: LegacyProductShape[],
  fallback: LegacyProductShape[],
  limit: number,
  offset: number,
  used: Set<string>,
) {
  const result: LegacyProductShape[] = [];
  const candidates = [
    ...rotateProducts(preferred, offset),
    ...rotateProducts(fallback, offset * 3 + 1),
  ];
  for (const product of candidates) {
    if (used.has(product.id)) continue;
    used.add(product.id);
    result.push(product);
    if (result.length === limit) break;
  }
  return result;
}

function HomePage() {
  const { data: categoriesRaw } = useSuspenseQuery(categoriesQueryOptions());
  const { data: bestSellersRaw } = useSuspenseQuery(bestSellersQueryOptions(4));
  const { data: dailyDealsRaw } = useSuspenseQuery(offersQueryOptions());
  const { data: allProductsRaw } = useSuspenseQuery(allProductsQueryOptions());
  const diagQueryClient = useQueryClient();

  // TEMPORARY DIAGNOSTICS (dev-only): proves whether a Home mount was served
  // from memory (CACHE_HIT) or triggered a network fetch (NETWORK_FETCH logs
  // from the queryFn in store.queries.ts).
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const state = diagQueryClient.getQueryState(["allProducts"]);
    const isStale =
      !state?.dataUpdatedAt || Date.now() - state.dataUpdatedAt > 5 * 60 * 1000;
    console.info("[PERF] PRODUCT_QUERY_MOUNT", {
      status: state?.status,
      fetchStatus: state?.fetchStatus,
      dataUpdatedAt: state?.dataUpdatedAt,
      isStale,
    });
    if (state?.data && state.fetchStatus === "idle") {
      console.info(
        "[PERF] PRODUCT_QUERY_CACHE_HIT — rendered from memory, no fetch",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = categoriesRaw as LegacyCategoryShape[];
  const bestSellers = bestSellersRaw as LegacyProductShape[];
  const dailyDeals = dailyDealsRaw as LegacyProductShape[];
  const allProducts = allProductsRaw as LegacyProductShape[];

  const pageRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const smoothY = useSpring(scrollY, { stiffness: 60, damping: 20, mass: 0.4 });

  // Parallax: background layers scroll slower (0.2x) than foreground (1x)
  const bgYSlow = useTransform(smoothY, (v) => v * 0.15);
  const bgYMid = useTransform(smoothY, (v) => v * 0.35);
  const bgRotate = useTransform(smoothY, (v) => v * 0.02);

  // Sticky WA — observe visibility without forcing layout reads on every scroll frame.
  const [focusedProduct, setFocusedProduct] = useState<Product | null>(null);
  useEffect(() => {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>("[data-product-id]"),
    );
    if (!cards.length || typeof IntersectionObserver === "undefined") return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.productId;
          if (!id) continue;
          if (entry.isIntersecting) visible.set(id, entry.intersectionRatio);
          else visible.delete(id);
        }

        let bestId: string | null = null;
        let bestRatio = -1;
        for (const [id, ratio] of visible) {
          if (ratio > bestRatio) {
            bestId = id;
            bestRatio = ratio;
          }
        }

        const found =
          (bestId
            ? (allProducts.find((product) => product.id === bestId) as
                | Product
                | undefined)
            : undefined) ?? null;
        setFocusedProduct((previous) =>
          previous?.id === found?.id ? previous : found,
        );
      },
      { rootMargin: "-30% 0px -30% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [allProducts]);

  const { settings } = useAppearance();

  const sphereProducts = useMemo(() => {
    let list = [...allProducts];
    const source = settings.hero.sphereProductSource || "all";
    if (source === "bestsellers") {
      list = [...bestSellers];
    } else if (source === "offers") {
      list = [...dailyDeals];
    } else if (
      source === "custom" &&
      settings.hero.sphereCustomProductIds?.length
    ) {
      const idMap = new Map(
        settings.hero.sphereCustomProductIds.map((id, idx) => [id, idx]),
      );
      list = allProducts
        .filter((p) => idMap.has(p.id))
        .sort((a, b) => idMap.get(a.id)! - idMap.get(b.id)!);
    }
    return list;
  }, [
    allProducts,
    bestSellers,
    dailyDeals,
    settings.hero.sphereProductSource,
    settings.hero.sphereCustomProductIds,
  ]);

  const [rotationCycle, setRotationCycle] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setRotationCycle((cycle) => cycle + 1),
      STOREFRONT_ROTATION_MS,
    );
    return () => window.clearInterval(timer);
  }, []);

  const storefrontCollections = useMemo(() => {
    const used = new Set<string>();
    const latestLimit = Math.min(
      settings.products_layout.latestProductsLimit ?? 8,
      10,
    );
    const recommendedLimit = Math.min(
      settings.products_layout.bestSellersLimit ?? 6,
      8,
    );
    const dealsLimit = Math.min(
      settings.products_layout.dailyDealsLimit ?? 6,
      8,
    );

    const latest = takeUnusedProducts(
      allProducts,
      [],
      latestLimit,
      rotationCycle * latestLimit,
      used,
    );
    const recommended = takeUnusedProducts(
      bestSellers,
      allProducts,
      recommendedLimit,
      rotationCycle * recommendedLimit + 2,
      used,
    );
    const deals = takeUnusedProducts(
      dailyDeals,
      allProducts,
      dealsLimit,
      rotationCycle * dealsLimit + 4,
      used,
    );

    const categoryRails = categories
      .slice(0, settings.sections.categories.limit ?? 8)
      .map((category, categoryIndex) => {
        const matching = allProducts.filter(
          (product) =>
            product.categoryId === category.sourceId ||
            product.categoryId === category.id,
        );
        return {
          category,
          products: takeUnusedProducts(
            matching,
            [],
            8,
            rotationCycle * 8 + categoryIndex * 3,
            used,
          ),
        };
      })
      .filter((rail) => rail.products.length > 0);

    return { latest, recommended, deals, categoryRails };
  }, [
    allProducts,
    bestSellers,
    categories,
    dailyDeals,
    rotationCycle,
    settings.products_layout.bestSellersLimit,
    settings.products_layout.dailyDealsLimit,
    settings.products_layout.latestProductsLimit,
    settings.sections.categories.limit,
  ]);

  const categoryPreviewImages = useMemo(() => {
    const previews = new Map<string, string>();
    for (const category of categories) {
      if (category.imageUrl) {
        previews.set(category.id, category.imageUrl);
        continue;
      }
      const product = allProducts.find(
        (item) =>
          item.categoryId === category.sourceId ||
          item.categoryId === category.id,
      );
      if (product?.image) previews.set(category.id, product.image);
    }
    return previews;
  }, [allProducts, categories]);

  return (
    <div
      ref={pageRef}
      data-home-root="true"
      className="relative flex flex-col gap-6 overflow-hidden bg-[#030611] pb-8 pt-2 md:gap-9"
      style={{
        background: "#030611",
        color: LIGHT,
        fontFamily: "Tajawal, system-ui, sans-serif",
      }}
    >
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
        <motion.div
          style={{ y: bgYSlow }}
          className="absolute inset-0 opacity-[0.12]"
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(color-mix(in oklab, var(--showcase-foreground) 40%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--showcase-foreground) 40%, transparent) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
              maskImage:
                "radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)",
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

      {/* 1. DYNAMIC STOREFRONT CMS HERO STAGE */}
      <StorefrontHero hero={settings.hero} products={sphereProducts} />

      {/* 2. AI SEARCH */}
      <motion.section {...revealProps} className="relative z-10 px-4 mt-2">
        <div className="space-y-3 rounded-[28px] border border-violet-400/25 bg-[#080d1a] p-5 text-center shadow-[0_20px_70px_rgba(76,29,149,0.18)]">
          <div className="text-center">
            <h3 className="text-xs font-black text-showcase-foreground flex items-center justify-center gap-1.5">
              <Icons.Sparkles className="h-3.5 w-3.5 text-neon animate-pulse" />
              البحث الذكي بالذكاء الاصطناعي
            </h3>
            <p className="text-[10px] text-showcase-foreground/60 mt-0.5">
              اكتب مواصفات ما تبحث عنه، وسيقوم محرك البحث بإيجاده لك
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = (
                e.currentTarget.elements.namedItem("search") as HTMLInputElement
              ).value;
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
                placeholder={
                  settings.navigation.searchPlaceholder ||
                  "ابحث بالاسم، اللون، المواصفات..."
                }
                className="w-full rounded-full border border-white/10 bg-black/40 py-2.5 pr-9 pl-4 text-xs text-showcase-foreground placeholder-showcase-muted focus:border-violet-400/60 focus:outline-none transition-all"
              />
              <Icons.Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-showcase-muted" />
            </div>
            <button
              type="submit"
              className="rounded-full bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-2.5 text-xs font-black text-white shadow-[0_8px_28px_rgba(124,58,237,0.35)] transition hover:brightness-110"
            >
              ابحث
            </button>
          </form>
          <div className="flex flex-wrap items-center justify-center gap-1 pt-0.5">
            <span className="text-[9px] text-showcase-foreground/50">
              شائع:
            </span>
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

      <StorefrontCategoryShortcuts categories={categories} />

      {/* 4. SMART CATEGORIES */}
      {settings.sections.categories.enabled && (
        <motion.section
          key="categories"
          {...revealProps}
          className="relative z-10 px-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="mb-0.5 inline-block text-[10px] font-bold tracking-[0.3em] text-violet-400">
                تصنيفات التصفح
              </span>
              <h3 className="text-xl font-black" style={{ color: LIGHT }}>
                {settings.sections.categories.title || "التصنيفات"}
              </h3>
            </div>
            <Link
              to="/search"
              className="text-xs font-bold text-violet-400 hover:underline"
            >
              استكشف الكل ➔
            </Link>
          </div>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.05 }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.05 } },
            }}
            className="grid grid-cols-1 gap-5 lg:grid-cols-2"
          >
            {categories
              .slice(0, settings.sections.categories.limit ?? 8)
              .map((c) => (
                <motion.div
                  key={c.id}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                    },
                  }}
                >
                  <CategoryCard
                    category={{
                      ...c,
                      imageUrl: categoryPreviewImages.get(c.id) || c.imageUrl,
                    }}
                  />
                </motion.div>
              ))}
          </motion.div>
        </motion.section>
      )}

      {/* 5. PREMIUM OFFER RAILS */}
      {settings.sections.deals.enabled && (
        <StorefrontProductRail
          title={settings.sections.deals.title || "أفضل العروض لك 🔥"}
          eyebrow="عروض حقيقية من الكتالوج"
          products={storefrontCollections.deals}
          href="/offers"
          eager
        />
      )}

      {settings.sections.latest.enabled && (
        <StorefrontProductRail
          title={settings.sections.latest.title || "وصل حديثاً"}
          eyebrow="يتجدد كل 5 دقائق"
          products={storefrontCollections.latest}
        />
      )}

      {settings.sections.recommended.enabled && (
        <StorefrontProductRail
          title={settings.sections.recommended.title || "مختارة لك"}
          eyebrow="مقترحات من المتجر"
          products={storefrontCollections.recommended}
        />
      )}

      {/* 6. CATEGORY SHOWROOMS — vertical sections, horizontal snap inside each one */}
      {settings.sections.categories.enabled &&
        storefrontCollections.categoryRails.map(({ category, products }) => (
          <StorefrontProductRail
            key={category.id}
            title={category.name}
            eyebrow="معرض الفئة"
            products={products}
            href="/search"
          />
        ))}

      <StorefrontBenefits />

      {/* 8b. VIRTUAL SHOWROOM */}
      {settings.sections.showroom.enabled && (
        <motion.section
          key="showroom"
          {...revealProps}
          className="relative z-10 px-4"
        >
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
                {settings.sections.showroom.badge ||
                  "جديد · تجربة ثلاثية الأبعاد"}
              </span>
              <h3 className="mt-1.5 text-lg font-black leading-tight">
                {settings.sections.showroom.title || "المعرض الافتراضي"}
              </h3>
              <p className="text-[11px] text-showcase-foreground/85">
                {settings.sections.showroom.subtitle ||
                  "تجوّل داخل اندكس ستور الفاخر"}
              </p>
            </div>
            <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-showcase-foreground/15 ring-1 ring-showcase-foreground/30 backdrop-blur-md transition group-hover:scale-110">
              <Icons.Sparkles className="h-5 w-5" />
            </div>
          </Link>
        </motion.section>
      )}

      <StorefrontRewards />

      {/* 9. SOCIAL PROOF & TESTIMONIALS */}
      {settings.sections.testimonials.enabled !== false && (
        <motion.section
          {...revealProps}
          className="relative z-10 px-4 mt-4 pb-4 border-t border-showcase-border/40 pt-6"
        >
          <div className="mb-4 text-center">
            <span className="mb-1 inline-block text-[10px] font-bold tracking-[0.3em] text-primary">
              تقييمات العملاء
            </span>
            <h3 className="text-base font-black text-showcase-foreground">
              {settings.sections.testimonials.title || "ماذا يقول عملاؤنا؟ ❤️"}
            </h3>
            {settings.sections.testimonials.subtitle && (
              <p className="text-[11px] text-showcase-foreground/60 mt-0.5">
                {settings.sections.testimonials.subtitle}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(settings.sections.testimonials.items?.length
              ? settings.sections.testimonials.items
              : [
                  {
                    name: "أحمد الحميري",
                    city: "صنعاء",
                    comment:
                      "تجربة شراء رائعة جداً، المنتج وصل مغلف تماماً والمعاينة ثلاثية الأبعاد ساعدتني أقرر بسرعة.",
                    rating: 5,
                  },
                  {
                    name: "جميل الشرعبي",
                    city: "تعز",
                    comment:
                      "أفضل خدمة توصيل وتعامل محترم من الدعم الفني، الجودة ممتازة والأسعار منافسة.",
                    rating: 5,
                  },
                  {
                    name: "سامي الذبحاني",
                    city: "عدن",
                    comment:
                      "الطلب عبر الواتساب سهل وسريع، والكرة ثلاثية الأبعاد فكرة مبتكرة جداً في متجر يمني.",
                    rating: 5,
                  },
                ]
            ).map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-showcase-border bg-surface/50 p-4 space-y-2 text-start"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-showcase-foreground">
                      {item.name}
                    </h4>
                    <p className="text-[9px] text-showcase-foreground/50">
                      {item.city}
                    </p>
                  </div>
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: item.rating || 5 }).map((_, i) => (
                      <Icons.Star key={i} className="h-3 w-3 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-showcase-foreground/80 leading-relaxed italic">
                  "{item.comment}"
                </p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* 10. WHATSAPP CTA BANNER */}
      {settings.sections.whatsappCta?.enabled !== false && (
        <motion.section {...revealProps} className="relative z-10 px-4">
          <div className="rounded-[32px] glass-dark p-6 text-center space-y-3 border border-success/30 bg-gradient-to-r from-success/10 via-surface/40 to-primary/10">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-success/20 text-success border border-success/30">
              <Icons.MessageCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black text-showcase-foreground">
              {settings.sections.whatsappCta?.title ||
                "هل تحتاج مساعدة في الطلب؟"}
            </h3>
            <p className="text-xs text-showcase-foreground/70 max-w-md mx-auto">
              {settings.sections.whatsappCta?.subtitle ||
                "فريق خدمة العملاء متواجد على مدار الساعة على واتساب"}
            </p>
            <a
              href={`https://wa.me/${settings.sections.whatsappCta?.phone || settings.navigation.whatsappPhone || "967771370740"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-success px-6 py-2.5 text-xs font-black text-success-foreground hover:bg-success/90 transition shadow-lg"
            >
              <Icons.MessageCircle className="h-4 w-4" />
              {settings.sections.whatsappCta?.buttonText ||
                "تواصل معنا عبر واتساب 💬"}
            </a>
          </div>
        </motion.section>
      )}

      {/* ============= STICKY MOBILE CHECKOUT ============= */}
      {settings.cart_config.floatingBarEnabled && (
        <motion.div
          initial={false}
          animate={{
            y: focusedProduct ? 0 : 120,
            opacity: focusedProduct ? 1 : 0,
          }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 z-30 mx-auto w-full max-w-md px-3 sm:inset-x-auto sm:end-4 sm:mx-0 sm:max-w-sm"
          style={{
            // Above the mobile bottom nav + notch-safe (env safe-area).
            bottom: "calc(6rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {focusedProduct && (
            <a
              href={quickOrderLink(focusedProduct)}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto flex items-center justify-between gap-3 rounded-full border p-2 ps-4 shadow-2xl"
              style={{
                borderColor: LIGHT_BORDER,
                background:
                  "color-mix(in oklab, var(--showcase) 72%, transparent)",
                backdropFilter: "blur(24px) saturate(160%)",
                color: LIGHT,
              }}
            >
              <div className="min-w-0 flex-1 ps-2 text-start">
                <p className="truncate text-xs font-bold">
                  {focusedProduct.name}
                </p>
                <p
                  className="text-[11px] font-black"
                  style={{
                    color:
                      "color-mix(in oklab, var(--showcase-foreground) 70%, transparent)",
                  }}
                >
                  {formatPrice(focusedProduct.price)}
                </p>
              </div>
              <span
                className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-black"
                style={{ background: LIGHT, color: DARK }}
              >
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
