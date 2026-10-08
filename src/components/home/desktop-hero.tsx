import { useEffect, useMemo, useRef, useState } from "react";
import { ProductGlobeCanvas } from "@/components/product-sphere-hero";
import { AiSearchPanel } from "@/components/home/ai-search-panel";
import {
  BannerBackdrop,
  BannerDots,
  OfferContent,
} from "@/components/home/exclusive-offers-banner";
import type { LegacyProductShape } from "@/lib/data-adapter";

/** Sphere diameter as a fraction of the square canvas box (shared with mobile). */
const PROJECTION = 0.872;

/**
 * Desktop (>=1024px) hero composition — Reference B.
 * Two columns: promotional copy on the left, the product globe on the right.
 * No sticky scroll timeline: desktop has room for the final composition from
 * the first paint, so the mobile immersive geometry is left untouched.
 */
export function DesktopHero({ products }: { products: LegacyProductShape[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(952);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return;
    const measure = () => setCw(Math.round(node.getBoundingClientRect().width) || 952);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const node = boxRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setVisible(entries[0]?.isIntersecting ?? true),
      { rootMargin: "200px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const geom = useMemo(() => {
    // Reference B banner ratio: height = 39.3% of the panel width, capped so a
    // 1440px screen never turns the hero into a full-screen block.
    const heroH = Math.round(Math.min(Math.max(cw * 0.393, 374), 560));
    const diameter = Math.round(heroH * 0.86);
    const base = Math.round(diameter / PROJECTION);
    return { heroH, base };
  }, [cw]);

  return (
    <div ref={boxRef}>
      <section
        aria-label="استكشاف المنتجات"
        className="relative overflow-hidden rounded-[24px] border border-[rgba(139,92,246,0.42)] bg-[linear-gradient(145deg,rgba(15,21,43,0.96),rgba(5,8,22,0.98))]"
        style={{ height: geom.heroH }}
      >
        <BannerBackdrop />
        {/* Explicit LTR grid so the globe is always physically on the right. */}
        <div
          dir="ltr"
          className="relative z-10 grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-8 pl-16 pr-6"
        >
          <div className="flex min-w-0 justify-start">
            <div dir="rtl">
              <OfferContent compact={false} />
            </div>
          </div>
          <div
            className="relative shrink-0"
            style={{ width: geom.base, height: geom.base, maxHeight: geom.heroH }}
          >
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ width: geom.base, height: geom.base }}
            >
              <ProductGlobeCanvas products={products} paused={!visible} exclusion={null} />
            </div>
          </div>
        </div>
        <BannerDots />
      </section>

      {/* Expanded AI search panel — full content width under the hero */}
      <div className="mt-4">
        <AiSearchPanel />
      </div>
    </div>
  );
}
