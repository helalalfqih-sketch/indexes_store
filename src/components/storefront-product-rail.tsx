import { Link } from "@tanstack/react-router";
import { ChevronLeft, Heart, Images, Play, ShoppingCart, Star } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { OptimizedImage } from "@/components/optimized-image";
import type { LegacyProductShape } from "@/lib/data-adapter";
import { useCart } from "@/lib/cart-store";
import { formatPrice, type Product } from "@/lib/store-data";
import { useFavorites } from "@/lib/use-favorites";

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
  const { isFavorite, toggleFavorite } = useFavorites();
  const reducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLElement>(null);
  const images = useMemo(() => uniqueImages(product), [product]);
  const [activeImage, setActiveImage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const hasVideo = productHasVideo(product);
  const favorite = isFavorite(product.id);
  const discount =
    product.oldPrice && product.oldPrice > product.price && product.price > 0
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0;

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
    const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 4;
    const rotateX = -((event.clientY - rect.top) / rect.height - 0.5) * 4;
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
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      className="group relative flex w-[44vw] min-w-[154px] max-w-[230px] shrink-0 snap-start flex-col overflow-hidden rounded-[24px] border border-violet-400/20 bg-[#080d1a] shadow-[0_18px_55px_rgba(0,0,0,0.34)] transition-[transform,border-color,box-shadow] duration-200 hover:border-violet-400/55 md:hover:shadow-[0_22px_70px_rgba(109,40,217,0.22)]"
    >
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden bg-[#040713]"
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080d1a] via-transparent to-transparent" />

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFavorite(product.id);
          }}
          aria-label={favorite ? `إزالة ${product.name} من المفضلة` : `إضافة ${product.name} إلى المفضلة`}
          aria-pressed={favorite}
          className="absolute start-2 top-2 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/55 text-white transition hover:bg-black/80"
        >
          <Heart className={`h-4 w-4 ${favorite ? "fill-fuchsia-500 text-fuchsia-400" : ""}`} />
        </button>

        <div className="absolute end-2 top-2 z-10 flex flex-col items-end gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-gradient-to-r from-violet-700 to-fuchsia-600 px-2 py-1 text-[9px] font-black text-white shadow-lg">
              خصم {discount}%
            </span>
          )}
          {hasVideo && (
            <span
              className="grid h-8 w-8 place-items-center rounded-full border border-violet-200/30 bg-violet-600/90 text-white"
              aria-label="يتوفر فيديو للمنتج"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
            </span>
          )}
        </div>

        {images.length > 1 && (
          <span className="absolute bottom-2 start-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/65 px-2 py-1 text-[9px] font-bold text-white">
            <Images className="h-3 w-3" />
            {activeImage + 1}/{images.length}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3 text-start sm:p-4">
        <Link to="/product/$slug" params={{ slug: product.slug }} className="flex-1">
          <h3 className="line-clamp-2 min-h-10 text-xs font-black leading-5 text-white transition-colors group-hover:text-violet-200 sm:text-sm">
            {product.name}
          </h3>
        </Link>

        {product.rating > 0 && (
          <div className="mt-1 flex items-center gap-1 text-[10px]">
            <Star className="h-3 w-3 fill-violet-500 text-violet-400" />
            <span className="font-bold text-violet-300">{product.rating.toFixed(1)}</span>
            {product.reviews > 0 && <span className="text-slate-500">({product.reviews})</span>}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <p className="text-sm font-black text-fuchsia-400 sm:text-base">{formatPrice(product.price)}</p>
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
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-violet-300/25 bg-gradient-to-r from-violet-800 to-fuchsia-700 px-2 text-[11px] font-black text-white shadow-[0_8px_24px_rgba(109,40,217,0.24)] transition hover:brightness-110 active:scale-[0.98] sm:text-xs"
        >
          <ShoppingCart className="h-4 w-4" />
          أضف للسلة
        </button>
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
            <p className="mb-1 text-[10px] font-bold tracking-[0.24em] text-fuchsia-400">{eyebrow}</p>
          )}
          <h2 className="text-lg font-black text-white sm:text-2xl">{title}</h2>
        </div>
        <Link
          to={href}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 px-2 text-xs font-bold text-violet-300 transition hover:text-fuchsia-300"
        >
          عرض الكل
          <ChevronLeft className="h-4 w-4" />
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
