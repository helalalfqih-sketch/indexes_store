import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import type { Product } from "@/lib/store-data";
import { formatPrice } from "@/lib/store-data";
import { Product3DTile, modelFor } from "@/lib/model-viewer";
import MuxPlayer from "@mux/mux-player-react";

export function ProductCard({ product }: { product: Product }) {
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

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
      style={{ scale, opacity } as any}
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
        className="group flex flex-col overflow-hidden rounded-2xl bg-surface shadow-card transition active:scale-[0.98]"
      >
        <motion.div
          style={{ filter } as any}
          className="relative aspect-square overflow-hidden bg-white"
        >
          {product.videoPlaybackId ? (
            <MuxPlayer
              playbackId={product.videoPlaybackId}
              autoPlay="muted"
              loop={true}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              } as any}
            />
          ) : (
            <Product3DTile
              modelSrc={modelFor(product.id)}
              poster={product.image}
              alt={product.name}
            />
          )}
          {product.badge && (
            <span className="absolute end-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="absolute start-2 top-2 z-10 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
              -{discount}%
            </span>
          )}
        </motion.div>
        <div className="flex flex-1 flex-col gap-1.5 p-2.5 text-slate-900">
          <h3 className="line-clamp-2 min-h-10 text-xs font-bold leading-tight text-slate-900">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 text-[10px] text-slate-600">
            <Star className="h-3 w-3 fill-warning stroke-warning" />
            <span className="font-semibold text-slate-900">{product.rating}</span>
            <span>({product.reviews})</span>
          </div>
          <div className="mt-auto flex items-baseline gap-1.5">
            <span className="text-sm font-black text-primary">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-[10px] text-slate-500 line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
