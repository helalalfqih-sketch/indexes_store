import { createFileRoute, Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { formatPrice, type Product } from "@/lib/store-data";
import type { LegacyProductShape, LegacyCategoryShape } from "@/lib/data-adapter";
import { fetchProducts, fetchOffers, fetchBestSellers } from "@/lib/actions/product.actions";
import { fetchCategories } from "@/lib/actions/category.actions";
import { ProductCard } from "@/components/product-card";
import { ProductSphereHero } from "@/components/product-sphere-hero";
import { CinematicStory } from "@/components/cinematic-story";
import { quickOrderLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "اندكس ستور — الرئيسية | تسوّق أونلاين في اليمن" },
      {
        name: "description",
        content:
          "اكتشف أحدث المنتجات والعروض في اندكس ستور: إلكترونيات، أزياء، أدوات منزلية، والمزيد.",
      },
    ],
  }),
  loader: async () => {
    const [categories, bestSellers, dailyDeals, allProducts] = await Promise.all([
      fetchCategories(),
      fetchBestSellers(4),
      fetchOffers().then((rows) => rows.slice(0, 4)),
      fetchProducts(),
    ]);
    return {
      categories: categories as LegacyCategoryShape[],
      bestSellers: bestSellers as LegacyProductShape[],
      dailyDeals: dailyDeals as LegacyProductShape[],
      allProducts: allProducts as LegacyProductShape[],
    };
  },
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
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, amount: 0.3 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
};

function HomePage() {
  const data = Route.useLoaderData() as {
    categories: LegacyCategoryShape[];
    bestSellers: LegacyProductShape[];
    dailyDeals: LegacyProductShape[];
    allProducts: LegacyProductShape[];
  };
  const { categories, bestSellers, dailyDeals, allProducts } = data;

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

  return (
    <div
      ref={pageRef}
      data-home-root="true"
      className="relative flex flex-col gap-10 overflow-hidden pt-4 pb-64"
      style={{ background: DARK, color: LIGHT, fontFamily: "Tajawal, system-ui, sans-serif" }}
    >
      {/* ============= PARALLAX BACKGROUND LAYERS ============= */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
        {/* Deep grid layer — slow */}
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
        {/* Glow orb A — mid */}
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
        {/* Glow orb B — slower */}
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

      {/* ============= HERO — 3D PRODUCT SPHERE ============= */}
      <div className="relative z-10 px-4">
        <ProductSphereHero products={allProducts} />
      </div>

      {/* ============= LATEST PRODUCTS ============= */}
      <motion.section {...revealProps} className="relative z-10 px-4 pt-8 sm:pt-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <span
              className="mb-1 inline-block text-[10px] font-bold tracking-[0.3em]"
              style={{ color: "color-mix(in oklab, var(--showcase-foreground) 55%, transparent)" }}
            >
              NEW ARRIVALS
            </span>
            <h2 className="text-xl font-black leading-tight sm:text-2xl" style={{ color: LIGHT }}>
              أحدث المنتجات
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 [&_a>div:first-child]:transition-transform [&_a:hover>div:first-child]:scale-[1.03] [&_a]:shadow-card [&_a:hover]:shadow-xl [&_a]:transition-shadow">
          {allProducts.slice(0, 12).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </motion.section>

      {/* ============= IMMERSIVE SHOWROOM ENTRY ============= */}
      <motion.section {...revealProps} className="relative z-10 px-4">
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
              جديد · تجربة ثلاثية الأبعاد
            </span>
            <h3 className="mt-1.5 text-lg font-black leading-tight">المعرض الافتراضي</h3>
            <p className="text-[11px] text-showcase-foreground/85">تجوّل داخل اندكس ستور الفاخر</p>
          </div>
          <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-showcase-foreground/15 ring-1 ring-showcase-foreground/30 backdrop-blur-md transition group-hover:scale-110">
            <Icons.Sparkles className="h-5 w-5" />
          </div>
        </Link>
      </motion.section>

      {/* ============= CATEGORIES ============= */}
      <motion.section {...revealProps} className="relative z-10 px-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-black" style={{ color: LIGHT }}>
            التصنيفات
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
          viewport={{ once: false, amount: 0.2 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.05 } },
          }}
          className="grid grid-cols-4 gap-3"
        >
          {categories.slice(0, 8).map((c) => {
            const Icon =
              (Icons as unknown as Record<string, Icons.LucideIcon>)[c.icon] ?? Icons.Package;
            return (
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
                <Link
                  to="/category/$id"
                  params={{ id: c.id }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20 shadow-card transition group-hover:bg-primary/25">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span
                    className="text-center text-[10px] font-semibold leading-tight"
                    style={{
                      color: "color-mix(in oklab, var(--showcase-foreground) 85%, transparent)",
                    }}
                  >
                    {c.name}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>

      {/* ============= DAILY DEALS ============= */}
      <motion.section {...revealProps} className="relative z-10 px-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-black" style={{ color: LIGHT }}>
            عروض اليوم 🔥
          </h3>
          <Link
            to="/offers"
            className="text-xs font-bold"
            style={{ color: "color-mix(in oklab, var(--showcase-foreground) 65%, transparent)" }}
          >
            الكل
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {dailyDeals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </motion.section>

      {/* ============= CINEMATIC STORY (full-bleed) ============= */}
      <section className="relative z-10 -mx-4">
        <CinematicStory />
      </section>

      {/* ============= RECOMMENDED ============= */}
      <motion.section {...revealProps} className="relative z-10 px-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-black" style={{ color: LIGHT }}>
            الأكثر مبيعاً
          </h3>
          <Link
            to="/search"
            className="text-xs font-bold"
            style={{ color: "color-mix(in oklab, var(--showcase-foreground) 65%, transparent)" }}
          >
            الكل
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {bestSellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </motion.section>

      {/* ============= STICKY MOBILE CHECKOUT ============= */}
      <motion.div
        initial={false}
        animate={{
          y: focusedProduct ? 0 : 120,
          opacity: focusedProduct ? 1 : 0,
        }}
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
              <p
                className="text-[11px] font-black"
                style={{
                  color: "color-mix(in oklab, var(--showcase-foreground) 70%, transparent)",
                }}
              >
                {formatPrice(focusedProduct.price)}
              </p>
            </div>
            <span
              className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black"
              style={{ background: LIGHT, color: DARK }}
            >
              <Icons.MessageCircle className="h-3.5 w-3.5" />
              اطلب عبر واتساب
            </span>
          </a>
        )}
      </motion.div>
    </div>
  );
}
