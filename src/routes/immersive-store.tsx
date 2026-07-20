import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Home, MessageCircle, RotateCw, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import showroomBg from "@/assets/indexes-store-bg.jpg.asset.json";
import { products, formatPrice, type Product } from "@/lib/store-data";
import { useCart } from "@/lib/cart-store";
import { quickOrderLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/immersive-store")({
  head: () => ({
    meta: [
      { title: "المعرض الافتراضي — اندكس ستور" },
      {
        name: "description",
        content: "تجربة تسوق سباتيال فاخرة — استكشف المنتجات ثلاثية الأبعاد بحرية.",
      },
    ],
  }),
  component: ImmersiveStore,
});

// Public placeholder GLB models — rotated between products to showcase 3D.
const PLACEHOLDER_MODELS = [
  "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb",
  "https://modelviewer.dev/shared-assets/models/reflective-sphere.glb",
];
const modelFor = (id: string) => {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PLACEHOLDER_MODELS[h % PLACEHOLDER_MODELS.length];
};

// Type shim for the <model-viewer> web component (React 19)
/* eslint-disable @typescript-eslint/no-namespace -- React's JSX module augmentation requires this namespace shape. */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & Record<string, unknown>,
        HTMLElement
      >;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

function useModelViewer() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.querySelector("script[data-mv-loader]")) return;
    const s = document.createElement("script");
    s.type = "module";
    s.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js";
    s.setAttribute("data-mv-loader", "1");
    document.head.appendChild(s);
  }, []);
}

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

function ImmersiveStore() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const addToCart = useCart((s) => s.add);
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total);
  const mounted = useMounted();
  useModelViewer();

  const product: Product | null = useMemo(
    () => products.find((p) => p.id === activeId) ?? null,
    [activeId],
  );

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleOrder = () => {
    if (!product) return;
    window.open(quickOrderLink(product), "_blank");
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 h-screen w-screen overflow-hidden bg-showcase text-showcase-foreground"
      style={{ fontFamily: "Tajawal, sans-serif" }}
    >
      {/* Ambient spatial backdrop */}
      <div className="absolute inset-0">
        <img
          src={showroomBg.url}
          alt=""
          aria-hidden
          className="h-full w-full scale-110 object-cover opacity-30 blur-2xl"
          draggable={false}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 10%, color-mix(in oklab, var(--primary) 35%, transparent), transparent 55%), radial-gradient(circle at 85% 90%, color-mix(in oklab, var(--primary-light) 28%, transparent), transparent 55%), radial-gradient(circle at 50% 50%, transparent 40%, color-mix(in oklab, var(--showcase) 85%, transparent) 100%)",
          }}
        />
        {/* Subtle animated aurora */}
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-40"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          style={{
            background:
              "conic-gradient(from 180deg at 50% 50%, color-mix(in oklab, var(--primary) 12%, transparent), color-mix(in oklab, var(--primary-light) 8%, transparent), color-mix(in oklab, var(--primary-soft) 10%, transparent), color-mix(in oklab, var(--primary) 12%, transparent))",
            backgroundSize: "200% 200%",
            mixBlendMode: "screen",
          }}
        />
      </div>

      {/* Top glass bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-3 pt-4 sm:px-8">
        <Link
          to="/"
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-showcase-foreground/20 bg-showcase-foreground/10 px-3.5 py-2 text-[11px] font-bold text-showcase-foreground backdrop-blur-xl transition hover:bg-showcase-foreground/20 sm:text-xs"
        >
          <ArrowRight className="h-4 w-4" />
          الرئيسية
        </Link>

        <div className="pointer-events-auto hidden items-center gap-2 rounded-full border border-showcase-border bg-showcase/30 px-4 py-2 text-[11px] font-bold text-showcase-foreground/90 backdrop-blur-xl sm:flex">
          <span className="grid h-2 w-2 place-items-center rounded-full bg-primary-light shadow-brand" />
          المعرض السباتيال — اندكس ستور
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-showcase-foreground/20 bg-showcase-foreground/10 px-3.5 py-2 text-[11px] font-bold text-showcase-foreground backdrop-blur-xl sm:text-xs">
          <Sparkles className="h-3.5 w-3.5 text-primary-light" />
          Vision · 3D
        </div>
      </div>

      {/* Title */}
      <div className="pointer-events-none absolute inset-x-0 top-20 z-30 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-lg font-black tracking-tight sm:text-2xl"
        >
          استكشف منتجاتك <span className="text-primary-light">بحرية</span>
        </motion.h1>
        <p className="mx-auto mt-1 max-w-xs text-[11px] text-showcase-muted sm:max-w-md sm:text-sm">
          المس أي دائرة لتفتح النموذج ثلاثي الأبعاد وتدور حوله بلمسة إصبع
        </p>
      </div>

      {/* Floating soft-circle constellation */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="grid w-full max-w-3xl grid-cols-4 gap-x-2 gap-y-6 sm:gap-x-6 sm:gap-y-10">
          {products.map((p, i) => {
            // Gentle vertical curve — sine wave over columns
            const col = i % 4;
            const arc = Math.sin((col / 3) * Math.PI) * 22; // px
            const delay = 0.08 * i;
            return (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className="group flex flex-col items-center focus:outline-none"
                style={{ transform: `translateY(${-arc}px)` }}
                aria-label={p.name}
              >
                <motion.div
                  layoutId={`orb-${p.id}`}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: [0, -6, 0],
                  }}
                  transition={{
                    opacity: { duration: 0.5, delay },
                    scale: { duration: 0.5, delay, type: "spring", stiffness: 140, damping: 14 },
                    y: {
                      duration: 4 + (i % 4) * 0.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: (i % 4) * 0.4,
                    },
                  }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.96 }}
                  className="relative aspect-square w-full overflow-hidden rounded-full ring-1 ring-white/15"
                  style={
                    {
                      background:
                        "radial-gradient(circle at 30% 25%, color-mix(in oklab, var(--showcase-foreground) 35%, transparent), color-mix(in oklab, var(--primary) 15%, transparent) 55%, color-mix(in oklab, var(--showcase) 60%, transparent) 100%)",
                      boxShadow:
                        "0 20px 60px -18px color-mix(in oklab, var(--primary) 55%, transparent), 0 0 0 1px color-mix(in oklab, var(--showcase-foreground) 8%, transparent) inset, 0 0 30px -6px color-mix(in oklab, var(--primary-light) 35%, transparent)",
                      backdropFilter: "blur(14px)",
                    } as CSSProperties
                  }
                >
                  <img
                    src={p.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                  {/* Glossy highlight */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 20%, color-mix(in oklab, var(--showcase-foreground) 45%, transparent), transparent 45%)",
                    }}
                  />
                  {/* Outer soft ring */}
                  <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />
                </motion.div>
                <span className="mt-2 line-clamp-1 max-w-[70px] text-center text-[10px] font-bold text-showcase-foreground/80 sm:max-w-[110px] sm:text-xs">
                  {p.name}
                </span>
                <span className="mt-0.5 text-[10px] font-black text-primary-light sm:text-xs">
                  {formatPrice(p.price)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom hint / cart */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 px-3 pb-5 sm:px-8">
        <div className="rounded-full border border-showcase-border bg-showcase/40 px-3.5 py-2 text-[10px] text-showcase-foreground/70 backdrop-blur-xl sm:text-[11px]">
          اسحب النموذج للتدوير · 360°
        </div>
        {mounted && (
          <Link
            to="/cart"
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-showcase-foreground/20 bg-primary/85 px-3.5 py-2 text-[11px] font-bold text-primary-foreground shadow-brand backdrop-blur-xl transition hover:bg-primary sm:text-xs"
          >
            <Home className="h-4 w-4" />
            السلة ({items.length}) · {formatPrice(total())}
          </Link>
        )}
      </div>

      {/* Expanded showcase modal with Shared Layout */}
      <AnimatePresence>
        {product && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="fixed inset-0 z-50 bg-showcase/55 backdrop-blur-md"
              onClick={() => setActiveId(null)}
            />

            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-8">
              <motion.div
                key="modal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="pointer-events-auto relative w-full max-w-4xl overflow-hidden rounded-3xl border border-showcase-border shadow-brand"
                style={{
                  background:
                    "linear-gradient(140deg, color-mix(in oklab, var(--primary) 22%, transparent), color-mix(in oklab, var(--showcase) 75%, transparent))",
                  backdropFilter: "blur(28px) saturate(160%)",
                }}
              >
                <button
                  onClick={() => setActiveId(null)}
                  className="absolute end-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-showcase/45 text-showcase-foreground/90 backdrop-blur-md transition hover:bg-showcase/70"
                  aria-label="إغلاق"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="grid gap-3 p-3 sm:grid-cols-2 sm:gap-6 sm:p-6">
                  {/* 3D Stage */}
                  <motion.div
                    layoutId={`orb-${product.id}`}
                    className="relative aspect-square overflow-hidden rounded-2xl ring-1 ring-white/15 sm:aspect-auto sm:h-[520px]"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 25%, color-mix(in oklab, var(--primary-light) 35%, transparent), color-mix(in oklab, var(--showcase) 70%, transparent) 60%, color-mix(in oklab, var(--showcase) 90%, transparent) 100%)",
                      boxShadow:
                        "inset 0 0 60px color-mix(in oklab, var(--primary) 25%, transparent), 0 0 0 1px color-mix(in oklab, var(--showcase-foreground) 6%, transparent) inset",
                    }}
                  >
                    <ModelStage src={modelFor(product.id)} poster={product.image} />
                    <div className="pointer-events-none absolute start-3 top-3 flex items-center gap-1.5 rounded-full border border-showcase-foreground/20 bg-showcase/40 px-2.5 py-1 text-[10px] font-bold text-showcase-foreground/90 backdrop-blur-md">
                      <RotateCw className="h-3 w-3" /> اسحب للتدوير
                    </div>
                  </motion.div>

                  {/* Details */}
                  <div className="flex flex-col justify-between gap-4 p-1 sm:p-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-light">
                        <Sparkles className="h-3 w-3" /> تجربة ثلاثية الأبعاد
                      </div>
                      <h2 className="mt-1.5 text-xl font-black leading-tight sm:text-3xl">
                        {product.name}
                      </h2>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-showcase-foreground sm:text-4xl">
                          {formatPrice(product.price)}
                        </span>
                        {product.oldPrice && (
                          <span className="text-xs text-showcase-foreground/40 line-through sm:text-sm">
                            {formatPrice(product.oldPrice)}
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-showcase-foreground/75 sm:text-sm">
                        {product.description}
                      </p>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        {[
                          { k: "التقييم", v: `${product.rating} ★` },
                          { k: "المخزون", v: `${product.stock}` },
                          { k: "التقييمات", v: `${product.reviews}` },
                        ].map((s) => (
                          <div
                            key={s.k}
                            className="rounded-xl border border-showcase-foreground/10 bg-showcase-foreground/5 px-2 py-2 backdrop-blur-md"
                          >
                            <div className="text-[9px] text-showcase-muted sm:text-[10px]">
                              {s.k}
                            </div>
                            <div className="text-xs font-black text-showcase-foreground sm:text-sm">
                              {s.v}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => addToCart(product, 1)}
                        className="rounded-xl bg-showcase-foreground/95 px-3 py-3 text-xs font-bold text-showcase transition hover:bg-showcase-foreground sm:text-sm"
                      >
                        إضافة للسلة
                      </button>
                      <button
                        onClick={handleOrder}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-success px-3 py-3 text-xs font-bold text-success-foreground transition hover:bg-success/90 sm:text-sm"
                      >
                        <MessageCircle className="h-4 w-4" />
                        اطلب عبر واتساب
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModelStage({ src, poster }: { src: string; poster: string }) {
  const mounted = useMounted();
  if (!mounted) {
    return (
      <div className="grid h-full w-full place-items-center">
        <img src={poster} alt="" className="h-2/3 w-2/3 rounded-2xl object-cover opacity-70" />
      </div>
    );
  }
  return (
    <model-viewer
      src={src}
      alt="نموذج ثلاثي الأبعاد"
      camera-controls=""
      auto-rotate=""
      touch-action="pan-y"
      exposure="1.1"
      shadow-intensity="1"
      interaction-prompt="none"
      environment-image="neutral"
      style={
        {
          width: "100%",
          height: "100%",
          background: "transparent",
        } as CSSProperties
      }
    />
  );
}
