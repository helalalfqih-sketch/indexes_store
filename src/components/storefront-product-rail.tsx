import { Link } from "@tanstack/react-router";
import { ChevronLeft, Images, Play, ShoppingCart } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { OptimizedImage } from "@/components/optimized-image";
import type { LegacyProductShape } from "@/lib/data-adapter";
import { useCart } from "@/lib/cart-store";
import { formatPrice, type Product } from "@/lib/store-data";

const IMAGE_ROTATION_MS = 4500;

function uniqueImages(product: LegacyProductShape) {
  const mediaImages =
    product.media?.filter((item) => item.type === "image").map((item) => item.url) ?? [];
  return [...new Set([product.image, ...(product.images ?? []), ...mediaImages].filter(Boolean))];
}

function productHasVideo(product: LegacyProductShape) {
  return Boolean(
    product.videoPlaybackId ||
      product.videos?.some(Boolean) ||
      product.media?.some((item) => item.type === "video" && item.url),
  );
}

function ShowroomProductCard({
  product,
  eager = false,
}: {
  product: LegacyProductShape;
  eager?: boolean;
}) {
  const cart = useCart();
  const reducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLElement>(null);
  const images = useMemo(() => uniqueImages(product), [product]);
  const [activeImage, setActiveImage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const hasVideo = productHasVideo(product);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.isIntersecting ?? false),
      { rootMargin: "160px" },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setActiveImage(0);
    if (images.length < 2 || reducedMotion || !isVisible) return;
    const timer = window.setInterval(
      () => setActiveImage((current) => (current + 1) % images.length),
      IMAGE_ROTATION_MS,
    );
    return () => window.clearInterval(timer);
  }, [images, isVisible, reducedMotion]);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (reducedMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 5;
    const rotateX = -((event.clientY - rect.top) / rect.height - 0.5) * 5;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
  };

  const resetTilt = () => {
    if (cardRef.current) cardRef.current.style.transform = "";
  };

  const addToCart = () => {
    cart.add(product as Product);
    toast.success(`تمت إضافة "${product.name}" إلى السلة`);
  };

  return (
    <motion.article
      ref={cardRef}
      data-product-id={product.id}
      data-product-slug={product.slug}
      initial={reducedMotion ? false : { opacity: 0, x: 22 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      className="group relative flex w-[72vw] max-w-[270px] shrink-0 snap-start flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#07111f] shadow-[0_18px_50px_rgba(0,0,0,0.3)] transition-[transform,border-color,box-shadow] duration-200 sm:w-[260px] md:hover:border-cyan-400/40 md:hover:shadow-[0_22px_65px_rgba(14,165,233,0.16)]"
    >
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-[4/5] overflow-hidden bg-[#030813]"
      >
        <OptimizedImage
          key={images[activeImage] ?? product.image}
          src={images[activeImage] ?? product.image}
          alt={product.name}
          size="card"
          eager={eager}
          draggable={false}
          className="h-full w-full"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07111f] via-transparent to-transparent" />

        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          {images.length > 1 ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/70 px-2 py-1 text-[10px] font-bold text-white"
              aria-label={`${images.length} صور`}
            >
              <Images className="h-3 w-3" />
              {activeImage + 1}/{images.length}
            </span>
          ) : (
            <span />
          )}
          {hasVideo && (
            <span
              className="grid h-8 w-8 place-items-center rounded-full border border-cyan-300/30 bg-cyan-400/90 text-slate-950"
              aria-label="يتوفر فيديو للمنتج"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
            </span>
          )}
        </div>

        {images.length > 1 && !reducedMotion && (
          <div className="absolute inset-x-4 bottom-3 flex gap-1" aria-hidden="true">
            {images.slice(0, 6).map((image, index) => (
              <span
                key={image}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index === activeImage ? "bg-cyan-300" : "bg-white/25"
                }`}
              />
            ))}
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 text-start">
        <Link to="/product/$slug" params={{ slug: product.slug }} className="flex-1">
          <h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-white transition-colors group-hover:text-cyan-300">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-black text-cyan-300">{formatPrice(product.price)}</p>
            {product.oldPrice && product.oldPrice > product.price && (
              <p className="text-[10px] text-slate-500 line-through">
                {formatPrice(product.oldPrice)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={addToCart}
            aria-label={`أضف ${product.name} إلى السلة`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-cyan-300/50 hover:bg-cyan-300 hover:text-slate-950 active:scale-95"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export function StorefrontProductRail({
  title,
  eyebrow,
  products,
  href = "/search",
  eager = false,
}: {
  title: string;
  eyebrow?: string;
  products: LegacyProductShape[];
  href?: "/search" | "/offers";
  eager?: boolean;
}) {
  if (products.length === 0) return null;

  return (
    <section className="relative z-10 overflow-hidden py-2">
      <div className="mb-4 flex items-end justify-between gap-4 px-4">
        <div>
          {eyebrow && (
            <p className="mb-1 text-[10px] font-bold tracking-[0.28em] text-cyan-400">{eyebrow}</p>
          )}
          <h2 className="text-lg font-black text-showcase-foreground sm:text-xl">{title}</h2>
        </div>
        <Link
          to={href}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-showcase-muted transition hover:text-cyan-300"
        >
          الكل
          <ChevronLeft className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div
        dir="rtl"
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-5 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden sm:gap-4"
      >
        {products.map((product, index) => (
          <ShowroomProductCard
            key={product.id}
            product={product}
            eager={eager && index < 2}
          />
        ))}
        <div className="w-1 shrink-0" aria-hidden="true" />
      </div>
    </section>
  );
}
