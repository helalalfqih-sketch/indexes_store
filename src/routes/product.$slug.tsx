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
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { formatPrice } from "@/lib/store-data";
import { fetchProductBySlug } from "@/lib/actions/product.actions";
import { useCart } from "@/lib/cart-store";
import { buildOrderMessage, quickOrderLink } from "@/lib/whatsapp";
import { Product3DTile, modelFor, useModelViewer, useMounted } from "@/lib/model-viewer";

const DARK = "#000209";
const LIGHT = "#EEEEEE";
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
    <div className="p-8 text-center">
      <p className="text-lg font-bold">المنتج غير موجود</p>
      <Link to="/" className="mt-4 inline-block text-primary underline">
        العودة للرئيسية
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">حدث خطأ: {error.message}</div>
  ),
  component: ProductPage,
});

// Reusable fade-in-up on scroll block
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ProductPage() {
  const { product } = Route.useLoaderData();
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();
  useModelViewer();

  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { rootMargin: "-40% 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  const handleAdd = () => {
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const orderHref = quickOrderLink(product);

  return (
    <div
      dir="rtl"
      className="flex flex-col pb-40"
      style={{ background: DARK, color: LIGHT, fontFamily: TAJAWAL }}
    >
      {/* ============= IMMERSIVE HERO ============= */}
      <section ref={heroRef} className="relative h-[100vh] overflow-hidden">
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 55%, rgba(238,238,238,0.18) 0%, rgba(238,238,238,0.05) 30%, transparent 60%)",
          }}
        />
        {/* Grain / vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.9), transparent 60%)",
          }}
        />

        {/* Back button */}
        <Link
          to="/"
          className="absolute end-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 backdrop-blur-xl transition hover:bg-white/10"
          style={{ color: LIGHT }}
        >
          <ArrowRight className="h-4 w-4" />
        </Link>

        {/* Category chip */}
        <div className="absolute start-4 top-4 z-20">
          <span
            className="inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold tracking-[0.3em] backdrop-blur-xl"
            style={{ color: LIGHT }}
          >
            INDEXES · PREMIUM
          </span>
        </div>

        {/* 3D / Image showcase */}
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="relative z-10 h-full w-full"
        >
          {mounted ? (
            <div className="h-full w-full">
              <Product3DTile
                modelSrc={modelFor(product.id)}
                poster={product.image}
                alt={product.name}
              />
            </div>
          ) : (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-contain"
            />
          )}
        </motion.div>

        {/* Hero copy */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-14 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl"
            style={{ color: LIGHT }}
          >
            {product.name}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35 }}
            className="mt-4 flex items-center justify-center gap-3 text-sm"
            style={{ color: "rgba(238,238,238,0.7)" }}
          >
            <span className="text-2xl font-black" style={{ color: LIGHT }}>
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-sm line-through opacity-50">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1.2 }}
            className="mt-8 flex items-center justify-center gap-2 text-[10px] tracking-[0.4em]"
            style={{ color: "rgba(238,238,238,0.4)" }}
          >
            <span className="h-px w-8" style={{ background: "rgba(238,238,238,0.4)" }} />
            SCROLL
            <span className="h-px w-8" style={{ background: "rgba(238,238,238,0.4)" }} />
          </motion.div>
        </div>
      </section>

      {/* ============= NARRATIVE / DESCRIPTION ============= */}
      <section className="px-6 py-32">
        <Reveal>
          <p
            className="text-[10px] font-bold tracking-[0.4em]"
            style={{ color: "rgba(238,238,238,0.5)" }}
          >
            — نبذة
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2
            className="mt-6 text-3xl font-black leading-[1.25] sm:text-4xl"
            style={{ color: LIGHT }}
          >
            صُمّم ليكون
            <br />
            استثنائياً في كل تفصيل.
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p
            className="mt-8 text-base leading-loose"
            style={{ color: "rgba(238,238,238,0.65)" }}
          >
            {product.description}
          </p>
        </Reveal>
      </section>

      {/* ============= FEATURE STORY BLOCKS ============= */}
      <section className="flex flex-col gap-32 px-6 py-16">
        {[
          {
            tag: "الأداء",
            title: "أداء يفوق التوقعات.",
            body: "تقنية متطورة وتصميم دقيق يجعلانك تختبر الفرق من أول استخدام. سرعة، سلاسة، وموثوقية بلا حدود.",
            icon: Zap,
          },
          {
            tag: "التصميم",
            title: "جماليات نظيفة، حِرفة عالية.",
            body: "خطوط أنيقة، خامات مختارة بعناية، وتفاصيل تنبض بالفخامة. قطعة تستحق أن تُعرض، لا أن تُخبّأ.",
            icon: Sparkles,
          },
          {
            tag: "الجودة",
            title: "مضمون لسنوات قادمة.",
            body: "اختبارات صارمة وضمان شامل يمنحك راحة البال. لأن التميّز يستحق أن يدوم.",
            icon: Shield,
          },
        ].map((f, i) => (
          <Reveal key={f.tag} delay={i * 0.05}>
            <div className="flex flex-col gap-6">
              <div
                className="grid h-14 w-14 place-items-center rounded-2xl border"
                style={{
                  borderColor: "rgba(238,238,238,0.15)",
                  background: "rgba(238,238,238,0.03)",
                }}
              >
                <f.icon className="h-6 w-6" style={{ color: LIGHT }} />
              </div>
              <span
                className="text-[10px] font-bold tracking-[0.4em]"
                style={{ color: "rgba(238,238,238,0.5)" }}
              >
                — {f.tag}
              </span>
              <h3
                className="text-3xl font-black leading-tight sm:text-4xl"
                style={{ color: LIGHT }}
              >
                {f.title}
              </h3>
              <p
                className="text-base leading-loose"
                style={{ color: "rgba(238,238,238,0.6)" }}
              >
                {f.body}
              </p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* ============= BENTO SPECS GRID ============= */}
      <section className="px-6 py-32">
        <Reveal>
          <p
            className="text-[10px] font-bold tracking-[0.4em]"
            style={{ color: "rgba(238,238,238,0.5)" }}
          >
            — المواصفات
          </p>
          <h3
            className="mt-6 text-3xl font-black sm:text-4xl"
            style={{ color: LIGHT }}
          >
            كل ما تحتاج معرفته.
          </h3>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4">
          <BentoCell className="col-span-2 sm:col-span-1" label="التقييم">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black" style={{ color: LIGHT }}>
                {product.rating}
              </span>
              <Star className="h-5 w-5 fill-current" style={{ color: LIGHT }} />
            </div>
            <p
              className="mt-2 text-xs"
              style={{ color: "rgba(238,238,238,0.5)" }}
            >
              من {product.reviews} تقييم
            </p>
          </BentoCell>

          <BentoCell label="التوفر">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black" style={{ color: LIGHT }}>
                {product.stock}
              </span>
              <span className="text-xs" style={{ color: "rgba(238,238,238,0.5)" }}>
                قطعة
              </span>
            </div>
            <p
              className="mt-2 text-xs"
              style={{ color: "rgba(238,238,238,0.5)" }}
            >
              متوفر الآن للشحن
            </p>
          </BentoCell>

          <BentoCell label="السعر">
            <span className="text-3xl font-black" style={{ color: LIGHT }}>
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && (
              <p
                className="mt-2 text-xs line-through"
                style={{ color: "rgba(238,238,238,0.4)" }}
              >
                {formatPrice(product.oldPrice)}
              </p>
            )}
          </BentoCell>

          <BentoCell className="col-span-2" label="الخدمات">
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Truck, label: "شحن سريع" },
                { icon: Shield, label: "ضمان" },
                { icon: RefreshCcw, label: "إرجاع مجاني" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-2 text-center">
                  <s.icon className="h-5 w-5" style={{ color: LIGHT }} />
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: "rgba(238,238,238,0.75)" }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </BentoCell>

          <BentoCell className="col-span-2" label="الفئة">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5" style={{ color: "rgba(238,238,238,0.6)" }} />
              <span
                className="text-lg font-bold"
                style={{ color: LIGHT }}
              >
                {product.categoryId}
              </span>
            </div>
          </BentoCell>
        </div>
      </section>

      {/* ============= QTY + CTA (inline) ============= */}
      <section className="px-6 pb-16">
        <Reveal>
          <div
            className="flex items-center justify-between rounded-2xl border p-4"
            style={{
              borderColor: "rgba(238,238,238,0.12)",
              background: "rgba(238,238,238,0.03)",
            }}
          >
            <span className="text-sm font-bold" style={{ color: LIGHT }}>
              الكمية
            </span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="grid h-9 w-9 place-items-center rounded-full border transition hover:bg-white/10"
                style={{ borderColor: "rgba(238,238,238,0.2)", color: LIGHT }}
                aria-label="نقصان"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span
                className="w-6 text-center text-lg font-black"
                style={{ color: LIGHT }}
              >
                {qty}
              </span>
              <button
                onClick={() => setQty(Math.min(product.stock, qty + 1))}
                className="grid h-9 w-9 place-items-center rounded-full transition hover:opacity-90"
                style={{ background: LIGHT, color: DARK }}
                aria-label="زيادة"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center justify-center gap-1.5 rounded-2xl border px-4 py-4 text-xs font-bold transition hover:bg-white/10"
              style={{ borderColor: "rgba(238,238,238,0.2)", color: LIGHT }}
            >
              <ShoppingCart className="h-4 w-4" />
              {added ? "تمت الإضافة" : "السلة"}
            </button>
            <a
              href={orderHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-black transition hover:opacity-90"
              style={{ background: LIGHT, color: DARK }}
            >
              <MessageCircle className="h-4 w-4" />
              اطلب عبر واتساب
            </a>
          </div>
        </Reveal>
      </section>

      {/* ============= STICKY CONVERSION BAR ============= */}
      <motion.div
        initial={false}
        animate={{
          y: showStickyBar ? 0 : 120,
          opacity: showStickyBar ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 bottom-16 z-40 mx-auto w-full max-w-md px-3"
        style={{ pointerEvents: showStickyBar ? "auto" : "none" }}
      >
        <div
          className="flex items-center justify-between gap-3 rounded-2xl border p-2.5 shadow-2xl"
          style={{
            borderColor: "rgba(238,238,238,0.12)",
            background: "rgba(0,2,9,0.72)",
            backdropFilter: "blur(24px) saturate(160%)",
          }}
        >
          <div className="min-w-0 flex-1 ps-2">
            <p
              className="truncate text-xs font-bold"
              style={{ color: LIGHT }}
            >
              {product.name}
            </p>
            <p
              className="text-[11px] font-black"
              style={{ color: "rgba(238,238,238,0.7)" }}
            >
              {formatPrice(product.price)}
            </p>
          </div>
          <a
            href={orderHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black transition hover:opacity-90"
            style={{ background: LIGHT, color: DARK }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            اطلب عبر واتساب
          </a>
        </div>
      </motion.div>
    </div>
  );
}

function BentoCell({
  children,
  label,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-5 transition ${className}`}
      style={{
        borderColor: "rgba(238,238,238,0.1)",
        background: "rgba(238,238,238,0.02)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(238,238,238,0.08), transparent 70%)",
        }}
      />
      <p
        className="mb-3 text-[10px] font-bold tracking-[0.3em]"
        style={{ color: "rgba(238,238,238,0.4)" }}
      >
        {label.toUpperCase()}
      </p>
      <div className="relative">{children}</div>
    </div>
  );
}
