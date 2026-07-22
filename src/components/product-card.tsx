import { Link } from "@tanstack/react-router";
import { Star, Play, X } from "lucide-react";
import { useState, useRef, type CSSProperties } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import type { Product } from "@/lib/store-data";
import type { LegacyProductShape } from "@/lib/data-adapter";
import { formatPrice } from "@/lib/store-data";
import { Product3DTile, useModelViewer } from "@/lib/model-viewer";
import MuxPlayer from "@mux/mux-player-react";
import { OptimizedImage } from "@/components/optimized-image";

import { useAppearance } from "@/components/appearance-provider";

export function ProductCard({
  product,
  eager = false,
}: {
  product: Product | LegacyProductShape;
  /** Above-the-fold cards: eager + high fetch priority (LCP optimization). */
  eager?: boolean;
}) {
  const { settings } = useAppearance();
  const lay = settings.products_layout;
  useModelViewer();
  const modelUrl = (product as LegacyProductShape).modelUrl ?? null;
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const [showVideo, setShowVideo] = useState(false);

  const ref = useRef<HTMLAnchorElement>(null);
  // Track card position within viewport: 0 = entering bottom, 0.5 = centered, 1 = exiting top
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const raw = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.25 });
  // Peak at center (0.5) → 1.04, softer at edges → 0.94
  const scale = useTransform(raw, [0, 0.5, 1], [0.94, 1.04, 0.94]);
  const opacity = useTransform(raw, [0, 0.5, 1], [0.55, 1, 0.55]);
  const brightness = useTransform(raw, [0, 0.5, 1], [0.85, 1.08, 0.85]);
  const filter = useTransform(brightness, (b) => `brightness(${b})`);

  return (
    <motion.div
      style={{ scale, opacity }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      data-product-id={product.id}
      data-product-slug={product.slug}
      data-product-name={product.name}
      data-product-price={product.price}
      className="will-change-transform"
    >
      <Link
        ref={ref}
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="group flex flex-col overflow-hidden rounded-2xl glass-dark shadow-card transition active:scale-[0.98]"
      >
        {lay.showImage !== false && (
          <motion.div style={{ filter }} className="relative aspect-square overflow-hidden bg-white/5">
            {modelUrl ? (
              // Only show 3D viewer if the product has a real custom GLB model
              <Product3DTile
                modelSrc={modelUrl}
                poster={product.image}
                alt={product.name}
              />
            ) : (
              // Default: clean, fast standard image
              <OptimizedImage
                src={product.image}
                alt={product.name}
                size="card"
                eager={eager}
                draggable={false}
                className="h-full w-full object-contain p-2"
              />
            )}
            
            {/* Explanatory Video Play Button */}
            {product.videoPlaybackId && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowVideo(true);
                }}
                className="absolute bottom-2 end-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg backdrop-blur-md transition hover:scale-110 active:scale-95"
                title="مشاهدة فيديو توضيحي"
              >
                <Play className="h-4 w-4 fill-white text-white translate-x-[1px]" />
              </button>
            )}

            {product.badge && (
              <span className="absolute end-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                {product.badge}
              </span>
            )}
            {lay.showDiscount !== false && discount > 0 && (
              <span className="absolute start-2 top-2 z-10 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
                -{discount}%
              </span>
            )}
          </motion.div>
        )}
        <div className="flex flex-1 flex-col gap-1.5 p-2.5 text-showcase-foreground">
          <h3 className="line-clamp-2 min-h-10 text-xs font-bold leading-tight text-showcase-foreground">
            {product.name}
          </h3>
          {lay.showRating !== false && (
            <div className="flex items-center gap-1 text-[10px] text-showcase-foreground/55">
              <Star className="h-3 w-3 fill-warning stroke-warning" />
              <span className="font-semibold text-showcase-foreground">{product.rating}</span>
              <span>({product.reviews})</span>
            </div>
          )}
          {lay.showPrice !== false && (
            <div className="mt-auto flex items-baseline gap-1.5">
              <span className="text-sm font-black text-primary">{formatPrice(product.price)}</span>
              {product.oldPrice && (
                <span className="text-[10px] text-showcase-foreground/50 line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Video Modal Overlay */}
      {showVideo && product.videoPlaybackId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-surface/90 shadow-2xl p-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowVideo(false);
              }}
              className="absolute top-4 end-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
              <MuxPlayer
                playbackId={product.videoPlaybackId}
                autoPlay={true}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <div className="p-4 text-start">
              <h4 className="text-sm font-black text-foreground">{product.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">فيديو توضيحي للمنتج</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
