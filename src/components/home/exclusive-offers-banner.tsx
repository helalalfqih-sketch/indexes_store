import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

/**
 * Catalog banner pieces. The banner is the final state of the scroll-driven
 * hero: catalog copy on the left column, the globe on the right,
 * carousel indicators centred at the bottom. Promotion copy is storefront
 * content — no product, price or discount record is hard-coded here.
 */

export function OfferContent({ compact, width }: { compact: boolean; width?: number }) {
  return (
    <div
      className="flex flex-col justify-center gap-1 text-start"
      style={{ width: width ?? (compact ? 162 : 300) }}
    >
      <h2
        className="font-bold leading-none"
        style={{ fontSize: compact ? "clamp(17px, 5vw, 26px)" : 44 }}
      >
        استكشف المنتجات
      </h2>
      <p className="text-ink-muted" style={{ fontSize: compact ? "clamp(11px, 3.2vw, 15px)" : 26 }}>
        الأسعار والتوفر من بيانات الكتالوج
      </p>
      <p
        className="bg-linear-to-l from-neon to-neon-2 bg-clip-text font-extrabold leading-[1.05] text-transparent"
        style={{ fontSize: compact ? "clamp(38px, 12vw, 64px)" : 112 }}
      >
        INDEXES
      </p>
      <Link
        to="/search"
        search={{ q: "" }}
        className="press mt-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-linear-to-l from-neon to-neon-2 font-bold text-white shadow-[0_10px_25px_-8px_var(--neon)]"
        style={{
          height: compact ? 42 : 56,
          width: compact ? "100%" : 190,
          fontSize: compact ? 14 : 21,
        }}
      >
        تصفّح الآن
        <ChevronLeft className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function BannerDots({ count = 4 }: { count?: number }) {
  return (
    <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full"
          style={{ background: i === 0 ? "#F8FAFF" : "rgba(255,255,255,0.28)" }}
        />
      ))}
    </div>
  );
}

/** Subtle blue/purple radial lighting + fixed star field (no random values). */
export function BannerBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 78% 45%, rgba(124,44,255,0.30), transparent 62%), radial-gradient(90% 80% at 12% 70%, rgba(37,99,255,0.22), transparent 60%)",
        }}
      />
      {[
        [12, 22],
        [28, 68],
        [46, 18],
        [62, 82],
        [74, 34],
        [88, 60],
        [36, 44],
        [56, 58],
      ].map(([l, t], i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white/60"
          style={{
            left: `${l}%`,
            top: `${t}%`,
            width: i % 3 === 0 ? 2 : 1.5,
            height: i % 3 === 0 ? 2 : 1.5,
          }}
        />
      ))}
    </div>
  );
}
